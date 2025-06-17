import Foundation
import FirebaseFirestore

// MARK: - Swipe Model
struct Swipe: Identifiable, Codable {
    @DocumentID var id: String?
    let userId: String
    let restaurantId: String
    let pairId: String
    let sessionId: String
    let direction: SwipeDirection
    let timestamp: Date
    var restaurantData: Restaurant? // Cache restaurant data
    
    private enum CodingKeys: String, CodingKey {
        case userId, restaurantId, pairId, sessionId, direction, timestamp, restaurantData
    }
    
    init(userId: String, restaurantId: String, pairId: String, sessionId: String, direction: SwipeDirection, restaurantData: Restaurant? = nil) {
        self.userId = userId
        self.restaurantId = restaurantId
        self.pairId = pairId
        self.sessionId = sessionId
        self.direction = direction
        self.timestamp = Date()
        self.restaurantData = restaurantData
    }
}

// MARK: - Swipe Direction Enum
enum SwipeDirection: String, Codable, CaseIterable {
    case left = "left"   // Dislike
    case right = "right" // Like
    case up = "up"       // Super like (optional)
    
    var emoji: String {
        switch self {
        case .left: return "👎"
        case .right: return "👍"
        case .up: return "⭐"
        }
    }
    
    var description: String {
        switch self {
        case .left: return "Pass"
        case .right: return "Like"
        case .up: return "Love"
        }
    }
}

// MARK: - Match Model
struct Match: Identifiable, Codable {
    @DocumentID var id: String?
    let pairId: String
    let restaurantId: String
    let user1Id: String
    let user2Id: String
    let user1SwipeId: String
    let user2SwipeId: String
    let timestamp: Date
    var restaurantData: Restaurant?
    var isViewed: Bool = false
    var chatId: String?
    
    private enum CodingKeys: String, CodingKey {
        case pairId, restaurantId, user1Id, user2Id, user1SwipeId, user2SwipeId, timestamp, restaurantData, isViewed, chatId
    }
    
    init(pairId: String, restaurantId: String, user1Id: String, user2Id: String, user1SwipeId: String, user2SwipeId: String, restaurantData: Restaurant? = nil) {
        self.pairId = pairId
        self.restaurantId = restaurantId
        self.user1Id = user1Id
        self.user2Id = user2Id
        self.user1SwipeId = user1SwipeId
        self.user2SwipeId = user2SwipeId
        self.timestamp = Date()
        self.restaurantData = restaurantData
        self.isViewed = false
        self.chatId = nil
    }
}

// MARK: - Swipe Session Model
struct SwipeSession: Identifiable, Codable {
    @DocumentID var id: String?
    let pairId: String
    let sessionId: String
    let startedAt: Date
    var endedAt: Date?
    var location: GeoPoint?
    var restaurantIds: [String] = []
    var isActive: Bool = true
    
    private enum CodingKeys: String, CodingKey {
        case pairId, sessionId, startedAt, endedAt, location, restaurantIds, isActive
    }
    
    init(pairId: String, sessionId: String, location: GeoPoint? = nil) {
        self.pairId = pairId
        self.sessionId = sessionId
        self.startedAt = Date()
        self.location = location
    }
    
    mutating func endSession() {
        self.endedAt = Date()
        self.isActive = false
    }
    
    mutating func addRestaurantId(_ restaurantId: String) {
        if !restaurantIds.contains(restaurantId) {
            restaurantIds.append(restaurantId)
        }
    }
} 