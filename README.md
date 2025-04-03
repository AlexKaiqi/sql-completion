# SQL 智能补全工具

这是一个基于 `dt-sql-parser` 的 SQL 智能补全工具，能够根据上下文提供准确的 SQL 补全建议。

## 功能特性

- 基于上下文的智能补全
  - SELECT 语句中的列名补全
  - FROM 子句中的表名补全
  - WHERE 子句中的条件补全
  - JOIN 子句中的表名和列名补全
  - GROUP BY 和 ORDER BY 子句中的列名补全
- 支持表结构元数据管理
- 支持 MySQL 语法解析
- 提供精确的光标位置分析
- 支持数据库、表、视图的元数据管理
- 支持表别名和列别名的智能补全

## 安装

```bash
npm install dt-sql-parser
```

## 使用方法

### 基本使用

```typescript
import { MySQL, EntityContextType, StmtContextType, CaretPosition, Suggestions } from 'dt-sql-parser';
import { MetadataManager } from './metadata';
import { ScopeAnalyzer } from './scope';
import { getSuggestions } from './suggestions';

// 初始化解析器和元数据管理器
const parser = new MySQL();
const metadataManager = new MetadataManager();
const scopeAnalyzer = new ScopeAnalyzer(parser, metadataManager);

// 注册表结构
const createTablesSQL = `
CREATE TABLE users (
    id INT,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP
);
`;
metadataManager.registerTableMetadata(createTablesSQL);

// 获取补全建议
const sql = 'SELECT * FROM users WHERE id = 1';
const position = { lineNumber: 1, column: 8 };
const context = scopeAnalyzer.getContextAtPosition(sql, position);
const suggestions = getSuggestions(context);
```

### 补全场景示例

1. SELECT 语句补全
```sql
SELECT |  -- 光标位置
```
将提供所有可用的列名建议。

2. 带表名的列名补全
```sql
SELECT users.|  -- 光标位置
```
预期：提供 users 表的列名建议，如 `users.id`, `users.name`, `users.email` 等

3. 多表查询的列名补全
```sql
SELECT u.| FROM users u  -- 光标位置
```
预期：提供 users 表的列名建议，并带有表别名 `u.id`, `u.name`, `u.email` 等

#### 2. FROM 子句补全

1. 基础表名补全
```sql
SELECT * FROM |  -- 光标位置
```
预期：提供所有可用的表名建议，如 `users`, `orders` 等

2. 带数据库名的表名补全
```sql
SELECT * FROM mydb.|  -- 光标位置
```
预期：提供 mydb 数据库中的表名建议

3. 表别名补全
```sql
SELECT * FROM users |  -- 光标位置
```
预期：提供表别名建议，如 `AS u`, `u` 等

#### 3. WHERE 子句补全

1. 条件运算符补全
```sql
SELECT * FROM users WHERE id |  -- 光标位置
```
预期：提供运算符建议，如 `=`, `>`, `<`, `>=`, `<=`, `!=` 等

2. 逻辑运算符补全
```sql
SELECT * FROM users WHERE id = 1 |  -- 光标位置
```
预期：提供逻辑运算符建议，如 `AND`, `OR`, `NOT` 等

3. 函数补全
```sql
SELECT * FROM users WHERE |  -- 光标位置
```
预期：提供常用函数建议，如 `COUNT()`, `SUM()`, `AVG()`, `MAX()`, `MIN()` 等

#### 4. JOIN 子句补全

1. JOIN 类型补全
```sql
SELECT * FROM users |  -- 光标位置
```
预期：提供 JOIN 类型建议，如 `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `FULL JOIN` 等

2. JOIN 条件补全
```sql
SELECT * FROM users u INNER JOIN orders o ON |  -- 光标位置
```
预期：提供关联条件建议，如 `u.id = o.user_id` 等

#### 5. GROUP BY 子句补全

1. 分组列补全
```sql
SELECT * FROM orders GROUP BY |  -- 光标位置
```
预期：提供可用的列名建议，如 `status`, `user_id` 等

#### 6. ORDER BY 子句补全

1. 排序列补全
```sql
SELECT * FROM users ORDER BY |  -- 光标位置
```
预期：提供可用的列名建议，如 `id`, `name`, `created_at` 等

2. 排序方向补全
```sql
SELECT * FROM users ORDER BY id |  -- 光标位置
```
预期：提供排序方向建议，如 `ASC`, `DESC` 等

#### 7. HAVING 子句补全

1. 聚合条件补全
```sql
SELECT user_id, COUNT(*) FROM orders GROUP BY user_id HAVING |  -- 光标位置
```
预期：提供聚合函数和条件建议，如 `COUNT(*) > 1`, `SUM(amount) > 100` 等

## 项目结构

```
src/
├── index.ts           # 主入口文件
├── metadata.ts        # 元数据管理
├── scope.ts          # 作用域分析
├── suggestions.ts    # 补全建议生成
└── types/            # 类型定义
    ├── metadata.ts   # 元数据类型定义
    └── scope.ts      # 作用域类型定义
```

## 核心组件

### MetadataManager
负责管理所有元数据，包括：
- 数据库信息
- 表结构
- 视图定义
- 表关系

### MetadataCollector
负责从 SQL 语句中收集实体信息：
- 表名
- 列名
- 别名
- 函数调用

### ScopeAnalyzer
负责分析 SQL 语句的作用域：
- 构建上下文信息
- 解析表别名
- 确定可访问的实体

## 开发

### 环境要求

- Node.js >= 14
- TypeScript >= 4.0

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT 