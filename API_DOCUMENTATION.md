# 社交应用 RESTful API 文档

## 概述

本 API 提供完整的社交应用功能，包括用户认证、发帖、信息流、互动等功能。

- **基础 URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

---

## 目录

1. [认证 API](#认证-api)
2. [帖子 API](#帖子-api)
3. [互动 API](#互动-api)
4. [用户 API](#用户-api)

---

## 认证 API

### 1. 用户注册

**POST** `/auth/register`

注册新用户。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| username | string | 是 | 用户名 (3-20字符，字母数字下划线) |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 (至少6字符) |

#### 请求示例

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### 响应示例

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": null,
    "bio": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 错误响应

- `400` - 参数验证失败
- `409` - 用户名或邮箱已存在

---

### 2. 用户登录

**POST** `/auth/login`

用户登录，返回 JWT Token。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

#### 请求示例

```json
{
  "username": "john_doe",
  "password": "password123"
}
```

#### 响应示例

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": null,
    "bio": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 错误响应

- `401` - 用户名或密码错误

---

### 3. 获取当前用户信息

**GET** `/auth/me`

获取当前登录用户的详细信息。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": null,
    "bio": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "followersCount": 10,
    "followingCount": 5,
    "postsCount": 20
  }
}
```

#### 错误响应

- `401` - 未授权

---

### 4. 更新个人资料

**PATCH** `/auth/me`

更新当前用户的个人资料。

#### 请求头

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| bio | string | 否 | 个人简介 (最多500字符) |
| avatar | file | 否 | 头像图片 (JPEG/PNG/GIF/WebP, 最大5MB) |

#### 响应示例

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "/uploads/avatar-123456.jpg",
    "bio": "Hello, I'm John!",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 帖子 API

### 1. 创建帖子

**POST** `/posts`

创建新帖子，支持上传图片。

#### 请求头

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| content | string | 是 | 帖子内容 (1-2000字符) |
| images | file[] | 否 | 图片文件，最多9张 |

#### 响应示例

```json
{
  "message": "Post created successfully",
  "post": {
    "id": 1,
    "content": "Hello World!",
    "author": {
      "id": 1,
      "username": "john_doe",
      "avatar": null
    },
    "images": [
      {
        "id": 1,
        "url": "/uploads/image-123456.jpg",
        "filename": "image-123456.jpg"
      }
    ],
    "likesCount": 0,
    "commentsCount": 0,
    "favoritesCount": 0,
    "repostsCount": 0,
    "isLiked": false,
    "isFavorited": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 获取帖子列表

**GET** `/posts`

获取帖子信息流列表。

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 10 | 每页数量 |

#### 响应示例

```json
{
  "posts": [
    {
      "id": 1,
      "content": "Hello World!",
      "author": {
        "id": 1,
        "username": "john_doe",
        "avatar": null
      },
      "images": [],
      "likesCount": 10,
      "commentsCount": 5,
      "favoritesCount": 3,
      "repostsCount": 2,
      "isLiked": true,
      "isFavorited": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

### 3. 获取单个帖子

**GET** `/posts/:id`

获取指定帖子的详细信息。

#### 响应示例

```json
{
  "post": {
    "id": 1,
    "content": "Hello World!",
    "author": {
      "id": 1,
      "username": "john_doe",
      "avatar": null
    },
    "images": [],
    "viewCount": 100,
    "likesCount": 10,
    "commentsCount": 5,
    "favoritesCount": 3,
    "repostsCount": 2,
    "isLiked": true,
    "isFavorited": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误响应

- `404` - 帖子不存在

---

### 4. 更新帖子

**PATCH** `/posts/:id`

更新指定帖子内容。

#### 请求头

```
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| content | string | 是 | 帖子内容 (1-2000字符) |

#### 响应示例

```json
{
  "message": "Post updated successfully",
  "post": {
    "id": 1,
    "content": "Updated content",
    "author": {
      "id": 1,
      "username": "john_doe",
      "avatar": null
    },
    "images": [],
    "likesCount": 10,
    "commentsCount": 5,
    "favoritesCount": 3,
    "repostsCount": 2,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 错误响应

- `403` - 无权更新他人帖子
- `404` - 帖子不存在

---

### 5. 删除帖子

**DELETE** `/posts/:id`

删除指定帖子（软删除）。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "message": "Post deleted successfully"
}
```

#### 错误响应

- `403` - 无权删除他人帖子
- `404` - 帖子不存在

---

## 互动 API

### 1. 点赞/取消点赞

**POST** `/interactions/posts/:postId/like`

切换帖子的点赞状态。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "message": "Post liked",
  "liked": true,
  "likesCount": 11
}
```

或

```json
{
  "message": "Post unliked",
  "liked": false,
  "likesCount": 10
}
```

---

### 2. 收藏/取消收藏

**POST** `/interactions/posts/:postId/favorite`

切换帖子的收藏状态。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "message": "Post added to favorites",
  "favorited": true,
  "favoritesCount": 4
}
```

---

### 3. 转发/取消转发

**POST** `/interactions/posts/:postId/repost`

转发帖子。

#### 请求头

```
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| content | string | 否 | 转发附言 |

#### 响应示例

```json
{
  "message": "Post reposted",
  "reposted": true,
  "repostsCount": 3
}
```

---

### 4. 创建评论

**POST** `/interactions/posts/:postId/comments`

在帖子下发表评论。

#### 请求头

```
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| content | string | 是 | 评论内容 |
| parentId | number | 否 | 父评论ID（回复评论时使用） |

#### 响应示例

```json
{
  "message": "Comment created successfully",
  "comment": {
    "id": 1,
    "content": "Great post!",
    "user": {
      "id": 1,
      "username": "john_doe",
      "avatar": null
    },
    "parentId": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. 获取评论列表

**GET** `/interactions/posts/:postId/comments`

获取帖子的评论列表。

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 10 | 每页数量 |

#### 响应示例

```json
{
  "comments": [
    {
      "id": 1,
      "content": "Great post!",
      "user": {
        "id": 1,
        "username": "john_doe",
        "avatar": null
      },
      "replies": [
        {
          "id": 2,
          "content": "Thanks!",
          "user": {
            "id": 2,
            "username": "jane_doe",
            "avatar": null
          },
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 6. 删除评论

**DELETE** `/interactions/comments/:commentId`

删除自己的评论。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "message": "Comment deleted successfully"
}
```

#### 错误响应

- `403` - 无权删除他人评论
- `404` - 评论不存在

---

### 7. 拉黑/取消拉黑用户

**POST** `/interactions/users/:userId/block`

切换对用户的拉黑状态。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "message": "User blocked",
  "blocked": true
}
```

#### 错误响应

- `400` - 不能拉黑自己

---

### 8. 举报帖子

**POST** `/interactions/posts/:postId/report`

举报违规帖子。

#### 请求头

```
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| reason | string | 是 | 举报原因 |

#### 响应示例

```json
{
  "message": "Post reported successfully",
  "report": {
    "id": 1,
    "reporterId": 1,
    "postId": 1,
    "reason": "Inappropriate content",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误响应

- `400` - 缺少举报原因
- `409` - 已经举报过该帖子

---

### 9. 关注/取消关注用户

**POST** `/interactions/users/:userId/follow`

切换对用户的关注状态。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "message": "User followed",
  "following": true,
  "followersCount": 11
}
```

#### 错误响应

- `400` - 不能关注自己

---

## 用户 API

### 1. 获取用户资料

**GET** `/users/:userId/profile`

获取指定用户的公开资料。

#### 响应示例

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "avatar": null,
    "bio": "Hello, I'm John!",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "postsCount": 20,
    "followersCount": 100,
    "followingCount": 50,
    "isFollowing": false,
    "isBlocked": false
  }
}
```

---

### 2. 获取用户帖子

**GET** `/users/:userId/posts`

获取指定用户发布的帖子列表。

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 10 | 每页数量 |

#### 响应示例

```json
{
  "posts": [
    {
      "id": 1,
      "content": "Hello World!",
      "author": {
        "id": 1,
        "username": "john_doe",
        "avatar": null
      },
      "images": [],
      "likesCount": 10,
      "commentsCount": 5,
      "favoritesCount": 3,
      "repostsCount": 2,
      "isLiked": true,
      "isFavorited": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  }
}
```

---

### 3. 获取用户收藏

**GET** `/users/:userId/favorites`

获取指定用户的收藏帖子列表（仅自己可查看）。

#### 请求头

```
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 10 | 每页数量 |

#### 响应示例

```json
{
  "posts": [
    {
      "id": 1,
      "content": "Interesting post!",
      "author": {
        "id": 2,
        "username": "jane_doe",
        "avatar": null
      },
      "images": [],
      "likesCount": 50,
      "commentsCount": 20,
      "favoritesCount": 15,
      "repostsCount": 10,
      "isLiked": false,
      "isFavorited": true,
      "favoritedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### 错误响应

- `403` - 无权查看他人收藏

---

### 4. 获取拉黑列表

**GET** `/users/me/blocked`

获取当前用户拉黑的用户列表。

#### 请求头

```
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "blockedUsers": [
    {
      "id": 2,
      "username": "spam_user",
      "avatar": null,
      "bio": null,
      "blockedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 5. 获取粉丝列表

**GET** `/users/:userId/followers`

获取指定用户的粉丝列表。

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |

#### 响应示例

```json
{
  "followers": [
    {
      "id": 2,
      "username": "jane_doe",
      "avatar": null,
      "bio": "Hello!"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 6. 获取关注列表

**GET** `/users/:userId/following`

获取指定用户的关注列表。

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |

#### 响应示例

```json
{
  "following": [
    {
      "id": 2,
      "username": "jane_doe",
      "avatar": null,
      "bio": "Hello!"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

## 通用错误响应

### 400 Bad Request

```json
{
  "error": "Validation Error",
  "message": "Invalid input data"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Not authorized"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 409 Conflict

```json
{
  "error": "Conflict",
  "message": "Resource already exists"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

---

## 图片访问

上传的图片可以通过以下 URL 访问：

```
GET /uploads/<filename>
```

例如：`http://localhost:3000/uploads/image-123456.jpg`

---

## 技术栈

- **Node.js** - 运行环境
- **Express** - Web 框架
- **SQLite** - 数据库
- **Prisma** - ORM
- **JWT** - 认证
- **Multer** - 文件上传

---

## 运行项目

```bash
# 安装依赖
npm install

# 数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 生产环境启动
npm start
```

服务器默认运行在 `http://localhost:3000`
