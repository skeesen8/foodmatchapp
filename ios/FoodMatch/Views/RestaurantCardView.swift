import SwiftUI

struct RestaurantCardView: View {
    let restaurant: Restaurant
    
    var body: some View {
        ZStack {
            // Card background
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.2), radius: 20, x: 0, y: 10)
            
            VStack(spacing: 0) {
                // Restaurant image
                restaurantImageView
                
                // Restaurant details
                restaurantDetailsView
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
    
    // MARK: - Restaurant Image
    private var restaurantImageView: some View {
        ZStack {
            if let imageURL = restaurant.imageURL, !imageURL.isEmpty {
                AsyncImage(url: URL(string: imageURL)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(LinearGradient(
                            colors: [.orange.opacity(0.3), .red.opacity(0.3)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .overlay(
                            ProgressView()
                                .scaleEffect(1.5)
                                .tint(.white)
                        )
                }
            } else {
                // Default placeholder image
                Rectangle()
                    .fill(LinearGradient(
                        colors: [.orange.opacity(0.6), .red.opacity(0.6)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .overlay(
                        VStack(spacing: 10) {
                            Image(systemName: "fork.knife")
                                .font(.system(size: 40, weight: .light))
                                .foregroundColor(.white)
                            
                            Text("No Image")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                        }
                    )
            }
            
            // Overlay gradient for better text readability
            LinearGradient(
                colors: [.clear, .black.opacity(0.3)],
                startPoint: .top,
                endPoint: .bottom
            )
            
            // Status badges
            VStack {
                HStack {
                    // Closed badge
                    if restaurant.isClosed {
                        StatusBadge(text: "CLOSED", color: .red)
                    }
                    
                    Spacer()
                    
                    // Price badge
                    if let price = restaurant.price {
                        StatusBadge(text: price, color: .green)
                    }
                }
                .padding(.top, 15)
                .padding(.horizontal, 15)
                
                Spacer()
            }
        }
        .frame(height: 300)
    }
    
    // MARK: - Restaurant Details
    private var restaurantDetailsView: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Name and rating
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(restaurant.name)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    
                    // Categories
                    Text(restaurant.categories.map { $0.title }.joined(separator: " • "))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                Spacer()
                
                // Rating
                ratingView
            }
            
            // Location and distance
            locationView
            
            // Additional info
            additionalInfoView
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    // MARK: - Rating View
    private var ratingView: some View {
        VStack(spacing: 4) {
            HStack(spacing: 2) {
                ForEach(0..<5, id: \.self) { index in
                    Image(systemName: index < Int(restaurant.rating) ? "star.fill" : "star")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
            
            Text("\(restaurant.rating, specifier: "%.1f")")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
            
            Text("(\(restaurant.reviewCount))")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Location View
    private var locationView: some View {
        HStack(spacing: 8) {
            Image(systemName: "location.fill")
                .font(.caption)
                .foregroundColor(.orange)
            
            Text(restaurant.location.formattedAddress)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            Spacer()
            
            if let distance = restaurant.distance {
                Text("\(distance / 1609.34, specifier: "%.1f") mi")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.orange)
            }
        }
    }
    
    // MARK: - Additional Info View
    private var additionalInfoView: some View {
        HStack(spacing: 12) {
            // Phone button
            if let phone = restaurant.phone, !phone.isEmpty {
                InfoButton(
                    icon: "phone.fill",
                    text: "Call",
                    color: .blue
                ) {
                    if let url = URL(string: "tel:\(phone)") {
                        UIApplication.shared.open(url)
                    }
                }
            }
            
            // Directions button
            InfoButton(
                icon: "location.fill",
                text: "Directions",
                color: .green
            ) {
                openInMaps()
            }
            
            // More info button
            if let url = restaurant.url {
                InfoButton(
                    icon: "safari.fill",
                    text: "More",
                    color: .orange
                ) {
                    if let webURL = URL(string: url) {
                        UIApplication.shared.open(webURL)
                    }
                }
            }
            
            Spacer()
        }
    }
    
    // MARK: - Helper Methods
    private func openInMaps() {
        let address = restaurant.location.formattedAddress.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        if let url = URL(string: "http://maps.apple.com/?q=\(address)") {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Supporting Views

struct StatusBadge: View {
    let text: String
    let color: Color
    
    var body: some View {
        Text(text)
            .font(.caption)
            .fontWeight(.bold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                Capsule()
                    .fill(color)
            )
    }
}

struct InfoButton: View {
    let icon: String
    let text: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                
                Text(text)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                Capsule()
                    .fill(color.opacity(0.1))
                    .overlay(
                        Capsule()
                            .stroke(color.opacity(0.3), lineWidth: 1)
                    )
            )
        }
    }
}

// MARK: - Preview
struct RestaurantCardView_Previews: PreviewProvider {
    static var previews: some View {
        let sampleRestaurant = Restaurant(
            id: "1",
            name: "The Amazing Restaurant",
            imageURL: "https://example.com/image.jpg",
            rating: 4.5,
            reviewCount: 234,
            price: "$$",
            categories: [
                Category(alias: "italian", title: "Italian"),
                Category(alias: "pizza", title: "Pizza")
            ],
            location: Location(
                address1: "123 Main St",
                address2: nil,
                address3: nil,
                city: "San Francisco",
                zipCode: "94102",
                country: "US",
                state: "CA",
                displayAddress: ["123 Main St", "San Francisco, CA 94102"]
            ),
            phone: "+14155551234",
            distance: 500.0,
            isClosed: false,
            url: "https://yelp.com/biz/amazing-restaurant"
        )
        
        RestaurantCardView(restaurant: sampleRestaurant)
            .frame(width: 350, height: 600)
            .padding()
    }
} 