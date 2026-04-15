# Social App API Documentation

## 技术栈
- Node.js + Express.js
- SQLite + Prisma ORM
- JWT 认证
- Multer 文件上传

## 快速开始

```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma migrate dev --name init

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

## 基础信息
- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json` (除文件上传外)

---

## 1. 认证接口 (Auth)

### 1.1 用户注册
**POST** `/api/auth/register`

**请求体**:
```json
{
  "username": "string (min: 3)",
  "email": "string (email format)",
  "password": "string (min: 6)"
}
```

**响应 201**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatar": null,
    "bio": null,
    "createdAt": "2026-04-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 用户登录
**POST** `/api/auth/login`

**请求体**:
```json
{
  "email": "string (email format)",
  "password": "string"
}
```

**响应 200**:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatar": null,
    "bio": null,
    "createdAt": "2026-04-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.3 获取当前用户信息
**GET** `/api/auth/me`

**Headers**: `Authorization: Bearer {token}`

**响应 200**:
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatar": null,
    "bio": null
  }
}
```

---

## 2. 帖子接口 (Posts)

### 2.1 创建帖子
**POST** `/api/posts`

**Headers**: `Authorization: Bearer {token}`

**Content-Type**: `multipart/form-data`

**参数**:
| 字段    | 类型   | 必填 | 说明                     |
|---------|--------|------|--------------------------|
| content | string | 是   | 帖子内容                 |
| image   | file   | 否   | 图片文件 (jpg, png, gif) |

**响应 201**:
```json
{
  "message": "Post created successfully",
  "post": {
    "id": 1,
    "content": "This is a test post",
    "image": "/uploads/image-123456789.jpg",
    "userId": 1,
    "createdAt": "2026-04-15T12:00:00.000Z",
    "updatedAt": "2026-04-15T12:00:00.000Z",
    "user": {
      "id": 1,
      "username": "testuser",
      "avatar": null
    }
  }
}
```

### 2.2 获取帖子列表
**GET** `/api/posts?page=1&limit=10`

**Headers**: `Authorization: Bearer {token}`

**查询参数**:
| 参数  | 类型 | 默认值 | 说明     |
|-------|------|--------|----------|
| page  | int  | 1      | 页码     |
| limit | int  | 10     | 每页数量 |

**响应 200**:
```json
{
  "posts": [
    {
      "id": 1,
      "content": "This is a test post",
      "image": null,
      "userId": 1,
      "createdAt": "2026-04-15T12:00:00.000Z",
      "user": {
        "id": 1,
        "username": "testuser",
        "avatar": null
      },
      "_count": {
        "likes": 5,
        "comments": 3,
        "favorites": 2,
        "reposts": 1
      },
      "isLiked": false,
      "isFavorited": false,
      "isReposted": false
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

### 2.3 获取帖子详情
**GET** `/api/posts/{id}`

**Headers**: `Authorization: Bearer {token}`

**响应 200**: 包含完整帖子信息、评论列表和互动状态

### 2.4 删除帖子
**DELETE** `/api/posts/{id}`

**Headers**: `Authorization: Bearer {token}`

**响应 200**:
```json
{
  "message": "Post deleted successfully"
}
```

---

## 3. 互动接口 (Interactions)

### 3.1 点赞/取消点赞
**POST** `/api/interactions/like`

**Headers**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "postId": 1
}
```

**响应 200**:
```json
{
  "message": "Post liked",
  "liked": true
}
```

### 3.2 收藏/取消收藏
**POST** `/api/interactions/favorite`

**Headers**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "postId": 1
}
```

**响应 200**:
```json
{
  "message": "Post favorited",
  "favorited": true
}
```

### 3.3 添加评论
**POST** `/api/interactions/comment`

**Headers**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "postId": 1,
  "content": "This is a comment"
}
```

**响应 201**: 包含评论信息和用户信息

### 3.4 删除评论
**DELETE** `/api/interactions/comment/{id}`

**Headers**: `Authorization: Bearer {token}`

### 3.5 转发/取消转发
**POST** `/api/interactions/repost`

**Headers**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "postId": 1
}
```

### 3.6 拉黑/取消拉黑
**POST** `/api/interactions/block`

**Headers**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "blockedId": 2
}
```

### 3.7 举报用户
**POST** `/api/interactions/report`

**Headers**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "reportedId": 2,
  "postId": 1,
  "reason": "Inappropriate content"
}
```

---

## 4. 用户接口 (Users)

### 4.1 获取用户资料
**GET** `/api/users/{id}`

**Headers**: `Authorization: Bearer {token}`

**响应 200**:
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatar": null,
    "bio": "This is my bio",
    "createdAt": "2026-04-15T12:00:00.000Z",
    "_count": {
      "posts": 10,
      "followers": 50,
      "following": 30
    },
    "isFollowing": false,
    "isBlocked": false
  }
}
```

### 4.2 更新用户资料
**PUT** `/api/users/profile`

**Headers**: `Authorization: Bearer {token}`

**Content-Type**: `multipart/form-data`

**参数**:
| 字段     | 类型   | 必填 | 说明         |
|----------|--------|------|--------------|
| username | string | 否   | 用户名       |
| bio      | string | 否   | 个人简介     |
| avatar   | file   | 否   | 头像图片文件 |

### 4.3 获取用户帖子列表
**GET** `/api/users/{id}/posts?page=1&limit=10`

**Headers**: `Authorization: Bearer {token}`

### 4.4 获取用户收藏列表
**GET** `/api/users/{id}/favorites?page=1&limit=10`

**Headers**: `Authorization: Bearer {token}`

**注意**: 只能查看自己的收藏

### 4.5 关注/取消关注
**POST** `/api/users/follow`

**Headers**: `Authorization: Bearer {token}`

**请求体**:
```json
{
  "followingId": 2
}
```

**响应 200**:
```json
{
  "message": "Followed successfully",
  "following": true
}
```

### 4.6 获取粉丝列表
**GET** `/api/users/{id}/followers`

**Headers**: `Authorization: Bearer {token}`

### 4.7 获取关注列表
**GET** `/api/users/{id}/following`

**Headers**: `Authorization: Bearer {token}`

### 4.8 获取拉黑用户列表
**GET** `/api/users/blocked/list`

**Headers**: `Authorization: Bearer {token}`

**响应 200**:
```json
{
  "blockedUsers": [
    {
      "id": 2,
      "username": "baduser",
      "avatar": null,
      "bio": null,
      "createdAt": "2026-04-15T12:00:00.000Z",
      "blockedAt": "2026-04-15T12:30:00.000Z"
    }
  ]
}
```

> **注意**: 
> - 已拉黑的用户不会出现在你的粉丝列表和关注列表中
> - 已拉黑用户的帖子也不会出现在你的信息流中

---

## 5. 信息流接口 (Feed)

### 5.1 获取信息流
**GET** `/api/feed?page=1&limit=10&type=all`

**Headers**: `Authorization: Bearer {token}`

**查询参数**:
| 参数  | 类型   | 默认值 | 说明                          |
|-------|--------|--------|-------------------------------|
| page  | int    | 1      | 页码                          |
| limit | int    | 10     | 每页数量                      |
| type  | string | all    | 类型: `all` - 全部, `following` - 关注用户 |

**响应 200**:
```json
{
  "posts": [
    {
      "id": 1,
      "content": "Post content",
      "image": null,
      "user": {
        "id": 1,
        "username": "testuser",
        "avatar": null
      },
      "comments": [...],
      "_count": {
        "likes": 10,
        "comments": 5,
        "favorites": 3,
        "reposts": 2
      },
      "isLiked": true,
      "isFavorited": false,
      "isReposted": false
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

## 静态文件访问

图片文件可以通过以下URL访问:
```
http://localhost:3000/uploads/{filename}
```

---

## 错误响应

### 400 Bad Request
```json
{
  "error": "Error message"
}
```
或字段验证错误:
```json
{
  "errors": [
    {
      "msg": "Invalid email format",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!"
}
```

---

## 数据库模型

### User
- id: Int (主键)
- username: String (唯一)
- email: String (唯一)
- password: String (加密)
- avatar: String? (头像URL)
- bio: String? (个人简介)
- createdAt: DateTime
- updatedAt: DateTime

### Post
- id: Int (主键)
- content: String
- image: String? (图片URL)
- userId: Int (外键)
- createdAt: DateTime
- updatedAt: DateTime

### Comment, Like, Favorite, Follow, Block, Report, Repost
- 各模型包含相应的关联字段和时间戳

---

## 安全特性

1. **密码加密**: 使用 bcryptjs 加密存储
2. **JWT认证**: 7天有效期Token
3. **输入验证**: 使用 express-validator
4. **权限控制**: 只能删除自己的帖子/评论
5. **CORS**: 跨域支持
6. **文件上传限制**: 单文件5MB，仅支持图片格式
