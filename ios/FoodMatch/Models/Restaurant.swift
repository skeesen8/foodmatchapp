import Foundation
import CoreLocation

// MARK: - Restaurant Model
struct Restaurant: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let imageURL: String?
    let rating: Double
    let reviewCount: Int
    let price: String?
    let categories: [Category]
    let location: Location
    let phone: String?
    let distance: Double?
    let isClosed: Bool
    let url: String?
    
    // For SwiftUI List identification
    static func == (lhs: Restaurant, rhs: Restaurant) -> Bool {
        return lhs.id == rhs.id
    }
}

// MARK: - Category Model
struct Category: Codable, Identifiable {
    let id = UUID()
    let alias: String
    let title: String
    
    private enum CodingKeys: String, CodingKey {
        case alias, title
    }
}

// MARK: - Location Model  
struct Location: Codable {
    let address1: String?
    let address2: String?
    let address3: String?
    let city: String?
    let zipCode: String?
    let country: String?
    let state: String?
    let displayAddress: [String]
    
    private enum CodingKeys: String, CodingKey {
        case address1, address2, address3, city, country, state
        case zipCode = "zip_code"
        case displayAddress = "display_address"
    }
    
    var formattedAddress: String {
        return displayAddress.joined(separator: ", ")
    }
}

// MARK: - Yelp API Response Models
struct YelpSearchResponse: Codable {
    let businesses: [YelpBusiness]
    let total: Int
    let region: YelpRegion?
}

struct YelpBusiness: Codable {
    let id: String
    let alias: String?
    let name: String
    let imageUrl: String?
    let isClosed: Bool
    let url: String?
    let reviewCount: Int
    let categories: [YelpCategory]
    let rating: Double
    let coordinates: YelpCoordinates
    let transactions: [String]
    let price: String?
    let location: YelpLocation
    let phone: String?
    let displayPhone: String?
    let distance: Double?
    
    private enum CodingKeys: String, CodingKey {
        case id, alias, name, url, categories, rating, coordinates, transactions, price, location, phone
        case imageUrl = "image_url"
        case isClosed = "is_closed"
        case reviewCount = "review_count"
        case displayPhone = "display_phone"
        case distance
    }
    
    // Convert YelpBusiness to Restaurant
    func toRestaurant() -> Restaurant {
        return Restaurant(
            id: id,
            name: name,
            imageURL: imageUrl,
            rating: rating,
            reviewCount: reviewCount,
            price: price,
            categories: categories.map { Category(alias: $0.alias, title: $0.title) },
            location: Location(
                address1: location.address1,
                address2: location.address2,
                address3: location.address3,
                city: location.city,
                zipCode: location.zipCode,
                country: location.country,
                state: location.state,
                displayAddress: location.displayAddress
            ),
            phone: displayPhone,
            distance: distance,
            isClosed: isClosed,
            url: url
        )
    }
}

struct YelpCategory: Codable {
    let alias: String
    let title: String
}

struct YelpCoordinates: Codable {
    let latitude: Double
    let longitude: Double
}

struct YelpLocation: Codable {
    let address1: String?
    let address2: String?
    let address3: String?
    let city: String?
    let zipCode: String?
    let country: String?
    let state: String?
    let displayAddress: [String]
    
    private enum CodingKeys: String, CodingKey {
        case address1, address2, address3, city, country, state
        case zipCode = "zip_code"
        case displayAddress = "display_address"
    }
}

struct YelpRegion: Codable {
    let center: YelpCoordinates
} 