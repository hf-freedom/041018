# 社交应用 RESTful API 文档

## 基础信息

- **基础URL**: `http://localhost:3000`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON
- **状态码说明**:
  - `200` - 成功
  - `201` - 创建成功
  - `400` - 请求参数错误
  - `401` - 未授权/认证失败
  - `403` - 禁止访问
  - `404` - 资源不存在
  - `500` - 服务器错误

---

## 目录

1. [认证接口](#1-认证接口)
2. [帖子接口](#2-帖子接口)
3. [互动接口](#3-互动接口)
4. [用户接口](#4-用户接口)
5. [上传接口](#5-上传接口)

---

## 1. 认证接口

### 1.1 用户注册

**接口地址**: `POST /api/auth/register`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 (3-30字符) |
| email | string | 是 | 邮箱 |
| password | string | 是 | 密码 (至少6位) |
| nickname | string | 否 | 昵称 |

**请求示例**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "nickname": "测试用户"
}
```

**响应示例** (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "nickname": "测试用户",
    "avatar": null,
    "bio": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.2 用户登录

**接口地址**: `POST /api/auth/login`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| email | string | 是 | 邮箱 |
| password | string | 是 | 密码 |

**请求示例**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**响应示例** (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "nickname": "测试用户",
    "avatar": null,
    "bio": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.3 获取当前用户信息

**接口地址**: `GET /api/auth/me`

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例** (200):
```json
{
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "nickname": "测试用户",
    "avatar": null,
    "bio": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "posts": 10,
      "followers": 50,
      "follows": 30
    }
  }
}
```

---

## 2. 帖子接口

### 2.1 创建帖子

**接口地址**: `POST /api/posts`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | string | 是 | 帖子内容 |
| images | string[] | 否 | 图片URL数组 |

**请求示例**:
```json
{
  "content": "这是我的第一条帖子",
  "images": ["/uploads/image1.jpg", "/uploads/image2.jpg"]
}
```

**响应示例** (201):
```json
{
  "message": "Post created successfully",
  "post": {
    "id": "uuid",
    "content": "这是我的第一条帖子",
    "images": ["/uploads/image1.jpg", "/uploads/image2.jpg"],
    "authorId": "uuid",
    "author": {
      "id": "uuid",
      "username": "testuser",
      "nickname": "测试用户",
      "avatar": null
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "likes": 0,
      "comments": 0,
      "favorites": 0,
      "reposts": 0
    }
  }
}
```

---

### 2.2 获取帖子列表（信息流）

**接口地址**: `GET /api/posts`

**查询参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

**响应示例** (200):
```json
{
  "posts": [
    {
      "id": "uuid",
      "content": "帖子内容",
      "images": [],
      "authorId": "uuid",
      "author": {
        "id": "uuid",
        "username": "testuser",
        "nickname": "测试用户",
        "avatar": null
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "likes": 5,
        "comments": 2,
        "favorites": 1,
        "reposts": 0
      }
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

### 2.3 获取单个帖子

**接口地址**: `GET /api/posts/:id`

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| id | 帖子ID |

**响应示例** (200):
```json
{
  "post": {
    "id": "uuid",
    "content": "帖子内容",
    "images": [],
    "authorId": "uuid",
    "author": {
      "id": "uuid",
      "username": "testuser",
      "nickname": "测试用户",
      "avatar": null
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "likes": 5,
      "comments": 2,
      "favorites": 1,
      "reposts": 0
    }
  }
}
```

---

### 2.4 更新帖子

**接口地址**: `PUT /api/posts/:id`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| id | 帖子ID |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | string | 是 | 帖子内容 |
| images | string[] | 否 | 图片URL数组 |

---

### 2.5 删除帖子

**接口地址**: `DELETE /api/posts/:id`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| id | 帖子ID |

**响应示例** (200):
```json
{
  "message": "Post deleted successfully"
}
```

---

### 2.6 获取帖子评论

**接口地址**: `GET /api/posts/:id/comments`

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| id | 帖子ID |

**查询参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

---

## 3. 互动接口

### 3.1 点赞帖子

**接口地址**: `POST /api/interactions/posts/:postId/like`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| postId | 帖子ID |

**响应示例** (201):
```json
{
  "message": "Post liked successfully",
  "like": {
    "id": "uuid",
    "postId": "uuid",
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.2 取消点赞

**接口地址**: `DELETE /api/interactions/posts/:postId/like`

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例** (200):
```json
{
  "message": "Post unliked successfully"
}
```

---

### 3.3 收藏帖子

**接口地址**: `POST /api/interactions/posts/:postId/favorite`

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例** (201):
```json
{
  "message": "Post favorited successfully",
  "favorite": {
    "id": "uuid",
    "postId": "uuid",
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.4 取消收藏

**接口地址**: `DELETE /api/interactions/posts/:postId/favorite`

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例** (200):
```json
{
  "message": "Post unfavorited successfully"
}
```

---

### 3.5 举报帖子

**接口地址**: `POST /api/interactions/posts/:postId/report`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reason | string | 是 | 举报原因 |

**响应示例** (201):
```json
{
  "message": "Post reported successfully",
  "report": {
    "id": "uuid",
    "postId": "uuid",
    "reporterId": "uuid",
    "reason": "不当内容",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.6 转发帖子

**接口地址**: `POST /api/interactions/posts/:postId/repost`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | string | 否 | 转发评论 |

**响应示例** (201):
```json
{
  "message": "Post reposted successfully",
  "repost": {
    "id": "uuid",
    "postId": "uuid",
    "userId": "uuid",
    "content": "转发评论",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.7 取消转发

**接口地址**: `DELETE /api/interactions/posts/:postId/repost`

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例** (200):
```json
{
  "message": "Post unreposted successfully"
}
```

---

### 3.8 添加评论

**接口地址**: `POST /api/interactions/posts/:postId/comments`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | string | 是 | 评论内容 |
| parentId | string | 否 | 父评论ID (用于回复) |

**响应示例** (201):
```json
{
  "message": "Comment created successfully",
  "comment": {
    "id": "uuid",
    "content": "评论内容",
    "postId": "uuid",
    "authorId": "uuid",
    "parentId": null,
    "author": {
      "id": "uuid",
      "username": "testuser",
      "nickname": "测试用户",
      "avatar": null
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.9 删除评论

**接口地址**: `DELETE /api/interactions/comments/:commentId`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| commentId | 评论ID |

**响应示例** (200):
```json
{
  "message": "Comment deleted successfully"
}
```

---

### 3.10 关注用户

**接口地址**: `POST /api/interactions/users/:userId/follow`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| userId | 用户ID |

**响应示例** (201):
```json
{
  "message": "User followed successfully",
  "follow": {
    "id": "uuid",
    "followerId": "uuid",
    "followingId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.11 取消关注

**接口地址**: `DELETE /api/interactions/users/:userId/follow`

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例** (200):
```json
{
  "message": "User unfollowed successfully"
}
```

---

### 3.12 拉黑用户

**接口地址**: `POST /api/interactions/users/:userId/block`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| userId | 用户ID |

**响应示例** (201):
```json
{
  "message": "User blocked successfully",
  "block": {
    "id": "uuid",
    "blockerId": "uuid",
    "blockedId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.13 取消拉黑

**接口地址**: `DELETE /api/interactions/users/:userId/block`

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例** (200):
```json
{
  "message": "User unblocked successfully"
}
```

---

## 4. 用户接口

### 4.1 获取用户信息

**接口地址**: `GET /api/users/:id`

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| id | 用户ID |

**响应示例** (200):
```json
{
  "user": {
    "id": "uuid",
    "username": "testuser",
    "nickname": "测试用户",
    "avatar": null,
    "bio": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "posts": 10,
      "followers": 50,
      "follows": 30
    }
  }
}
```

---

### 4.2 更新个人资料

**接口地址**: `PUT /api/users/profile`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | string | 否 | 昵称 |
| bio | string | 否 | 个人简介 |
| avatar | string | 否 | 头像URL |

**响应示例** (200):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "nickname": "新昵称",
    "avatar": null,
    "bio": "新的简介",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4.3 获取用户帖子列表

**接口地址**: `GET /api/users/:id/posts`

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| id | 用户ID |

**查询参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

---

### 4.4 获取用户粉丝列表

**接口地址**: `GET /api/users/:id/followers`

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| id | 用户ID |

---

### 4.5 获取用户关注列表

**接口地址**: `GET /api/users/:id/following`

**路径参数**:

| 参数名 | 说明 |
|--------|------|
| id | 用户ID |

---

### 4.6 获取当前用户收藏列表

**接口地址**: `GET /api/users/me/favorites`

**请求头**:
```
Authorization: Bearer <token>
```

---

### 4.7 获取当前用户点赞列表

**接口地址**: `GET /api/users/me/likes`

**请求头**:
```
Authorization: Bearer <token>
```

---

### 4.8 获取当前用户拉黑列表

**接口地址**: `GET /api/users/me/blocked`

**请求头**:
```
Authorization: Bearer <token>
```

---

## 5. 上传接口

### 5.1 上传单张图片

**接口地址**: `POST /api/uploads/image`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求表单**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| image | file | 是 | 图片文件 (最大5MB) |

**支持格式**: JPEG, PNG, GIF, WebP

**响应示例** (201):
```json
{
  "message": "Image uploaded successfully",
  "file": {
    "filename": "uuid.jpg",
    "url": "/uploads/uuid.jpg",
    "size": 102400,
    "mimetype": "image/jpeg"
  }
}
```

---

### 5.2 上传多张图片

**接口地址**: `POST /api/uploads/images`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求表单**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| images | file[] | 是 | 图片文件数组 (最多9张) |

**响应示例** (201):
```json
{
  "message": "Images uploaded successfully",
  "files": [
    {
      "filename": "uuid1.jpg",
      "url": "/uploads/uuid1.jpg",
      "size": 102400,
      "mimetype": "image/jpeg"
    },
    {
      "filename": "uuid2.jpg",
      "url": "/uploads/uuid2.jpg",
      "size": 51200,
      "mimetype": "image/png"
    }
  ]
}
```

---

## 错误响应格式

```json
{
  "error": "错误信息"
}
```

或

```json
{
  "errors": [
    {
      "field": "email",
      "message": "请输入有效的邮箱地址"
    }
  ]
}
```
