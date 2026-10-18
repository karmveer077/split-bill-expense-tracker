const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const { getGroupMessages, sendGroupMessage } = require('../controllers/messageController');

router.use(authMiddleware);

router.get('/', getGroupMessages);
router.post('/', sendGroupMessage);

module.exports = router;
