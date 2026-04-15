const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const path = require('path');

const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const userId = req.user.id;

    const post = await prisma.post.create({
      data: {
        content,
        authorId: userId,
        ...(req.files && req.files.length > 0 && {
          images: {
            create: req.files.map(file => ({
              url: `/uploads/${file.filename}`,
              filename: file.filename
            }))
          }
        })
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
        }
      }
    });

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        favoritesCount: post._count.favorites,
        repostsCount: post._count.reposts,
        isLiked: false,
        isFavorited: false
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUserId = req.user?.id;

    let blockedUserIds = [];
    if (currentUserId) {
      const blocked = await prisma.block.findMany({
        where: { blockerId: currentUserId },
        select: { blockedId: true }
      });
      blockedUserIds = blocked.map(b => b.blockedId);
    }

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        ...(blockedUserIds.length > 0 && {
          authorId: { notIn: blockedUserIds }
        })
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
        isDeleted: false,
        ...(blockedUserIds.length > 0 && {
          authorId: { notIn: blockedUserIds }
        })
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

const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
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
      }
    });

    if (!post || post.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the post author is blocked by current user
    if (currentUserId) {
      const isBlocked = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: currentUserId,
            blockedId: post.author.id
          }
        }
      });

      if (isBlocked) {
        return res.status(404).json({ error: 'Post not found' });
      }
    }

    await prisma.post.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      post: {
        ...post,
        viewCount: post.viewCount + 1,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        favoritesCount: post._count.favorites,
        repostsCount: post._count.reposts,
        isLiked: currentUserId ? post.likes?.length > 0 : false,
        isFavorited: currentUserId ? post.favorites?.length > 0 : false,
        _count: undefined,
        likes: undefined,
        favorites: undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost || existingPost.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { content },
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
        }
      }
    });

    res.json({
      message: 'Post updated successfully',
      post: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        favoritesCount: post._count.favorites,
        repostsCount: post._count.reposts
      }
    });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost || existingPost.isDeleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost
};
