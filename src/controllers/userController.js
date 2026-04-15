const prisma = require('../utils/prisma');

const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: { isDeleted: false }
            },
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let isFollowing = false;
    let isBlocked = false;
    let hasBlockedYou = false;

    if (currentUserId) {
      const [follow, block, blockedBy] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: parseInt(userId)
            }
          }
        }),
        prisma.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: currentUserId,
              blockedId: parseInt(userId)
            }
          }
        }),
        prisma.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: parseInt(userId),
              blockedId: currentUserId
            }
          }
        })
      ]);

      isFollowing = !!follow;
      isBlocked = !!block;
      hasBlockedYou = !!blockedBy;
    }

    // If the user has blocked current user, return limited info
    if (hasBlockedYou) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        ...user,
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing,
        isBlocked
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUserId) {
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: currentUserId, blockedId: parseInt(userId) },
            { blockerId: parseInt(userId), blockedId: currentUserId }
          ]
        }
      });

      if (isBlocked) {
        return res.json({
          posts: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }
    }

    const posts = await prisma.post.findMany({
      where: {
        authorId: parseInt(userId),
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        images: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            favorites: true,
            reposts: true
          }
        },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true }
          },
          favorites: {
            where: { userId: currentUserId },
            select: { id: true }
          }
        })
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.post.count({
      where: {
        authorId: parseInt(userId),
        isDeleted: false
      }
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      favoritesCount: post._count.favorites,
      repostsCount: post._count.reposts,
      isLiked: currentUserId ? post.likes?.length > 0 : false,
      isFavorited: currentUserId ? post.favorites?.length > 0 : false,
      _count: undefined,
      likes: undefined,
      favorites: undefined
    }));

    res.json({
      posts: formattedPosts,
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

const getUserFavorites = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?.id;

    if (currentUserId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized to view these favorites' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: parseInt(userId) },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            images: true,
            _count: {
              select: {
                likes: true,
                comments: true,
                favorites: true,
                reposts: true
              }
            },
            likes: {
              where: { userId: parseInt(userId) },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.favorite.count({
      where: { userId: parseInt(userId) }
    });

    const formattedPosts = favorites
      .filter(f => !f.post.isDeleted)
      .map(f => ({
        ...f.post,
        likesCount: f.post._count.likes,
        commentsCount: f.post._count.comments,
        favoritesCount: f.post._count.favorites,
        repostsCount: f.post._count.reposts,
        isLiked: f.post.likes.length > 0,
        isFavorited: true,
        favoritedAt: f.createdAt,
        _count: undefined,
        likes: undefined
      }));

    res.json({
      posts: formattedPosts,
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

const getBlockedUsers = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const blocked = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      blockedUsers: blocked.map(b => ({
        ...b.blocked,
        blockedAt: b.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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

    const followers = await prisma.follow.findMany({
      where: {
        followingId: parseInt(userId),
        ...(blockedUserIds.length > 0 && {
          followerId: { notIn: blockedUserIds }
        })
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.follow.count({
      where: {
        followingId: parseInt(userId),
        ...(blockedUserIds.length > 0 && {
          followerId: { notIn: blockedUserIds }
        })
      }
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
};

const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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

    const following = await prisma.follow.findMany({
      where: {
        followerId: parseInt(userId),
        ...(blockedUserIds.length > 0 && {
          followingId: { notIn: blockedUserIds }
        })
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.follow.count({
      where: {
        followerId: parseInt(userId),
        ...(blockedUserIds.length > 0 && {
          followingId: { notIn: blockedUserIds }
        })
      }
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
};

module.exports = {
  getUserProfile,
  getUserPosts,
  getUserFavorites,
  getBlockedUsers,
  getFollowers,
  getFollowing
};
