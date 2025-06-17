import SwiftUI

struct ContentView: View {
    @State private var currentUser: User?
    @State private var currentPair: UserPair?
    @State private var showOnboarding = true
    
    var body: some View {
        NavigationView {
            Group {
                if showOnboarding {
                    onboardingView
                } else if let user = currentUser, let pair = currentPair {
                    SwipeView(user: user, pair: pair)
                } else {
                    loadingView
                }
            }
        }
        .navigationBarHidden(true)
    }
    
    // MARK: - Onboarding View
    private var onboardingView: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // App Icon/Logo
            Image(systemName: "fork.knife.circle.fill")
                .font(.system(size: 100))
                .foregroundColor(.orange)
            
            VStack(spacing: 10) {
                Text("FoodMatch")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Swipe on restaurants with friends")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            VStack(spacing: 20) {
                Text("🍕 Discover great restaurants")
                Text("👥 Swipe with friends or dates")
                Text("💖 Match on the perfect place")
            }
            .font(.headline)
            .foregroundColor(.primary)
            
            Spacer()
            
            Button("Get Started") {
                setupDemoUser()
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .font(.headline)
            
            Text("This is a demo version")
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.bottom)
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.orange.opacity(0.1), Color.red.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
        )
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(2)
            
            Text("Setting up your session...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
    
    // MARK: - Setup Demo User
    private func setupDemoUser() {
        // Create demo users for testing
        let user1 = User(
            email: "demo@foodmatch.com",
            displayName: "Demo User"
        )
        
        let user2 = User(
            email: "friend@foodmatch.com",
            displayName: "Demo Friend"
        )
        
        // Create demo pair
        let pair = UserPair(
            user1Id: user1.id ?? "user1",
            user2Id: user2.id ?? "user2"
        )
        
        // Set current user and pair
        currentUser = user1
        currentPair = pair
        showOnboarding = false
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(LocationService.shared)
            .environmentObject(FirebaseService.shared)
            .environmentObject(YelpService.shared)
    }
} 