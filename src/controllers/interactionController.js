const prisma = require('../utils/prisma');

const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: parseInt(postId)
        }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });

      const count = await prisma.like.count({
        where: { postId: parseInt(postId) }
      });

      return res.json({
        message: 'Post unliked',
        liked: false,
        likesCount: count
      });
    }

    await prisma.like.create({
      data: {
        userId,
        postId: parseInt(postId)
      }
    });

    const count = await prisma.like.count({
      where: { postId: parseInt(postId) }
    });

    res.json({
      message: 'Post liked',
      liked: true,
      likesCount: count
    });
  } catch (error) {
    next(error);
  }
};

const favoritePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: parseInt(postId)
        }
      }
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      });

      const count = await prisma.favorite.count({
        where: { postId: parseInt(postId) }
      });

      return res.json({
        message: 'Post removed from favorites',
        favorited: false,
        favoritesCount: count
      });
    }

    await prisma.favorite.create({
      data: {
        userId,
        postId: parseInt(postId)
      }
    });

    const count = await prisma.favorite.count({
      where: { postId: parseInt(postId) }
    });

    res.json({
      message: 'Post added to favorites',
      favorited: true,
      favoritesCount: count
    });
  } catch (error) {
    next(error);
  }
};

const repostPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: parseInt(postId)
        }
      }
    });

    if (existingRepost) {
      await prisma.repost.delete({
        where: { id: existingRepost.id }
      });

      const count = await prisma.repost.count({
        where: { postId: parseInt(postId) }
      });

      return res.json({
        message: 'Repost removed',
        reposted: false,
        repostsCount: count
      });
    }

    await prisma.repost.create({
      data: {
        userId,
        postId: parseInt(postId),
        content: content || null
      }
    });

    const count = await prisma.repost.count({
      where: { postId: parseInt(postId) }
    });

    res.json({
      message: 'Post reposted',
      reposted: true,
      repostsCount: count
    });
  } catch (error) {
    next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId: parseInt(postId),
        ...(parentId && { parentId: parseInt(parentId) })
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
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?.id;

    // Get blocked user IDs
    let blockedUserIds = [];
    if (currentUserId) {
      const blocked = await prisma.block.findMany({
        where: { blockerId: currentUserId },
        select: { blockedId: true }
      });
      blockedUserIds = blocked.map(b => b.blockedId);
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId: parseInt(postId),
        parentId: null,
        ...(blockedUserIds.length > 0 && {
          userId: { notIn: blockedUserIds }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        replies: {
          where: blockedUserIds.length > 0 ? {
            userId: { notIn: blockedUserIds }
          } : undefined,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.comment.count({
      where: {
        postId: parseInt(postId),
        parentId: null,
        ...(blockedUserIds.length > 0 && {
          userId: { notIn: blockedUserIds }
        })
      }
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
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    if (parseInt(userId) === blockerId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: parseInt(userId)
        }
      }
    });

    if (existingBlock) {
      await prisma.block.delete({
        where: { id: existingBlock.id }
      });

      return res.json({
        message: 'User unblocked',
        blocked: false
      });
    }

    await prisma.block.create({
      data: {
        blockerId,
        blockedId: parseInt(userId)
      }
    });

    res.json({
      message: 'User blocked',
      blocked: true
    });
  } catch (error) {
    next(error);
  }
};

const reportPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const reporterId = req.user.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const existingReport = await prisma.report.findUnique({
      where: {
        reporterId_postId: {
          reporterId,
          postId: parseInt(postId)
        }
      }
    });

    if (existingReport) {
      return res.status(409).json({ error: 'You have already reported this post' });
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        postId: parseInt(postId),
        reason
      }
    });

    res.status(201).json({
      message: 'Post reported successfully',
      report
    });
  } catch (error) {
    next(error);
  }
};

const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    if (parseInt(userId) === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: parseInt(userId)
        }
      }
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });

      const count = await prisma.follow.count({
        where: { followingId: parseInt(userId) }
      });

      return res.json({
        message: 'User unfollowed',
        following: false,
        followersCount: count
      });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId: parseInt(userId)
      }
    });

    const count = await prisma.follow.count({
      where: { followingId: parseInt(userId) }
    });

    res.json({
      message: 'User followed',
      following: true,
      followersCount: count
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  likePost,
  favoritePost,
  repostPost,
  createComment,
  getComments,
  deleteComment,
  blockUser,
  reportPost,
  followUser
};
