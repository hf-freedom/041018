const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            follows: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', auth, async (req, res, next) => {
  try {
    const { nickname, bio, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        nickname,
        bio,
        avatar
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/posts', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: { authorId: id },
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

    const total = await prisma.post.count({
      where: { authorId: id }
    });

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

router.get('/:id/followers', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const followers = await prisma.follow.findMany({
      where: { followingId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    const total = await prisma.follow.count({
      where: { followingId: id }
    });

    res.json({
      followers: followers.map(f => f.follower),
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

router.get('/:id/following', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const following = await prisma.follow.findMany({
      where: { followerId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    const total = await prisma.follow.count({
      where: { followerId: id }
    });

    res.json({
      following: following.map(f => f.following),
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

router.get('/me/favorites', auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
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
        }
      }
    });

    const total = await prisma.favorite.count({
      where: { userId: req.userId }
    });

    const postsWithParsedImages = favorites.map(f => ({
      ...f.post,
      images: f.post.images ? JSON.parse(f.post.images) : [],
      favoritedAt: f.createdAt
    }));

    res.json({
      favorites: postsWithParsedImages,
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

router.get('/me/likes', auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const likes = await prisma.like.findMany({
      where: { userId: req.userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
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
        }
      }
    });

    const total = await prisma.like.count({
      where: { userId: req.userId }
    });

    const postsWithParsedImages = likes.map(l => ({
      ...l.post,
      images: l.post.images ? JSON.parse(l.post.images) : [],
      likedAt: l.createdAt
    }));

    res.json({
      likes: postsWithParsedImages,
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

router.get('/me/blocked', auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blocked = await prisma.block.findMany({
      where: { blockerId: req.userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    const total = await prisma.block.count({
      where: { blockerId: req.userId }
    });

    res.json({
      blocked: blocked.map(b => b.blocked),
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
