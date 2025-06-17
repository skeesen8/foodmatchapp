import SwiftUI
import FirebaseCore

@main
struct FoodMatchApp: App {
    
    init() {
        // Configure Firebase
        FirebaseApp.configure()
        
        // Configure location service
        LocationService.shared.requestLocationPermission()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(LocationService.shared)
                .environmentObject(FirebaseService.shared)
                .environmentObject(YelpService.shared)
        }
    }
} 