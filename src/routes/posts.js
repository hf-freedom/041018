const express = require('express');
const { createPost, getPosts, getPostById, deletePost, validatePost } = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', authenticateToken, upload.single('image'), validatePost, createPost);
router.get('/', authenticateToken, getPosts);
router.get('/:id', authenticateToken, getPostById);
router.delete('/:id', authenticateToken, deletePost);

module.exports = router;
