# FoodMatch App 🍽️

A restaurant matching app that works like Bumble - swipe on restaurants with friends or dates until you both match on the perfect place to eat!

## 🎯 Concept
Users pair with friends or dates and swipe through nearby restaurants. When both users swipe right on the same restaurant, it's a match! Perfect for deciding where to eat together.

## 🛠 Tech Stack

### Frontend (iOS)
- **Swift & SwiftUI** - Modern iOS development
- **CoreLocation** - User geolocation
- **URLSession** - API networking
- **UserNotifications** - Push notifications

### Backend
- **Node.js with Express** - RESTful API server
- **Firebase Firestore** - Real-time database
- **Firebase Authentication** - User authentication
- **Firebase Cloud Messaging** - Push notifications

### External APIs
- **Yelp Fusion API** - Restaurant data and search

## 📱 Core Features

### User Management
- [ ] User authentication (email/phone/social)
- [ ] User profile creation and editing
- [ ] Friend/date pairing system

### Restaurant Discovery
- [ ] Location-based restaurant fetching
- [ ] Yelp API integration with filters
- [ ] Swipe interface (Tinder-style)
- [ ] Restaurant details view

### Matching System
- [ ] Real-time swipe synchronization
- [ ] Match detection algorithm
- [ ] Match notifications
- [ ] Chat functionality for matched restaurants

### Additional Features
- [ ] Push notifications
- [ ] Offline mode
- [ ] Restaurant preferences/filters
- [ ] Match history

## 🏗 Project Structure

```
foodmatchapp/
├── ios/                    # iOS SwiftUI app
│   ├── FoodMatch/
│   │   ├── Models/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   ├── Services/
│   │   └── Utils/
│   └── FoodMatch.xcodeproj
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   └── middleware/
│   ├── package.json
│   └── server.js
├── shared/               # Shared configuration
│   ├── firebase-config.json
│   └── api-keys.example.json
└── docs/                # Documentation
    ├── api.md
    └── setup.md
```

## 🚀 Getting Started

### Prerequisites
- Xcode 15+ (for iOS development)
- Node.js 18+ (for backend)
- Firebase project
- Yelp API key

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd foodmatchapp
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp ../shared/api-keys.example.json api-keys.json
   # Add your API keys to api-keys.json
   npm start
   ```

3. **iOS Setup**
   - Open `ios/FoodMatch.xcodeproj` in Xcode
   - Configure signing & capabilities
   - Add your Firebase configuration
   - Build and run

### API Keys Required
- Yelp Fusion API key
- Firebase configuration
- Apple Developer account (for iOS deployment)

## 📋 Development Roadmap

### Phase 1: Foundation
- [ ] Basic iOS app structure
- [ ] Backend API setup
- [ ] User authentication
- [ ] Database schema design

### Phase 2: Core Features
- [ ] Restaurant fetching from Yelp
- [ ] Swipe interface
- [ ] User pairing system
- [ ] Basic matching logic

### Phase 3: Real-time Features
- [ ] Live swipe synchronization
- [ ] Match notifications
- [ ] Chat functionality

### Phase 4: Polish & Launch
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Testing & debugging
- [ ] App Store submission

## 🤝 Contributing
This is a personal project, but feedback and suggestions are welcome!

## 📄 License
MIT License - see LICENSE file for details
