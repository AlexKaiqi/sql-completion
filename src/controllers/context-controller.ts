import { Request, Response } from 'express';
import { SQLContextService } from '../services/context-service';
import { CaretPosition, SQLLanguage } from '../types/context';
import { Logger } from '../utils/logger';
import { SQLVisualizer } from '../utils/sql-visualizer';

export class ContextController {
  private contextService: SQLContextService;

  constructor() {
    this.contextService = new SQLContextService();
  }

  public getContext = async (req: Request, res: Response): Promise<void> => {
    const requestId = req.requestId;
    try {
      const { sql, position, language = 'mysql' } = req.body;
      
      // 使用SQLVisualizer增强日志展示
      const visualizedSQL = SQLVisualizer.visualizeCursorPosition(sql, position);
      Logger.info('收到SQL上下文请求', requestId, { 
        sql: visualizedSQL, 
        position, 
        language 
      });
      
      // 验证请求参数
      if (!sql || !position || typeof position.lineNumber !== 'number' || typeof position.column !== 'number') {
        Logger.warn('无效的请求参数', requestId, { sql, position });
        res.status(400).json({ 
          error: '无效的请求参数', 
          message: '请提供有效的SQL语句和光标位置' 
        });
        return;
      }

      // 验证语言类型
      const validLanguages: SQLLanguage[] = ['mysql', 'postgresql', 'hive', 'spark', 'trino'];
      if (!validLanguages.includes(language)) {
        Logger.warn('无效的SQL语言类型', requestId, { language });
        res.status(400).json({
          error: '无效的SQL语言类型',
          message: `支持的语言类型: ${validLanguages.join(', ')}`
        });
        return;
      }
      
      // 收集上下文信息
      const context = this.contextService.collect(sql, position as CaretPosition, language as SQLLanguage);
      
      // 使用更详细的SQL可视化格式记录成功信息
      const formattedSQL = SQLVisualizer.formatSQLWithLineNumbers(sql, position);
      Logger.info('成功生成SQL上下文', requestId, { 
        formattedSQL: formattedSQL,
        context: context
      });
      
      // 返回上下文信息
      res.json({ context });
    } catch (error) {
      Logger.error('处理请求时出错', requestId, { 
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ 
        error: '服务器内部错误', 
        message: error instanceof Error ? error.message : '未知错误' 
      });
    }
  };

  public healthCheck = (req: Request, res: Response): void => {
    const requestId = req.requestId;
    Logger.debug('健康检查请求', requestId);
    res.json({ status: 'ok' });
  };
} 