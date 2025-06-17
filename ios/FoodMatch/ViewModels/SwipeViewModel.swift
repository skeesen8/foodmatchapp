import Foundation
import SwiftUI
import CoreLocation
import FirebaseFirestore

// MARK: - Swipe View Model
@MainActor
class SwipeViewModel: ObservableObject {
    
    // MARK: - Published Properties
    @Published var restaurants: [Restaurant] = []
    @Published var currentRestaurantIndex: Int = 0
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var showError: Bool = false
    @Published var hasMoreRestaurants: Bool = true
    
    // MARK: - Session Properties
    @Published var currentSession: SwipeSession?
    @Published var currentPair: UserPair?
    @Published var currentUser: User?
    
    // MARK: - Services
    private let yelpService = YelpService.shared
    private let firebaseService = FirebaseService.shared
    private let locationService = LocationService.shared
    
    // MARK: - Private Properties
    private var swipeListener: ListenerRegistration?
    private var currentLocation: CLLocation?
    private let maxRestaurantsPerSession = 50
    private var swipedRestaurantIds: Set<String> = []
    
    init() {
        setupLocationObserver()
    }
    
    deinit {
        swipeListener?.remove()
    }
    
    // MARK: - Setup Methods
    func setup(user: User, pair: UserPair) async {
        self.currentUser = user
        self.currentPair = pair
        
        await startSwipeSession()
        await loadRestaurants()
        setupSwipeListener()
    }
    
    private func setupLocationObserver() {
        // Observe location changes
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("LocationUpdated"),
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task {
                await self?.loadRestaurants()
            }
        }
    }
    
    // MARK: - Session Management
    private func startSwipeSession() async {
        guard let pair = currentPair else { return }
        
        do {
            let location = try await locationService.getCurrentLocation()
            self.currentLocation = location
            
            let geoPoint = GeoPoint(latitude: location.coordinate.latitude, longitude: location.coordinate.longitude)
            
            let session = SwipeSession(
                pairId: pair.id ?? "",
                sessionId: pair.sessionId ?? UUID().uuidString,
                location: geoPoint
            )
            
            let sessionId = try await firebaseService.createSwipeSession(session)
            var updatedSession = session
            updatedSession.id = sessionId
            self.currentSession = updatedSession
            
        } catch {
            handleError(error)
        }
    }
    
    // MARK: - Restaurant Loading
    func loadRestaurants() async {
        guard !isLoading else { return }
        
        isLoading = true
        
        do {
            let location = currentLocation ?? (try await locationService.getCurrentLocation())
            self.currentLocation = location
            
            let fetchedRestaurants = try await yelpService.searchRestaurants(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                radius: 16000, // 10 miles in meters
                limit: maxRestaurantsPerSession,
                openNow: currentUser?.preferences.openNow ?? true
            )
            
            // Filter out already swiped restaurants
            let newRestaurants = fetchedRestaurants.filter { !swipedRestaurantIds.contains($0.id) }
            
            self.restaurants = newRestaurants
            self.currentRestaurantIndex = 0
            self.hasMoreRestaurants = !newRestaurants.isEmpty
            
            // Update session with restaurant IDs
            if var session = currentSession {
                session.restaurantIds = newRestaurants.map { $0.id }
                try await firebaseService.updateSwipeSession(session)
                self.currentSession = session
            }
            
        } catch {
            handleError(error)
        }
        
        isLoading = false
    }
    
    func loadMoreRestaurants() async {
        // Load additional restaurants if needed
        await loadRestaurants()
    }
    
    // MARK: - Swipe Actions
    func swipeLeft() async {
        await performSwipe(direction: .left)
    }
    
    func swipeRight() async {
        await performSwipe(direction: .right)
    }
    
    func swipeUp() async {
        await performSwipe(direction: .up)
    }
    
    private func performSwipe(direction: SwipeDirection) async {
        guard let restaurant = currentRestaurant,
              let user = currentUser,
              let pair = currentPair,
              let session = currentSession else { return }
        
        do {
            let swipe = Swipe(
                userId: user.id ?? "",
                restaurantId: restaurant.id,
                pairId: pair.id ?? "",
                sessionId: session.sessionId,
                direction: direction,
                restaurantData: restaurant
            )
            
            _ = try await firebaseService.recordSwipe(swipe)
            
            // Add to swiped restaurants
            swipedRestaurantIds.insert(restaurant.id)
            
            // Move to next restaurant
            moveToNextRestaurant()
            
        } catch {
            handleError(error)
        }
    }
    
    // MARK: - Navigation
    private func moveToNextRestaurant() {
        if currentRestaurantIndex < restaurants.count - 1 {
            currentRestaurantIndex += 1
        } else {
            // No more restaurants, load more
            Task {
                await loadMoreRestaurants()
            }
        }
    }
    
    // MARK: - Computed Properties
    var currentRestaurant: Restaurant? {
        guard currentRestaurantIndex < restaurants.count else { return nil }
        return restaurants[currentRestaurantIndex]
    }
    
    var remainingRestaurants: Int {
        return max(0, restaurants.count - currentRestaurantIndex - 1)
    }
    
    var progressPercentage: Double {
        guard !restaurants.isEmpty else { return 0 }
        return Double(currentRestaurantIndex) / Double(restaurants.count)
    }
    
    // MARK: - Real-time Listeners
    private func setupSwipeListener() {
        guard let pair = currentPair,
              let session = currentSession else { return }
        
        swipeListener = firebaseService.listenToSwipes(
            pairId: pair.id ?? "",
            sessionId: session.sessionId
        ) { [weak self] swipes in
            Task { @MainActor in
                self?.handleSwipeUpdates(swipes)
            }
        }
    }
    
    private func handleSwipeUpdates(_ swipes: [Swipe]) {
        // Handle real-time swipe updates from the other user
        let otherUserSwipes = swipes.filter { $0.userId != currentUser?.id }
        
        // You could show indicators of what the other user has swiped
        // For now, just print for debugging
        for swipe in otherUserSwipes {
            print("Other user swiped \(swipe.direction.description) on \(swipe.restaurantData?.name ?? "Unknown")")
        }
    }
    
    // MARK: - Reset Session
    func resetSession() async {
        swipedRestaurantIds.removeAll()
        restaurants.removeAll()
        currentRestaurantIndex = 0
        
        await startSwipeSession()
        await loadRestaurants()
    }
    
    // MARK: - Error Handling
    private func handleError(_ error: Error) {
        errorMessage = error.localizedDescription
        showError = true
    }
    
    func clearError() {
        errorMessage = nil
        showError = false
    }
}

// MARK: - Swipe Gesture Helper
extension SwipeViewModel {
    func handleSwipeGesture(_ value: DragGesture.Value) async {
        let threshold: CGFloat = 100
        let horizontalMovement = value.translation.x
        let verticalMovement = value.translation.y
        
        if abs(horizontalMovement) > threshold {
            if horizontalMovement > 0 {
                // Swiped right
                await swipeRight()
            } else {
                // Swiped left
                await swipeLeft()
            }
        } else if verticalMovement < -threshold {
            // Swiped up
            await swipeUp()
        }
    }
} 