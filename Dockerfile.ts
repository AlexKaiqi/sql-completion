FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# 使用api脚本启动服务
CMD ["npm", "run", "api"] 