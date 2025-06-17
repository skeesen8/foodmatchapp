const express = require('express');
const router = express.Router();
const axios = require('axios');

// Yelp API configuration
const YELP_API_BASE_URL = 'https://api.yelp.com/v3';
const YELP_API_KEY = process.env.YELP_API_KEY;

// Middleware to check if Yelp API key is configured
const checkYelpApiKey = (req, res, next) => {
  if (!YELP_API_KEY) {
    return res.status(500).json({
      error: 'Yelp API key not configured',
      message: 'Please set YELP_API_KEY environment variable'
    });
  }
  next();
};

// GET /api/restaurants/search
// Search for restaurants near a location
router.get('/search', checkYelpApiKey, async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10000, // 10km default
      categories = 'restaurants',
      price = '1,2,3,4',
      limit = 50,
      open_now = true
    } = req.query;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'latitude and longitude are required'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Please provide valid latitude (-90 to 90) and longitude (-180 to 180)'
      });
    }

    // Build Yelp API request
    const yelpParams = {
      latitude: lat,
      longitude: lng,
      radius: Math.min(parseInt(radius), 40000), // Max 40km
      categories,
      price,
      limit: Math.min(parseInt(limit), 50), // Max 50 results
      open_now: open_now === 'true'
    };

    // Make request to Yelp API
    const response = await axios.get(`${YELP_API_BASE_URL}/businesses/search`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Accept': 'application/json'
      },
      params: yelpParams
    });

    // Transform Yelp response to our format
    const restaurants = response.data.businesses.map(business => ({
      id: business.id,
      name: business.name,
      imageURL: business.image_url,
      rating: business.rating,
      reviewCount: business.review_count,
      price: business.price,
      categories: business.categories.map(cat => ({
        alias: cat.alias,
        title: cat.title
      })),
      location: {
        address1: business.location.address1,
        address2: business.location.address2,
        address3: business.location.address3,
        city: business.location.city,
        zipCode: business.location.zip_code,
        country: business.location.country,
        state: business.location.state,
        displayAddress: business.location.display_address
      },
      phone: business.display_phone,
      distance: business.distance,
      isClosed: business.is_closed,
      url: business.url
    }));

    res.json({
      restaurants,
      total: response.data.total,
      region: response.data.region
    });

  } catch (error) {
    console.error('Yelp API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Yelp API authentication failed',
        message: 'Invalid or expired API key'
      });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({
        error: 'Invalid request to Yelp API',
        message: error.response.data?.error?.description || 'Bad request parameters'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch restaurants',
      message: 'An error occurred while searching for restaurants'
    });
  }
});

// GET /api/restaurants/:id
// Get detailed information about a specific restaurant
router.get('/:id', checkYelpApiKey, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing restaurant ID',
        message: 'Restaurant ID is required'
      });
    }

    // Make request to Yelp API for business details
    const response = await axios.get(`${YELP_API_BASE_URL}/businesses/${id}`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const business = response.data;

    // Transform to our format
    const restaurant = {
      id: business.id,
      name: business.name,
      imageURL: business.image_url,
      rating: business.rating,
      reviewCount: business.review_count,
      price: business.price,
      categories: business.categories.map(cat => ({
        alias: cat.alias,
        title: cat.title
      })),
      location: {
        address1: business.location.address1,
        address2: business.location.address2,
        address3: business.location.address3,
        city: business.location.city,
        zipCode: business.location.zip_code,
        country: business.location.country,
        state: business.location.state,
        displayAddress: business.location.display_address
      },
      phone: business.display_phone,
      distance: business.distance,
      isClosed: business.is_closed,
      url: business.url,
      hours: business.hours,
      photos: business.photos
    };

    res.json({ restaurant });

  } catch (error) {
    console.error('Yelp API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Restaurant not found',
        message: 'The requested restaurant does not exist'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch restaurant details',
      message: 'An error occurred while fetching restaurant information'
    });
  }
});

module.exports = router; 