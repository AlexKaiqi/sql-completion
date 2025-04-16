import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * 请求ID中间件
 * 为每个请求生成唯一的请求ID
 */
export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  // 从请求头中获取请求ID，如果没有则生成新的
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  next();
}; 