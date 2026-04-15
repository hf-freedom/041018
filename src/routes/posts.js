const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

const createPostValidation = [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('images').optional().isArray().withMessage('Images must be an array')
];

router.post('/', auth, createPostValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, images } = req.body;

    const post = await prisma.post.create({
      data: {
        content,
        images: images ? JSON.stringify(images) : null,
        authorId: req.userId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        ...post,
        images: post.images ? JSON.parse(post.images) : []
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            favorites: true,
            reposts: true
          }
        }
      }
    });

    const total = await prisma.post.count();

    const postsWithParsedImages = posts.map(post => ({
      ...post,
      images: post.images ? JSON.parse(post.images) : []
    }));

    res.json({
      posts: postsWithParsedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            favorites: true,
            reposts: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      post: {
        ...post,
        images: post.images ? JSON.parse(post.images) : []
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, images } = req.body;

    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.authorId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        content,
        images: images ? JSON.stringify(images) : null
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      message: 'Post updated successfully',
      post: {
        ...post,
        images: post.images ? JSON.parse(post.images) : []
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.authorId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await prisma.post.delete({
      where: { id }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { postId: id, parentId: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    const total = await prisma.comment.count({
      where: { postId: id, parentId: null }
    });

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
