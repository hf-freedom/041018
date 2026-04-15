const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Already liked this post' });
    }

    const like = await prisma.like.create({
      data: {
        postId,
        userId: req.userId
      }
    });

    res.status(201).json({ message: 'Post liked successfully', like });
  } catch (error) {
    next(error);
  }
};

const unlikePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    if (!existingLike) {
      return res.status(400).json({ error: 'Have not liked this post' });
    }

    await prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    next(error);
  }
};

const favoritePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Already favorited this post' });
    }

    const favorite = await prisma.favorite.create({
      data: {
        postId,
        userId: req.userId
      }
    });

    res.status(201).json({ message: 'Post favorited successfully', favorite });
  } catch (error) {
    next(error);
  }
};

const unfavoritePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    if (!existingFavorite) {
      return res.status(400).json({ error: 'Have not favorited this post' });
    }

    await prisma.favorite.delete({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    res.json({ message: 'Post unfavorited successfully' });
  } catch (error) {
    next(error);
  }
};

const reportPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const report = await prisma.report.create({
      data: {
        postId,
        reporterId: req.userId,
        reason
      }
    });

    res.status(201).json({ message: 'Post reported successfully', report });
  } catch (error) {
    next(error);
  }
};

const repostPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const existingRepost = await prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    if (existingRepost) {
      return res.status(400).json({ error: 'Already reposted this post' });
    }

    const repost = await prisma.repost.create({
      data: {
        postId,
        userId: req.userId,
        content
      },
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
            }
          }
        }
      }
    });

    res.status(201).json({ message: 'Post reposted successfully', repost });
  } catch (error) {
    next(error);
  }
};

const unrepostPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const existingRepost = await prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    if (!existingRepost) {
      return res.status(400).json({ error: 'Have not reposted this post' });
    }

    await prisma.repost.delete({
      where: {
        postId_userId: {
          postId,
          userId: req.userId
        }
      }
    });

    res.json({ message: 'Post unreposted successfully' });
  } catch (error) {
    next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: req.userId,
        parentId
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

    res.status(201).json({ message: 'Comment created successfully', comment });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.authorId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.userId,
          blockedId: userId
        }
      }
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'Already blocked this user' });
    }

    const block = await prisma.block.create({
      data: {
        blockerId: req.userId,
        blockedId: userId
      }
    });

    res.status(201).json({ message: 'User blocked successfully', block });
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.userId,
          blockedId: userId
        }
      }
    });

    if (!existingBlock) {
      return res.status(400).json({ error: 'Have not blocked this user' });
    }

    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: req.userId,
          blockedId: userId
        }
      }
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId,
          followingId: userId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: req.userId,
        followingId: userId
      }
    });

    res.status(201).json({ message: 'User followed successfully', follow });
  } catch (error) {
    next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId,
          followingId: userId
        }
      }
    });

    if (!existingFollow) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: req.userId,
          followingId: userId
        }
      }
    });

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    next(error);
  }
};

router.post('/posts/:postId/like', auth, likePost);
router.delete('/posts/:postId/like', auth, unlikePost);
router.post('/posts/:postId/favorite', auth, favoritePost);
router.delete('/posts/:postId/favorite', auth, unfavoritePost);
router.post('/posts/:postId/report', auth, reportPost);
router.post('/posts/:postId/repost', auth, repostPost);
router.delete('/posts/:postId/repost', auth, unrepostPost);
router.post('/posts/:postId/comments', auth, createComment);
router.delete('/comments/:commentId', auth, deleteComment);
router.post('/users/:userId/block', auth, blockUser);
router.delete('/users/:userId/block', auth, unblockUser);
router.post('/users/:userId/follow', auth, followUser);
router.delete('/users/:userId/follow', auth, unfollowUser);

module.exports = router;
