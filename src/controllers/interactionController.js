const prisma = require('../utils/prisma');
const { body, validationResult } = require('express-validator');

const toggleLike = async (req, res) => {
  const { postId } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId
        }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      res.json({ message: 'Like removed', liked: false });
    } else {
      await prisma.like.create({
        data: {
          userId: req.user.id,
          postId
        }
      });
      res.json({ message: 'Post liked', liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

const toggleFavorite = async (req, res) => {
  const { postId } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId
        }
      }
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      });
      res.json({ message: 'Favorite removed', favorited: false });
    } else {
      await prisma.favorite.create({
        data: {
          userId: req.user.id,
          postId
        }
      });
      res.json({ message: 'Post favorited', favorited: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { postId, content } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.user.id,
        postId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

const deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

const toggleRepost = async (req, res) => {
  const { postId } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId
        }
      }
    });

    if (existingRepost) {
      await prisma.repost.delete({
        where: { id: existingRepost.id }
      });
      res.json({ message: 'Repost removed', reposted: false });
    } else {
      await prisma.repost.create({
        data: {
          userId: req.user.id,
          postId
        }
      });
      res.json({ message: 'Post reposted', reposted: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle repost' });
  }
};

const toggleBlock = async (req, res) => {
  const { blockedId } = req.body;

  if (blockedId === req.user.id) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  try {
    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedId }
    });

    if (!blockedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId
        }
      }
    });

    if (existingBlock) {
      await prisma.block.delete({
        where: { id: existingBlock.id }
      });
      res.json({ message: 'User unblocked', blocked: false });
    } else {
      await prisma.block.create({
        data: {
          blockerId: req.user.id,
          blockedId
        }
      });
      res.json({ message: 'User blocked', blocked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle block' });
  }
};

const reportUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { reportedId, postId, reason } = req.body;

  if (reportedId === req.user.id) {
    return res.status(400).json({ error: 'Cannot report yourself' });
  }

  try {
    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedId }
    });

    if (!reportedUser) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        reportedId,
        postId: postId || null,
        reason
      }
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report: {
        id: report.id,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

const validateComment = [
  body('content').isLength({ min: 1 }).withMessage('Comment content is required'),
  body('postId').isInt().withMessage('Valid post ID is required')
];

const validateReport = [
  body('reason').isLength({ min: 5 }).withMessage('Report reason must be at least 5 characters')
];

module.exports = {
  toggleLike,
  toggleFavorite,
  addComment,
  deleteComment,
  toggleRepost,
  toggleBlock,
  reportUser,
  validateComment,
  validateReport
};
