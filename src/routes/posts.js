const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const postController = require('../controllers/postController');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const postValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Content must be between 1 and 2000 characters')
];

router.post('/', auth, upload.array('images', 9), postValidation, postController.createPost);
router.get('/', optionalAuth, postController.getPosts);
router.get('/:id', optionalAuth, postController.getPost);
router.patch('/:id', auth, postValidation, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);

module.exports = router;
