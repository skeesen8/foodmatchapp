import Foundation
import FirebaseFirestore

// MARK: - User Model
struct User: Identifiable, Codable {
    @DocumentID var id: String?
    let email: String
    let displayName: String
    let profileImageURL: String?
    let createdAt: Date
    var preferences: UserPreferences
    var currentPairId: String?
    var isActive: Bool
    
    private enum CodingKeys: String, CodingKey {
        case email, displayName, profileImageURL, createdAt, preferences, currentPairId, isActive
    }
    
    init(email: String, displayName: String, profileImageURL: String? = nil) {
        self.email = email
        self.displayName = displayName
        self.profileImageURL = profileImageURL
        self.createdAt = Date()
        self.preferences = UserPreferences()
        self.currentPairId = nil
        self.isActive = true
    }
}

// MARK: - User Preferences Model
struct UserPreferences: Codable {
    var maxDistance: Double = 10.0 // miles
    var priceRange: [String] = ["$", "$$", "$$$"] // Yelp price categories
    var cuisineTypes: [String] = [] // cuisine preferences
    var excludeChains: Bool = false
    var openNow: Bool = true
    
    init() {}
}

// MARK: - User Pair Model
struct UserPair: Identifiable, Codable {
    @DocumentID var id: String?
    let user1Id: String
    let user2Id: String
    let createdAt: Date
    var isActive: Bool
    var sessionId: String?
    var currentLocation: GeoPoint?
    
    private enum CodingKeys: String, CodingKey {
        case user1Id, user2Id, createdAt, isActive, sessionId, currentLocation
    }
    
    init(user1Id: String, user2Id: String) {
        self.user1Id = user1Id
        self.user2Id = user2Id
        self.createdAt = Date()
        self.isActive = true
        self.sessionId = UUID().uuidString
    }
    
    func getOtherUserId(currentUserId: String) -> String? {
        if user1Id == currentUserId {
            return user2Id
        } else if user2Id == currentUserId {
            return user1Id
        }
        return nil
    }
} 