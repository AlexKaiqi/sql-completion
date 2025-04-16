import { Router } from 'express';
import { ContextController } from '../controllers/context-controller';

const router = Router();
const contextController = new ContextController();

// 健康检查路由
router.get('/health', contextController.healthCheck);

// SQL上下文路由
router.post('/context', contextController.getContext);

export default router; 