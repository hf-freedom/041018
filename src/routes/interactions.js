const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { auth } = require('../middleware/auth');

router.post('/posts/:postId/like', auth, interactionController.likePost);
router.post('/posts/:postId/favorite', auth, interactionController.favoritePost);
router.post('/posts/:postId/repost', auth, interactionController.repostPost);
router.post('/posts/:postId/comments', auth, interactionController.createComment);
router.get('/posts/:postId/comments', interactionController.getComments);
router.delete('/comments/:commentId', auth, interactionController.deleteComment);
router.post('/users/:userId/block', auth, interactionController.blockUser);
router.post('/posts/:postId/report', auth, interactionController.reportPost);
router.post('/users/:userId/follow', auth, interactionController.followUser);

module.exports = router;
