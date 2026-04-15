const prisma = require('../utils/prisma');
const { body, validationResult } = require('express-validator');

const createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const post = await prisma.post.create({
      data: {
        content,
        image,
        userId: req.user.id
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
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

const getPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
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
      prisma.post.count()
    ]);

    const postsWithInteraction = posts.map(post => ({
      ...post,
      isLiked: false,
      isFavorited: false,
      isReposted: false
    }));

    if (req.user) {
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

      postsWithInteraction.forEach(post => {
        post.isLiked = likes.some(l => l.postId === post.id);
        post.isFavorited = favorites.some(f => f.postId === post.id);
        post.isReposted = reposts.some(r => r.postId === post.id);
      });
    }

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
    res.status(500).json({ error: 'Failed to get posts' });
  }
};

const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
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

    let isLiked = false;
    let isFavorited = false;
    let isReposted = false;

    if (req.user) {
      const [like, favorite, repost] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_postId: { userId: req.user.id, postId: parseInt(id) } }
        }),
        prisma.favorite.findUnique({
          where: { userId_postId: { userId: req.user.id, postId: parseInt(id) } }
        }),
        prisma.repost.findUnique({
          where: { userId_postId: { userId: req.user.id, postId: parseInt(id) } }
        })
      ]);

      isLiked = !!like;
      isFavorited = !!favorite;
      isReposted = !!repost;
    }

    res.json({
      post: {
        ...post,
        isLiked,
        isFavorited,
        isReposted
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get post' });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await prisma.post.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

const validatePost = [
  body('content').isLength({ min: 1 }).withMessage('Content is required')
];

module.exports = {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  validatePost
};
