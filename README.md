# SQL 上下文分析服务

这是一个基于 Express 的 RESTful 服务，用于分析 SQL 语句的上下文信息，支持多种 SQL 方言。

## 功能特性

- 支持多种 SQL 方言
  - MySQL
  - PostgreSQL
  - Hive
  - Spark SQL
  - Trino
- 提供 SQL 上下文分析
  - 光标位置语法分析
  - 子句类型识别
  - 位置类型判断
- 请求追踪
  - 唯一请求 ID
  - 完整日志记录
- RESTful API 接口
- 健康检查接口

## 安装

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 启动服务
npm start
```

## API 接口

### 1. 获取 SQL 上下文

#### 上下文 API 请求

```http
POST /api/context
Content-Type: application/json
X-Request-ID: <可选的请求ID>

{
  "sql": "SELECT * FROM users WHERE id = 1",
  "position": {
    "lineNumber": 1,
    "column": 8
  },
  "language": "mysql"  // 可选值: mysql, postgresql, hive, spark, trino
}
```

#### 上下文 API 响应

```json
{
  "context": {
    "syntax": {
      "clauseType": "string",
      "positionType": "string"
    }
    // 其他上下文信息
  }
}
```

### 2. 健康检查

#### 健康检查 API 请求

```http
GET /api/health
X-Request-ID: <可选的请求ID>
```

#### 健康检查 API 响应

```json
{
  "status": "ok"
}
```

## 错误处理

服务会返回适当的 HTTP 状态码和错误信息：

- 400: 无效的请求参数
- 500: 服务器内部错误

错误响应格式：

```json
{
  "error": "错误类型",
  "message": "详细错误信息"
}
```

## 开发

### 项目结构

```text
src/
├── config/         # 配置文件
├── controllers/    # 控制器
├── middleware/     # 中间件
├── routes/        # 路由定义
├── services/      # 业务逻辑
├── types/         # 类型定义
├── utils/         # 工具函数
└── server.ts      # 服务入口
```

### 日志系统

服务使用结构化日志记录，包含以下级别：

- DEBUG: 调试信息
- INFO: 常规信息
- WARN: 警告信息
- ERROR: 错误信息

每条日志都包含：

- 时间戳
- 日志级别
- 请求 ID（如果有）
- 消息内容
- 元数据（如果有）
