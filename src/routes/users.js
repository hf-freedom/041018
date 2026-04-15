const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/:userId/profile', optionalAuth, userController.getUserProfile);
router.get('/:userId/posts', optionalAuth, userController.getUserPosts);
router.get('/:userId/favorites', auth, userController.getUserFavorites);
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);
router.get('/me/blocked', auth, userController.getBlockedUsers);

module.exports = router;
