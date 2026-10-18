const express = require('express');
const router = express.Router({ mergeParams: true });
const balanceController = require('../controllers/balanceController');
const settlementController = require('../controllers/settlementController');

// GET /api/groups/:groupId/settlements/suggestions
router.get('/suggestions', balanceController.getSettlementSuggestions);

// GET /api/groups/:groupId/settlements
router.get('/', settlementController.getSettlements);

// POST /api/groups/:groupId/settlements
router.post('/', settlementController.createSettlement);

module.exports = router;
