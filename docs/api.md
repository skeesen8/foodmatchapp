# FoodMatch API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

Most endpoints require authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Endpoints

### Health Check

#### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-10-01T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## Restaurants

### Search Restaurants

#### GET /api/restaurants/search

Search for restaurants near a location using Yelp API.

**Query Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate  
- `radius` (optional): Search radius in meters (default: 10000, max: 40000)
- `categories` (optional): Restaurant categories (default: "restaurants")
- `price` (optional): Price levels 1-4 (default: "1,2,3,4")
- `limit` (optional): Number of results (default: 50, max: 50)
- `open_now` (optional): Only open restaurants (default: true)

**Example Request:**
```bash
GET /api/restaurants/search?latitude=37.7749&longitude=-122.4194&radius=5000&limit=20
```

**Response:**
```json
{
  "restaurants": [
    {
      "id": "yelp-business-id",
      "name": "Amazing Restaurant",
      "imageURL": "https://example.com/image.jpg",
      "rating": 4.5,
      "reviewCount": 234,
      "price": "$$",
      "categories": [
        {
          "alias": "italian",
          "title": "Italian"
        }
      ],
      "location": {
        "address1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94102",
        "displayAddress": ["123 Main St", "San Francisco, CA 94102"]
      },
      "phone": "+14155551234",
      "distance": 500.0,
      "isClosed": false,
      "url": "https://yelp.com/biz/amazing-restaurant"
    }
  ],
  "total": 1000,
  "region": {
    "center": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  }
}
```

### Get Restaurant Details

#### GET /api/restaurants/:id

Get detailed information about a specific restaurant.

**Parameters:**
- `id`: Yelp business ID

**Response:**
```json
{
  "restaurant": {
    "id": "yelp-business-id",
    "name": "Amazing Restaurant",
    "imageURL": "https://example.com/image.jpg",
    "rating": 4.5,
    "reviewCount": 234,
    "price": "$$",
    "categories": [...],
    "location": {...},
    "phone": "+14155551234",
    "distance": 500.0,
    "isClosed": false,
    "url": "https://yelp.com/biz/amazing-restaurant",
    "hours": [...],
    "photos": [...]
  }
}
```

---

## Authentication

### Login

#### POST /api/auth/login

Authenticate user with Firebase.

**Request Body:**
```json
{
  "idToken": "firebase_id_token"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "User Name"
  },
  "token": "jwt_token"
}
```

### Register

#### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password",
  "displayName": "User Name"
}
```

### Logout

#### POST /api/auth/logout

Logout current user.

---

## Users

### Get Profile

#### GET /api/users/profile

Get current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "User Name",
    "profileImageURL": "https://example.com/avatar.jpg",
    "preferences": {
      "maxDistance": 10.0,
      "priceRange": ["$", "$$", "$$$"],
      "cuisineTypes": ["italian", "mexican"],
      "excludeChains": false,
      "openNow": true
    },
    "currentPairId": "pair_id",
    "isActive": true
  }
}
```

### Update Profile

#### PUT /api/users/profile

Update user profile.

**Request Body:**
```json
{
  "displayName": "New Name",
  "preferences": {
    "maxDistance": 15.0,
    "priceRange": ["$$", "$$$"],
    "cuisineTypes": ["italian"],
    "excludeChains": true,
    "openNow": false
  }
}
```

---

## Pairs

### Create Pair

#### POST /api/pairs

Create a new user pair for swiping together.

**Request Body:**
```json
{
  "user2Id": "other_user_id"
}
```

**Response:**
```json
{
  "pair": {
    "id": "pair_id",
    "user1Id": "current_user_id",
    "user2Id": "other_user_id",
    "createdAt": "2023-10-01T12:00:00.000Z",
    "isActive": true,
    "sessionId": "session_uuid"
  }
}
```

### Get Pair

#### GET /api/pairs/:pairId

Get pair information.

**Response:**
```json
{
  "pair": {
    "id": "pair_id",
    "user1Id": "user1_id",
    "user2Id": "user2_id",
    "createdAt": "2023-10-01T12:00:00.000Z",
    "isActive": true,
    "sessionId": "session_uuid",
    "currentLocation": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  }
}
```

---

## Swipes

### Record Swipe

#### POST /api/swipes

Record a user's swipe on a restaurant.

**Request Body:**
```json
{
  "restaurantId": "yelp_business_id",
  "pairId": "pair_id",
  "sessionId": "session_id",
  "direction": "right",
  "restaurantData": {
    "name": "Restaurant Name",
    "imageURL": "https://example.com/image.jpg"
  }
}
```

**Response:**
```json
{
  "swipe": {
    "id": "swipe_id",
    "userId": "user_id",
    "restaurantId": "yelp_business_id",
    "pairId": "pair_id",
    "sessionId": "session_id",
    "direction": "right",
    "timestamp": "2023-10-01T12:00:00.000Z"
  },
  "match": {
    "id": "match_id",
    "restaurantId": "yelp_business_id",
    "restaurantData": {...}
  }
}
```

### Get Session Swipes

#### GET /api/swipes/session/:sessionId

Get all swipes for a session.

**Response:**
```json
{
  "swipes": [
    {
      "id": "swipe_id",
      "userId": "user_id",
      "restaurantId": "yelp_business_id",
      "direction": "right",
      "timestamp": "2023-10-01T12:00:00.000Z",
      "restaurantData": {...}
    }
  ]
}
```

---

## Matches

### Get Pair Matches

#### GET /api/matches/pair/:pairId

Get all matches for a user pair.

**Response:**
```json
{
  "matches": [
    {
      "id": "match_id",
      "pairId": "pair_id",
      "restaurantId": "yelp_business_id",
      "user1Id": "user1_id",
      "user2Id": "user2_id",
      "timestamp": "2023-10-01T12:00:00.000Z",
      "restaurantData": {
        "name": "Matched Restaurant",
        "imageURL": "https://example.com/image.jpg",
        "rating": 4.5,
        "location": {...}
      },
      "isViewed": false,
      "chatId": null
    }
  ]
}
```

### Mark Match as Viewed

#### POST /api/matches/:matchId/viewed

Mark a match as viewed by the user.

**Response:**
```json
{
  "success": true,
  "message": "Match marked as viewed"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "The requested resource was not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests from this IP, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Window:** 15 minutes
- **Limit:** 100 requests per IP
- **Headers:** Rate limit info included in response headers

---

## WebSocket Events (Future)

For real-time features:

### Events
- `swipe_received` - When partner swipes
- `match_found` - When both users match
- `user_online` - When partner comes online
- `user_offline` - When partner goes offline

### Connection
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'firebase_id_token'
  }
});
``` 