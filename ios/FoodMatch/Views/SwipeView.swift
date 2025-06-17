import SwiftUI

struct SwipeView: View {
    @StateObject private var viewModel = SwipeViewModel()
    @State private var dragOffset = CGSize.zero
    @State private var rotationAngle: Double = 0
    @State private var showMatchPopup = false
    
    let user: User
    let pair: UserPair
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [Color.orange.opacity(0.3), Color.red.opacity(0.3)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    headerView
                    
                    // Main swipe area
                    swipeAreaView(geometry: geometry)
                    
                    // Action buttons
                    actionButtonsView
                }
            }
        }
        .task {
            await viewModel.setup(user: user, pair: pair)
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK") {
                viewModel.clearError()
            }
        } message: {
            Text(viewModel.errorMessage ?? "An error occurred")
        }
        .overlay(
            // Loading overlay
            Group {
                if viewModel.isLoading {
                    LoadingView()
                }
            }
        )
    }
    
    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading) {
                    Text("FoodMatch")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("Finding restaurants nearby...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Progress indicator
                if !viewModel.restaurants.isEmpty {
                    VStack {
                        Text("\(viewModel.remainingRestaurants) left")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        ProgressView(value: viewModel.progressPercentage)
                            .frame(width: 60)
                    }
                }
            }
            .padding(.horizontal)
            
            Divider()
        }
        .padding(.top)
    }
    
    // MARK: - Swipe Area
    private func swipeAreaView(geometry: GeometryProxy) -> some View {
        ZStack {
            if let restaurant = viewModel.currentRestaurant {
                RestaurantCardView(restaurant: restaurant)
                    .frame(width: geometry.size.width * 0.9, height: geometry.size.height * 0.65)
                    .offset(dragOffset)
                    .rotationEffect(.degrees(rotationAngle))
                    .scaleEffect(1.0 - abs(dragOffset.width) / 1000)
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                dragOffset = value.translation
                                rotationAngle = Double(value.translation.x / 10)
                            }
                            .onEnded { value in
                                Task {
                                    await handleSwipeEnd(value)
                                }
                            }
                    )
                    .animation(.spring(response: 0.6, dampingFraction: 0.8), value: dragOffset)
                    .animation(.spring(response: 0.6, dampingFraction: 0.8), value: rotationAngle)
                
                // Swipe indicators
                swipeIndicatorsView
                
            } else if !viewModel.isLoading {
                // No more restaurants
                noMoreRestaurantsView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Swipe Indicators
    private var swipeIndicatorsView: some View {
        ZStack {
            // Left swipe indicator (Pass)
            if dragOffset.width < -50 {
                SwipeIndicator(
                    text: "PASS",
                    color: .red,
                    icon: "xmark.circle.fill"
                )
                .opacity(min(abs(dragOffset.width) / 100, 1.0))
                .scaleEffect(1.0 + min(abs(dragOffset.width) / 500, 0.3))
            }
            
            // Right swipe indicator (Like)
            if dragOffset.width > 50 {
                SwipeIndicator(
                    text: "LIKE",
                    color: .green,
                    icon: "heart.circle.fill"
                )
                .opacity(min(dragOffset.width / 100, 1.0))
                .scaleEffect(1.0 + min(dragOffset.width / 500, 0.3))
            }
            
            // Up swipe indicator (Love)
            if dragOffset.height < -50 {
                SwipeIndicator(
                    text: "LOVE",
                    color: .purple,
                    icon: "star.circle.fill"
                )
                .opacity(min(abs(dragOffset.height) / 100, 1.0))
                .scaleEffect(1.0 + min(abs(dragOffset.height) / 500, 0.3))
            }
        }
    }
    
    // MARK: - Action Buttons
    private var actionButtonsView: some View {
        HStack(spacing: 40) {
            // Pass button
            ActionButton(
                icon: "xmark",
                color: .red,
                size: 50
            ) {
                Task {
                    await performButtonSwipe(.left)
                }
            }
            
            // Super like button
            ActionButton(
                icon: "star.fill",
                color: .purple,
                size: 45
            ) {
                Task {
                    await performButtonSwipe(.up)
                }
            }
            
            // Like button
            ActionButton(
                icon: "heart.fill",
                color: .green,
                size: 50
            ) {
                Task {
                    await performButtonSwipe(.right)
                }
            }
        }
        .padding(.bottom, 50)
        .disabled(viewModel.currentRestaurant == nil)
    }
    
    // MARK: - No More Restaurants
    private var noMoreRestaurantsView: some View {
        VStack(spacing: 20) {
            Image(systemName: "fork.knife.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.orange)
            
            Text("No More Restaurants")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("You've seen all the restaurants in your area!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Refresh") {
                Task {
                    await viewModel.resetSession()
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding()
    }
    
    // MARK: - Helper Methods
    private func handleSwipeEnd(_ value: DragGesture.Value) async {
        let threshold: CGFloat = 100
        
        if abs(value.translation.x) > threshold || abs(value.translation.y) > threshold {
            await viewModel.handleSwipeGesture(value)
        }
        
        // Reset position
        withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
            dragOffset = .zero
            rotationAngle = 0
        }
    }
    
    private func performButtonSwipe(_ direction: SwipeDirection) async {
        // Animate the card off screen
        withAnimation(.easeIn(duration: 0.3)) {
            switch direction {
            case .left:
                dragOffset = CGSize(width: -500, height: 0)
            case .right:
                dragOffset = CGSize(width: 500, height: 0)
            case .up:
                dragOffset = CGSize(width: 0, height: -500)
            }
        }
        
        // Perform the swipe
        switch direction {
        case .left:
            await viewModel.swipeLeft()
        case .right:
            await viewModel.swipeRight()
        case .up:
            await viewModel.swipeUp()
        }
        
        // Reset position
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                dragOffset = .zero
                rotationAngle = 0
            }
        }
    }
}

// MARK: - Supporting Views

struct SwipeIndicator: View {
    let text: String
    let color: Color
    let icon: String
    
    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.system(size: 40, weight: .bold))
                .foregroundColor(color)
            
            Text(text)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(color.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 15)
                        .stroke(color, lineWidth: 3)
                )
        )
    }
}

struct ActionButton: View {
    let icon: String
    let color: Color
    let size: CGFloat
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: size * 0.4, weight: .bold))
                .foregroundColor(.white)
                .frame(width: size, height: size)
                .background(
                    Circle()
                        .fill(color)
                        .shadow(color: color.opacity(0.3), radius: 10, x: 0, y: 5)
                )
        }
        .scaleEffect(1.0)
        .animation(.easeInOut(duration: 0.1), value: size)
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                ProgressView()
                    .scaleEffect(1.5)
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                
                Text("Loading restaurants...")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .padding(30)
            .background(
                RoundedRectangle(cornerRadius: 15)
                    .fill(.ultraThinMaterial)
            )
        }
    }
}

// MARK: - Preview
struct SwipeView_Previews: PreviewProvider {
    static var previews: some View {
        let sampleUser = User(email: "test@example.com", displayName: "Test User")
        let samplePair = UserPair(user1Id: "user1", user2Id: "user2")
        
        SwipeView(user: sampleUser, pair: samplePair)
    }
} 