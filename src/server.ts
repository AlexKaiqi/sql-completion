import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config';
import contextRoutes from './routes/context-routes';
import { requestIdMiddleware } from './middleware/request-id';
import { Logger } from './utils/logger';

// 创建Express应用
const app = express();

// 中间件
app.use(cors(config.cors));
app.use(bodyParser.json());
app.use(requestIdMiddleware);

// 注册路由
app.use('/api', contextRoutes);

// 启动服务器
app.listen(config.server.port, () => {
  Logger.info(`SQL上下文服务已启动，监听端口 ${config.server.port}`);
}); 