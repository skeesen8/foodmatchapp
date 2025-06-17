# FoodMatch Setup Guide

This guide will help you set up the FoodMatch restaurant matching app on your development environment.

## Prerequisites

### Required Software
- **Xcode 15+** (for iOS development)
- **Node.js 18+** (for backend)
- **Git** (for version control)

### Required Accounts & API Keys
- **Yelp Developer Account** - [Get API Key](https://www.yelp.com/developers/v3/manage_app)
- **Firebase Project** - [Create Project](https://console.firebase.google.com/)
- **Apple Developer Account** (for iOS deployment)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd foodmatchapp
```

## Step 2: Backend Setup

### Install Dependencies
```bash
cd backend
npm install
```

### Configure Environment Variables
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual values
nano .env
```

Required environment variables:
- `YELP_API_KEY` - Your Yelp Fusion API key
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Your Firebase service account private key
- `FIREBASE_CLIENT_EMAIL` - Your Firebase service account email

### Start the Backend Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Step 3: Firebase Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard

### Enable Required Services
1. **Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode"

2. **Authentication**
   - Go to Authentication
   - Click "Get started"
   - Enable Email/Password and Google sign-in

3. **Cloud Messaging** (for push notifications)
   - Go to Cloud Messaging
   - Follow setup instructions

### Download Configuration Files
1. Go to Project Settings
2. Download `GoogleService-Info.plist` for iOS
3. Download service account JSON for backend

## Step 4: iOS App Setup

### Open in Xcode
```bash
cd ios
open FoodMatch.xcodeproj
```

### Configure Firebase
1. Drag `GoogleService-Info.plist` into your Xcode project
2. Make sure it's added to the target

### Add Required Capabilities
In Xcode, go to your target's "Signing & Capabilities":
1. Add "Push Notifications"
2. Add "Background Modes" (Background fetch, Remote notifications)

### Update API Keys
1. Open `ios/FoodMatch/Services/YelpService.swift`
2. Replace `YOUR_YELP_API_KEY` with your actual API key

### Configure Location Permissions
The app will automatically request location permissions. Make sure your `Info.plist` includes:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>FoodMatch needs location access to find restaurants near you.</string>
```

## Step 5: Yelp API Setup

### Get API Key
1. Go to [Yelp Developers](https://www.yelp.com/developers/v3/manage_app)
2. Create a new app
3. Copy your API key

### Test API Access
```bash
# Test your Yelp API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://api.yelp.com/v3/businesses/search?latitude=37.7749&longitude=-122.4194"
```

## Step 6: Running the App

### Start Backend
```bash
cd backend
npm run dev
```

### Run iOS App
1. Open Xcode
2. Select your target device/simulator
3. Press Cmd+R to build and run

## Step 7: Testing

### Test Restaurant Search
1. Allow location permissions when prompted
2. The app should load restaurants near your location
3. Try swiping on restaurant cards

### Test Backend API
```bash
# Test restaurant search endpoint
curl "http://localhost:3000/api/restaurants/search?latitude=37.7749&longitude=-122.4194"

# Check health endpoint
curl "http://localhost:3000/health"
```

## Troubleshooting

### Common Issues

**"Yelp API key not configured"**
- Make sure `YELP_API_KEY` is set in your `.env` file
- Verify the API key is valid

**"Location permission denied"**
- Check iOS Simulator > Device > Location
- Ensure location permissions are granted

**"Firebase not configured"**
- Verify `GoogleService-Info.plist` is in your Xcode project
- Check Firebase project settings

**Backend won't start**
- Check if port 3000 is already in use
- Verify all required environment variables are set

### Getting Help

1. Check the [GitHub Issues](link-to-issues)
2. Review Firebase documentation
3. Check Yelp API documentation

## Next Steps

Once you have the basic app running:

1. **Implement User Authentication** - Add Firebase Auth integration
2. **Add Real-time Features** - Implement live swipe synchronization
3. **Create Match Notifications** - Set up push notifications
4. **Add Chat Feature** - Build in-app messaging for matches
5. **Deploy to Production** - Set up production Firebase and deploy

## Development Workflow

### Making Changes
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit and push: `git push origin feature/your-feature`
5. Create a pull request

### Code Style
- Follow Swift style guidelines for iOS
- Use ESLint for JavaScript/Node.js
- Write meaningful commit messages

Happy coding! 🍽️ 