const express = require('express');
const {
  toggleLike,
  toggleFavorite,
  addComment,
  deleteComment,
  toggleRepost,
  toggleBlock,
  reportUser,
  validateComment,
  validateReport
} = require('../controllers/interactionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/like', authenticateToken, toggleLike);
router.post('/favorite', authenticateToken, toggleFavorite);
router.post('/comment', authenticateToken, validateComment, addComment);
router.delete('/comment/:id', authenticateToken, deleteComment);
router.post('/repost', authenticateToken, toggleRepost);
router.post('/block', authenticateToken, toggleBlock);
router.post('/report', authenticateToken, validateReport, reportUser);

module.exports = router;
