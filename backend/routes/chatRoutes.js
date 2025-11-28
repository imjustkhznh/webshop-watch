const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const chatUpload = require('../middleware/chatUpload');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/conversations', isAdmin, chatController.getConversations);
router.get('/conversations/:id/messages', chatController.getMessages);
router.put('/conversations/:id/status', isAdmin, chatController.updateConversationStatus);
router.post('/attachments', chatUpload.single('file'), chatController.uploadAttachment);

module.exports = router;

