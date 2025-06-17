const express = require('express');
const router = express.Router();

// GET /api/matches/pair/:pairId
router.get('/pair/:pairId', async (req, res) => {
  try {
    // TODO: Get matches for a pair
    res.json({
      message: 'Get pair matches endpoint - to be implemented'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch matches',
      message: error.message
    });
  }
});

// POST /api/matches/:matchId/viewed
router.post('/:matchId/viewed', async (req, res) => {
  try {
    // TODO: Mark match as viewed
    res.json({
      message: 'Mark match viewed endpoint - to be implemented'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update match',
      message: error.message
    });
  }
});

module.exports = router; 