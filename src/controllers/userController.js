const prisma = require('../utils/prisma');
const upload = require('../middleware/upload');

const getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
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

    if (req.user && req.user.id !== parseInt(id)) {
      const [follow, block] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: req.user.id,
              followingId: parseInt(id)
            }
          }
        }),
        prisma.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: req.user.id,
              blockedId: parseInt(id)
            }
          }
        })
      ]);

      isFollowing = !!follow;
      isBlocked = !!block;
    }

    res.json({
      user: {
        ...user,
        isFollowing,
        isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

const updateUserProfile = async (req, res) => {
  const { username, bio } = req.body;
  const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: req.user.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const getUserPosts = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { userId: parseInt(id) },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
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
      }),
      prisma.post.count({
        where: { userId: parseInt(id) }
      })
    ]);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user posts' });
  }
};

const getUserFavorites = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Not authorized to view favorites' });
    }

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: parseInt(id) },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
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
      }),
      prisma.favorite.count({
        where: { userId: parseInt(id) }
      })
    ]);

    const posts = favorites.map(f => f.post);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get favorites' });
  }
};

const toggleFollow = async (req, res) => {
  const { followingId } = req.body;

  if (followingId === req.user.id) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    const followingUser = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!followingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId
        }
      }
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });
      res.json({ message: 'Unfollowed successfully', following: false });
    } else {
      await prisma.follow.create({
        data: {
          followerId: req.user.id,
          followingId
        }
      });
      res.json({ message: 'Followed successfully', following: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle follow' });
  }
};

const getFollowers = async (req, res) => {
  const { id } = req.params;

  try {
    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: parseInt(id) },
      select: { blockedId: true }
    });
    const blockedIds = blockedUsers.map(b => b.blockedId);

    const followers = await prisma.follow.findMany({
      where: {
        followingId: parseInt(id),
        followerId: { notIn: blockedIds }
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
      }
    });

    res.json({
      followers: followers.map(f => f.follower)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get followers' });
  }
};

const getFollowing = async (req, res) => {
  const { id } = req.params;

  try {
    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: parseInt(id) },
      select: { blockedId: true }
    });
    const blockedIds = blockedUsers.map(b => b.blockedId);

    const following = await prisma.follow.findMany({
      where: {
        followerId: parseInt(id),
        followingId: { notIn: blockedIds }
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
      }
    });

    res.json({
      following: following.map(f => f.following)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get following list' });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const blocked = await prisma.block.findMany({
      where: { blockerId: req.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            createdAt: true
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
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserPosts,
  getUserFavorites,
  toggleFollow,
  getFollowers,
  getFollowing,
  getBlockedUsers
};
