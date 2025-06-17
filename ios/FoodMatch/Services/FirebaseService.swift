import Foundation
import FirebaseFirestore
import FirebaseAuth
import CoreLocation

// MARK: - Firebase Service
class FirebaseService: ObservableObject {
    static let shared = FirebaseService()
    
    private let db = Firestore.firestore()
    private let auth = Auth.auth()
    
    // Collection references
    private let usersCollection = "users"
    private let pairsCollection = "pairs"
    private let swipesCollection = "swipes"
    private let matchesCollection = "matches"
    private let sessionsCollection = "swipe_sessions"
    
    private init() {
        // Configure Firestore settings
        let settings = FirestoreSettings()
        settings.isPersistenceEnabled = true
        db.settings = settings
    }
    
    // MARK: - User Management
    func createUser(_ user: User) async throws {
        do {
            let userRef = db.collection(usersCollection).document(user.id ?? UUID().uuidString)
            try userRef.setData(from: user)
        } catch {
            throw FirebaseError.userCreationFailed(error.localizedDescription)
        }
    }
    
    func getUser(userId: String) async throws -> User {
        do {
            let document = try await db.collection(usersCollection).document(userId).getDocument()
            guard document.exists else {
                throw FirebaseError.userNotFound
            }
            return try document.data(as: User.self)
        } catch {
            throw FirebaseError.userFetchFailed(error.localizedDescription)
        }
    }
    
    func updateUser(_ user: User) async throws {
        guard let userId = user.id else {
            throw FirebaseError.invalidUserId
        }
        
        do {
            let userRef = db.collection(usersCollection).document(userId)
            try userRef.setData(from: user, merge: true)
        } catch {
            throw FirebaseError.userUpdateFailed(error.localizedDescription)
        }
    }
    
    // MARK: - User Pairing
    func createPair(user1Id: String, user2Id: String) async throws -> UserPair {
        let pair = UserPair(user1Id: user1Id, user2Id: user2Id)
        
        do {
            let pairRef = db.collection(pairsCollection).document()
            try pairRef.setData(from: pair)
            
            // Update both users with the pair ID
            try await updateUserPairId(userId: user1Id, pairId: pairRef.documentID)
            try await updateUserPairId(userId: user2Id, pairId: pairRef.documentID)
            
            var updatedPair = pair
            updatedPair.id = pairRef.documentID
            return updatedPair
            
        } catch {
            throw FirebaseError.pairCreationFailed(error.localizedDescription)
        }
    }
    
    func getPair(pairId: String) async throws -> UserPair {
        do {
            let document = try await db.collection(pairsCollection).document(pairId).getDocument()
            guard document.exists else {
                throw FirebaseError.pairNotFound
            }
            return try document.data(as: UserPair.self)
        } catch {
            throw FirebaseError.pairFetchFailed(error.localizedDescription)
        }
    }
    
    private func updateUserPairId(userId: String, pairId: String) async throws {
        let userRef = db.collection(usersCollection).document(userId)
        try await userRef.updateData(["currentPairId": pairId])
    }
    
    // MARK: - Swipe Management
    func recordSwipe(_ swipe: Swipe) async throws -> String {
        do {
            let swipeRef = db.collection(swipesCollection).document()
            try swipeRef.setData(from: swipe)
            
            // Check for potential match
            if swipe.direction == .right {
                try await checkForMatch(swipe: swipe, swipeId: swipeRef.documentID)
            }
            
            return swipeRef.documentID
        } catch {
            throw FirebaseError.swipeRecordFailed(error.localizedDescription)
        }
    }
    
    func getSwipesForUser(userId: String, sessionId: String) async throws -> [Swipe] {
        do {
            let query = db.collection(swipesCollection)
                .whereField("userId", isEqualTo: userId)
                .whereField("sessionId", isEqualTo: sessionId)
                .order(by: "timestamp", descending: true)
            
            let snapshot = try await query.getDocuments()
            return try snapshot.documents.compactMap { document in
                try document.data(as: Swipe.self)
            }
        } catch {
            throw FirebaseError.swipeFetchFailed(error.localizedDescription)
        }
    }
    
    private func checkForMatch(swipe: Swipe, swipeId: String) async throws {
        // Get the other user's ID from the pair
        let pair = try await getPair(pairId: swipe.pairId)
        let otherUserId = pair.getOtherUserId(currentUserId: swipe.userId)
        
        guard let otherUserId = otherUserId else { return }
        
        // Check if the other user has swiped right on the same restaurant
        let query = db.collection(swipesCollection)
            .whereField("userId", isEqualTo: otherUserId)
            .whereField("restaurantId", isEqualTo: swipe.restaurantId)
            .whereField("pairId", isEqualTo: swipe.pairId)
            .whereField("sessionId", isEqualTo: swipe.sessionId)
            .whereField("direction", isEqualTo: SwipeDirection.right.rawValue)
        
        do {
            let snapshot = try await query.getDocuments()
            
            if let otherSwipeDoc = snapshot.documents.first {
                let otherSwipe = try otherSwipeDoc.data(as: Swipe.self)
                
                // Create a match
                let match = Match(
                    pairId: swipe.pairId,
                    restaurantId: swipe.restaurantId,
                    user1Id: swipe.userId,
                    user2Id: otherUserId,
                    user1SwipeId: swipeId,
                    user2SwipeId: otherSwipeDoc.documentID,
                    restaurantData: swipe.restaurantData
                )
                
                try await createMatch(match)
            }
        } catch {
            print("Error checking for match: \(error)")
        }
    }
    
    // MARK: - Match Management
    private func createMatch(_ match: Match) async throws {
        let matchRef = db.collection(matchesCollection).document()
        try matchRef.setData(from: match)
        
        // TODO: Send push notifications to both users
        await sendMatchNotifications(match: match)
    }
    
    func getMatchesForPair(pairId: String) async throws -> [Match] {
        do {
            let query = db.collection(matchesCollection)
                .whereField("pairId", isEqualTo: pairId)
                .order(by: "timestamp", descending: true)
            
            let snapshot = try await query.getDocuments()
            return try snapshot.documents.compactMap { document in
                try document.data(as: Match.self)
            }
        } catch {
            throw FirebaseError.matchFetchFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Session Management
    func createSwipeSession(_ session: SwipeSession) async throws -> String {
        do {
            let sessionRef = db.collection(sessionsCollection).document()
            try sessionRef.setData(from: session)
            return sessionRef.documentID
        } catch {
            throw FirebaseError.sessionCreationFailed(error.localizedDescription)
        }
    }
    
    func updateSwipeSession(_ session: SwipeSession) async throws {
        guard let sessionId = session.id else {
            throw FirebaseError.invalidSessionId
        }
        
        do {
            let sessionRef = db.collection(sessionsCollection).document(sessionId)
            try sessionRef.setData(from: session, merge: true)
        } catch {
            throw FirebaseError.sessionUpdateFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Real-time Listeners
    func listenToMatches(pairId: String, completion: @escaping ([Match]) -> Void) -> ListenerRegistration {
        return db.collection(matchesCollection)
            .whereField("pairId", isEqualTo: pairId)
            .order(by: "timestamp", descending: true)
            .addSnapshotListener { snapshot, error in
                guard let documents = snapshot?.documents else {
                    print("Error fetching matches: \(error?.localizedDescription ?? "Unknown error")")
                    return
                }
                
                let matches = documents.compactMap { document in
                    try? document.data(as: Match.self)
                }
                completion(matches)
            }
    }
    
    func listenToSwipes(pairId: String, sessionId: String, completion: @escaping ([Swipe]) -> Void) -> ListenerRegistration {
        return db.collection(swipesCollection)
            .whereField("pairId", isEqualTo: pairId)
            .whereField("sessionId", isEqualTo: sessionId)
            .order(by: "timestamp", descending: true)
            .addSnapshotListener { snapshot, error in
                guard let documents = snapshot?.documents else {
                    print("Error fetching swipes: \(error?.localizedDescription ?? "Unknown error")")
                    return
                }
                
                let swipes = documents.compactMap { document in
                    try? document.data(as: Swipe.self)
                }
                completion(swipes)
            }
    }
    
    // MARK: - Push Notifications
    private func sendMatchNotifications(match: Match) async {
        // TODO: Implement push notification logic
        print("🎉 Match found! Restaurant: \(match.restaurantData?.name ?? "Unknown")")
    }
}

// MARK: - Firebase Error Types
enum FirebaseError: LocalizedError {
    case userCreationFailed(String)
    case userNotFound
    case userFetchFailed(String)
    case userUpdateFailed(String)
    case invalidUserId
    case pairCreationFailed(String)
    case pairNotFound
    case pairFetchFailed(String)
    case swipeRecordFailed(String)
    case swipeFetchFailed(String)
    case matchFetchFailed(String)
    case sessionCreationFailed(String)
    case sessionUpdateFailed(String)
    case invalidSessionId
    
    var errorDescription: String? {
        switch self {
        case .userCreationFailed(let message):
            return "Failed to create user: \(message)"
        case .userNotFound:
            return "User not found"
        case .userFetchFailed(let message):
            return "Failed to fetch user: \(message)"
        case .userUpdateFailed(let message):
            return "Failed to update user: \(message)"
        case .invalidUserId:
            return "Invalid user ID"
        case .pairCreationFailed(let message):
            return "Failed to create pair: \(message)"
        case .pairNotFound:
            return "Pair not found"
        case .pairFetchFailed(let message):
            return "Failed to fetch pair: \(message)"
        case .swipeRecordFailed(let message):
            return "Failed to record swipe: \(message)"
        case .swipeFetchFailed(let message):
            return "Failed to fetch swipes: \(message)"
        case .matchFetchFailed(let message):
            return "Failed to fetch matches: \(message)"
        case .sessionCreationFailed(let message):
            return "Failed to create session: \(message)"
        case .sessionUpdateFailed(let message):
            return "Failed to update session: \(message)"
        case .invalidSessionId:
            return "Invalid session ID"
        }
    }
} 