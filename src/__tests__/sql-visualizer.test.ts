import { describe, it, expect } from 'vitest';
import { SQLVisualizer } from '../utils/sql-visualizer';
import { CaretPosition } from '../types/context';
import { TestLogger } from '../utils/test-logger';

describe('SQLVisualizer', () => {
  describe('visualizeCursorPosition', () => {
    it('应该在光标位置插入|符号', () => {
      TestLogger.logTestStart('光标位置插入|符号测试');
      
      const sql = 'SELECT * FROM users';
      const position = { lineNumber: 1, column: 8 };
      
      TestLogger.logTestCase('光标位置插入|符号测试', { sql, position });
      
      const result = SQLVisualizer.visualizeCursorPosition(sql, position);
      TestLogger.logTestResult('结果', result);
      
      expect(result).toBe('SELECT |* FROM users');
      TestLogger.logTestEnd('光标位置插入|符号测试', true);
    });

    it('应该处理多行SQL', () => {
      TestLogger.logTestStart('多行SQL测试');
      
      const sql = 'SELECT *\nFROM users\nWHERE id = 1';
      const position = { lineNumber: 2, column: 5 };
      
      TestLogger.logTestCase('多行SQL测试', { sql, position });
      
      const result = SQLVisualizer.visualizeCursorPosition(sql, position);
      TestLogger.logTestResult('结果', result);
      
      expect(result).toBe('SELECT *\nFROM| users\nWHERE id = 1');
      TestLogger.logTestEnd('多行SQL测试', true);
    });

    it('应该处理无效的行号', () => {
      TestLogger.logTestStart('无效行号测试');
      
      const sql = 'SELECT * FROM users';
      const position: CaretPosition = { lineNumber: 10, column: 5 }; // 超出行数
      
      TestLogger.logTestCase('无效行号测试', { sql, position });
      
      const result = SQLVisualizer.visualizeCursorPosition(sql, position);
      TestLogger.logTestResult('结果', result);
      
      expect(result).toBe('SELECT * FROM users');
      TestLogger.logTestEnd('无效行号测试', true);
    });

    it('应该处理无效的列号', () => {
      TestLogger.logTestStart('无效列号测试');
      
      const sql = 'SELECT * FROM users';
      const position: CaretPosition = { lineNumber: 1, column: 100 }; // 超出列数
      
      TestLogger.logTestCase('无效列号测试', { sql, position });
      
      const result = SQLVisualizer.visualizeCursorPosition(sql, position);
      TestLogger.logTestResult('结果', result);
      
      expect(result).toBe('SELECT * FROM users|');
      TestLogger.logTestEnd('无效列号测试', true);
    });

    it('应该处理空SQL', () => {
      TestLogger.logTestStart('空SQL测试');
      
      const sql = '';
      const position: CaretPosition = { lineNumber: 1, column: 1 };
      
      TestLogger.logTestCase('空SQL测试', { sql, position });
      
      const result = SQLVisualizer.visualizeCursorPosition(sql, position);
      TestLogger.logTestResult('结果', result);
      
      expect(result).toBe('');
      TestLogger.logTestEnd('空SQL测试', true);
    });
  });

  describe('formatSQLWithLineNumbers', () => {
    it('应该添加行号和光标位置', () => {
      TestLogger.logTestStart('添加行号和光标位置测试');
      
      const sql = 'SELECT * FROM users WHERE id = 1';
      const position: CaretPosition = { lineNumber: 1, column: 8 };
      
      TestLogger.logTestCase('添加行号和光标位置测试', { sql, position });
      
      const result = SQLVisualizer.formatSQLWithLineNumbers(sql, position);
      TestLogger.logTestResult('结果', result);
      
      expect(result).toBe('  1 | SELECT |* FROM users WHERE id = 1');
      TestLogger.logTestEnd('添加行号和光标位置测试', true);
    });

    it('应该处理多行SQL', () => {
      TestLogger.logTestStart('多行SQL格式化测试');
      
      const sql = 'SELECT *\nFROM users\nWHERE id = 1';
      const position: CaretPosition = { lineNumber: 2, column: 5 };
      
      TestLogger.logTestCase('多行SQL格式化测试', { sql, position });
      
      const result = SQLVisualizer.formatSQLWithLineNumbers(sql, position);
      TestLogger.logTestResult('结果', result);
      
      expect(result).toBe('  1 | SELECT *\n  2 | FROM| users\n  3 | WHERE id = 1');
      TestLogger.logTestEnd('多行SQL格式化测试', true);
    });

    it('应该处理空SQL', () => {
      TestLogger.logTestStart('空SQL格式化测试');
      
      const sql = '';
      const position: CaretPosition = { lineNumber: 1, column: 1 };
      
      TestLogger.logTestCase('空SQL格式化测试', { sql, position });
      
      const result = SQLVisualizer.formatSQLWithLineNumbers(sql, position);
      TestLogger.logTestResult('结果', result);
      
      expect(result).toBe('');
      TestLogger.logTestEnd('空SQL格式化测试', true);
    });
  });
}); 