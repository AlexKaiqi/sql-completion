import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';
import { config } from '../config';
import { SQLLanguage } from '../types/context';
import { v4 as uuidv4 } from 'uuid';
import { TestLogger } from '../utils/test-logger';

const BASE_URL = `http://${config.server.host}:${config.server.port}/api`;

describe('服务器集成测试', () => {
  it('应该能正常响应健康检查请求', async () => {
    TestLogger.logTestStart('健康检查测试');
    
    const requestId = uuidv4();
    TestLogger.logTestCase('健康检查测试', { requestId });
    
    const response = await fetch(`${BASE_URL}/health`, {
      headers: {
        'x-request-id': requestId
      }
    });
    
    const data = await response.json();
    TestLogger.logTestResult('响应状态', response.status);
    TestLogger.logTestResult('响应数据', data);
    
    expect(response.ok).toBe(true);
    expect(data).toBeDefined();
    TestLogger.logTestEnd('健康检查测试', true);
  });

  it('应该能正确处理上下文API请求', async () => {
    TestLogger.logTestStart('上下文API测试');
    
    const testCases = [
      {
        name: 'Spark SQL基本SELECT语句',
        sql: 'SELECT * FROM users WHERE id = 1',
        position: { lineNumber: 1, column: 8 },  // 光标在 * 后面
        language: 'SparkSQL' as SQLLanguage
      },
      {
        name: 'Spark SQL窗口函数',
        sql: 'SELECT name, salary, RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rank FROM employees',
        position: { lineNumber: 1, column: 35 },  // 光标在 OVER 后面
        language: 'spark' as SQLLanguage
      }
    ];

    for (const testCase of testCases) {
      TestLogger.logTestStart(`上下文API测试 - ${testCase.name}`);
      
      const requestId = uuidv4();
      TestLogger.logTestCase('请求信息', { 
        requestId, 
        sql: testCase.sql, 
        position: testCase.position, 
        language: testCase.language 
      });
      
      const response = await fetch(`${BASE_URL}/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId
        },
        body: JSON.stringify({
          sql: testCase.sql,
          position: testCase.position,
          language: testCase.language
        })
      });

      const data = await response.json();
      TestLogger.logTestResult('响应状态', response.status);
      TestLogger.logTestResult('响应数据', data);
      
      expect(response.ok).toBe(true);
      expect(data).toBeDefined();
      TestLogger.logTestEnd(`上下文API测试 - ${testCase.name}`, true);
    }
    
    TestLogger.logTestEnd('上下文API测试', true);
  });
}); 