const prisma = require('../utils/prisma');

const getFeed = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const type = req.query.type || 'all';
  const skip = (page - 1) * limit;

  try {
    let whereCondition = {};

    if (type === 'following') {
      const following = await prisma.follow.findMany({
        where: { followerId: req.user.id },
        select: { followingId: true }
      });
      const followingIds = following.map(f => f.followingId);
      
      if (followingIds.length > 0) {
        whereCondition.userId = { in: followingIds };
      } else {
        return res.json({
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: req.user.id },
      select: { blockedId: true }
    });
    const blockedIds = blockedUsers.map(b => b.blockedId);

    if (blockedIds.length > 0) {
      whereCondition.userId = {
        ...whereCondition.userId,
        notIn: blockedIds
      };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereCondition,
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
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true
                }
              }
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
      prisma.post.count({ where: whereCondition })
    ]);

    const postIds = posts.map(p => p.id);
    const [likes, favorites, reposts] = await Promise.all([
      prisma.like.findMany({
        where: { userId: req.user.id, postId: { in: postIds } }
      }),
      prisma.favorite.findMany({
        where: { userId: req.user.id, postId: { in: postIds } }
      }),
      prisma.repost.findMany({
        where: { userId: req.user.id, postId: { in: postIds } }
      })
    ]);

    const postsWithInteraction = posts.map(post => ({
      ...post,
      isLiked: likes.some(l => l.postId === post.id),
      isFavorited: favorites.some(f => f.postId === post.id),
      isReposted: reposts.some(r => r.postId === post.id)
    }));

    res.json({
      posts: postsWithInteraction,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get feed' });
  }
};

module.exports = {
  getFeed
};
