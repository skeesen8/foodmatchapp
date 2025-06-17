import Foundation
import CoreLocation

// MARK: - Yelp Service
class YelpService: ObservableObject {
    static let shared = YelpService()
    
    private let baseURL = "https://api.yelp.com/v3"
    private let apiKey = "h3x9SRiBhdAEYRLhBISqxbE0vNmTLfmPcsF57gczs3_m6c0125FXex5R7FsvXJbdbBMN8E8R8VyB7Sm86GKc3zctc2PTVmmy7K1fuBzKasuxHw7L9CHm-zfwByE-aHYx" // Your Yelp API key
    
    private init() {}
    
    // MARK: - Search Restaurants
    func searchRestaurants(
        latitude: Double,
        longitude: Double,
        radius: Int = 10000, // 10km in meters
        categories: String = "restaurants",
        price: String = "1,2,3,4",
        limit: Int = 50,
        openNow: Bool = true
    ) async throws -> [Restaurant] {
        
        guard !apiKey.isEmpty && apiKey != "YOUR_YELP_API_KEY" else {
            throw YelpError.missingAPIKey
        }
        
        let url = buildSearchURL(
            latitude: latitude,
            longitude: longitude,
            radius: radius,
            categories: categories,
            price: price,
            limit: limit,
            openNow: openNow
        )
        
        let restaurants = try await performRequest(url: url)
        return restaurants
    }
    
    // MARK: - Get Restaurant Details
    func getRestaurantDetails(restaurantId: String) async throws -> Restaurant {
        guard !apiKey.isEmpty && apiKey != "YOUR_YELP_API_KEY" else {
            throw YelpError.missingAPIKey
        }
        
        let urlString = "\(baseURL)/businesses/\(restaurantId)"
        guard let url = URL(string: urlString) else {
            throw YelpError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.httpMethod = "GET"
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw YelpError.invalidResponse
            }
            
            guard httpResponse.statusCode == 200 else {
                throw YelpError.httpError(httpResponse.statusCode)
            }
            
            let yelpBusiness = try JSONDecoder().decode(YelpBusiness.self, from: data)
            return yelpBusiness.toRestaurant()
            
        } catch {
            throw YelpError.decodingError(error.localizedDescription)
        }
    }
    
    // MARK: - Private Helper Methods
    private func buildSearchURL(
        latitude: Double,
        longitude: Double,
        radius: Int,
        categories: String,
        price: String,
        limit: Int,
        openNow: Bool
    ) -> URL? {
        
        var components = URLComponents(string: "\(baseURL)/businesses/search")
        components?.queryItems = [
            URLQueryItem(name: "latitude", value: String(latitude)),
            URLQueryItem(name: "longitude", value: String(longitude)),
            URLQueryItem(name: "radius", value: String(radius)),
            URLQueryItem(name: "categories", value: categories),
            URLQueryItem(name: "price", value: price),
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "open_now", value: String(openNow))
        ]
        
        return components?.url
    }
    
    private func performRequest(url: URL?) async throws -> [Restaurant] {
        guard let url = url else {
            throw YelpError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.httpMethod = "GET"
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw YelpError.invalidResponse
            }
            
            guard httpResponse.statusCode == 200 else {
                throw YelpError.httpError(httpResponse.statusCode)
            }
            
            let searchResponse = try JSONDecoder().decode(YelpSearchResponse.self, from: data)
            return searchResponse.businesses.map { $0.toRestaurant() }
            
        } catch {
            if error is YelpError {
                throw error
            } else {
                throw YelpError.decodingError(error.localizedDescription)
            }
        }
    }
}

// MARK: - Yelp Error Types
enum YelpError: LocalizedError {
    case missingAPIKey
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case decodingError(String)
    
    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "Yelp API key is missing. Please add your API key to YelpService."
        case .invalidURL:
            return "Invalid URL for Yelp API request."
        case .invalidResponse:
            return "Invalid response from Yelp API."
        case .httpError(let statusCode):
            return "HTTP error with status code: \(statusCode)"
        case .decodingError(let message):
            return "Failed to decode Yelp API response: \(message)"
        }
    }
}

// MARK: - Search Parameters Helper
struct YelpSearchParameters {
    let latitude: Double
    let longitude: Double
    let radius: Int
    let categories: [String]
    let priceRange: [String]
    let limit: Int
    let openNow: Bool
    let sortBy: YelpSortBy
    
    init(
        latitude: Double,
        longitude: Double,
        radius: Int = 10000,
        categories: [String] = ["restaurants"],
        priceRange: [String] = ["1", "2", "3", "4"],
        limit: Int = 50,
        openNow: Bool = true,
        sortBy: YelpSortBy = .distance
    ) {
        self.latitude = latitude
        self.longitude = longitude
        self.radius = radius
        self.categories = categories
        self.priceRange = priceRange
        self.limit = limit
        self.openNow = openNow
        self.sortBy = sortBy
    }
    
    var categoriesString: String {
        return categories.joined(separator: ",")
    }
    
    var priceString: String {
        return priceRange.joined(separator: ",")
    }
}

enum YelpSortBy: String {
    case bestMatch = "best_match"
    case rating = "rating"
    case reviewCount = "review_count"
    case distance = "distance"
} 