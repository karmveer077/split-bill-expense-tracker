const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const expenseController = require('../controllers/expenseController');
const balanceController = require('../controllers/balanceController');
const settlementRoutes = require('./settlementRoutes');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', groupController.getGroups);
router.post('/', groupController.createGroup);
router.post('/join', groupController.joinGroup);
router.post('/:groupId/expenses', expenseController.createExpense);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.updateGroup);

router.get('/:groupId/balances', balanceController.getGroupBalances);
router.use('/:groupId/settlements', settlementRoutes);

const activityController = require('../controllers/activityController');
const messageRoutes = require('./messageRoutes');
router.get('/:groupId/activity', activityController.getGroupActivity);
router.use('/:groupId/messages', messageRoutes);

module.exports = router;

