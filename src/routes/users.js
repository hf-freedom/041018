const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getUserPosts,
  getUserFavorites,
  toggleFollow,
  getFollowers,
  getFollowing,
  getBlockedUsers
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/:id', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, upload.single('avatar'), updateUserProfile);
router.get('/:id/posts', authenticateToken, getUserPosts);
router.get('/:id/favorites', authenticateToken, getUserFavorites);
router.post('/follow', authenticateToken, toggleFollow);
router.get('/:id/followers', authenticateToken, getFollowers);
router.get('/:id/following', authenticateToken, getFollowing);
router.get('/blocked/list', authenticateToken, getBlockedUsers);

module.exports = router;
