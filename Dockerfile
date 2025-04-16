# 构建阶段
FROM node:23-alpine as builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 运行阶段
FROM node:23-alpine

WORKDIR /app

# 复制依赖文件并安装所有依赖（包括开发依赖）
COPY package*.json ./
RUN npm install

# 从构建阶段复制源代码和编译后的文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 暴露端口
EXPOSE 3000

# 添加调试命令
RUN echo "Listing /app directory:" && \
    ls -la /app && \
    echo "\nListing /app/src directory:" && \
    ls -la /app/src && \
    echo "\nListing /app/dist directory:" && \
    ls -la /app/dist

# 启动服务
CMD ["npm", "start"] 