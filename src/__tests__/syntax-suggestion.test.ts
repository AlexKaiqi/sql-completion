import { SparkSQL } from 'dt-sql-parser';
import { CaretPosition, SQLLanguage } from '../types/context.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestLogger } from '../utils/test-logger';

describe('SyntaxSuggestion 测试', () => {
  let parser: SparkSQL;

  beforeEach(() => {
    parser = new SparkSQL();
  });

  describe('实体上下文测试', () => {
    it('应该在表名位置返回 TABLE 类型', () => {
      TestLogger.logTestStart('表名位置测试');
      
      const sql = 'SELECT * FROM users WHERE id = 1';
      const position: CaretPosition = { lineNumber: 1, column: 15 }; // 光标在 users 后面
      
      TestLogger.logTestCase('表名位置测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('table');
      TestLogger.logTestEnd('表名位置测试', true);
    });

    it('应该在列名位置返回 COLUMN 类型', () => {
      TestLogger.logTestStart('列名位置测试');
      
      const sql = 'SELECT id, name FROM users';
      const position: CaretPosition = { lineNumber: 1, column: 8 }; // 光标在 id 后面
      
      TestLogger.logTestCase('列名位置测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('column');
      TestLogger.logTestEnd('列名位置测试', true);
    });

    it('应该在数据库名位置返回 DATABASE 类型', () => {
      TestLogger.logTestStart('数据库名位置测试');
      
      const sql = 'USE my_database';
      const position: CaretPosition = { lineNumber: 1, column: 5 }; // 光标在 USE 后面
      
      TestLogger.logTestCase('数据库名位置测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('database');
      TestLogger.logTestEnd('数据库名位置测试', true);
    });

    it('应该在函数名位置返回 FUNCTION 类型', () => {
      TestLogger.logTestStart('函数名位置测试');
      
      const sql = 'SELECT COUNT(*) FROM users';
      const position: CaretPosition = { lineNumber: 1, column: 8 }; // 光标在 COUNT 后面
      
      TestLogger.logTestCase('函数名位置测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('function');
      TestLogger.logTestEnd('函数名位置测试', true);
    });
  });

  describe('语句上下文测试', () => {
    it('应该在 SELECT 子句位置返回正确的语句类型', () => {
      TestLogger.logTestStart('SELECT 子句测试');
      
      const sql = 'SELECT * FROM users';
      const position: CaretPosition = { lineNumber: 1, column: 7 }; // 光标在 SELECT 后面
      
      TestLogger.logTestCase('SELECT 子句测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('selectClause');
      TestLogger.logTestEnd('SELECT 子句测试', true);
    });

    it('应该在 WHERE 子句位置返回正确的语句类型', () => {
      TestLogger.logTestStart('WHERE 子句测试');
      
      const sql = 'SELECT * FROM users WHERE id = 1';
      const position: CaretPosition = { lineNumber: 1, column: 25 }; // 光标在 WHERE 后面
      
      TestLogger.logTestCase('WHERE 子句测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('whereClause');
      TestLogger.logTestEnd('WHERE 子句测试', true);
    });

    it('应该在 GROUP BY 子句位置返回正确的语句类型', () => {
      TestLogger.logTestStart('GROUP BY 子句测试');
      
      const sql = 'SELECT department, COUNT(*) FROM employees GROUP BY department';
      const position: CaretPosition = { lineNumber: 1, column: 55 }; // 光标在 GROUP BY 后面
      
      TestLogger.logTestCase('GROUP BY 子句测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('groupByClause');
      TestLogger.logTestEnd('GROUP BY 子句测试', true);
    });
  });

  describe('复杂查询测试', () => {
    it('应该在子查询中正确识别上下文', () => {
      TestLogger.logTestStart('子查询测试');
      
      const sql = 'SELECT * FROM (SELECT id FROM users) t';
      const position: CaretPosition = { lineNumber: 1, column: 20 }; // 光标在内部 SELECT 后面
      
      TestLogger.logTestCase('子查询测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('selectClause');
      TestLogger.logTestEnd('子查询测试', true);
    });

    it('应该在 JOIN 语句中正确识别上下文', () => {
      TestLogger.logTestStart('JOIN 语句测试');
      
      const sql = 'SELECT u.name FROM users u JOIN orders o ON u.id = o.user_id';
      const position: CaretPosition = { lineNumber: 1, column: 25 }; // 光标在 JOIN 后面
      
      TestLogger.logTestCase('JOIN 语句测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('joinClause');
      TestLogger.logTestEnd('JOIN 语句测试', true);
    });

    it('应该在窗口函数中正确识别上下文', () => {
      TestLogger.logTestStart('窗口函数测试');
      
      const sql = 'SELECT name, RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rank FROM employees';
      const position: CaretPosition = { lineNumber: 1, column: 35 }; // 光标在 OVER 后面
      
      TestLogger.logTestCase('窗口函数测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('windowClause');
      TestLogger.logTestEnd('窗口函数测试', true);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空SQL语句', () => {
      TestLogger.logTestStart('空SQL语句测试');
      
      const sql = '';
      const position: CaretPosition = { lineNumber: 1, column: 1 };
      
      TestLogger.logTestCase('空SQL语句测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax).toBeDefined();
      TestLogger.logTestEnd('空SQL语句测试', true);
    });

    it('应该处理无效的光标位置', () => {
      TestLogger.logTestStart('无效光标位置测试');
      
      const sql = 'SELECT * FROM users';
      const position: CaretPosition = { lineNumber: 1, column: 100 }; // 超出列数
      
      TestLogger.logTestCase('无效光标位置测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax).toBeDefined();
      TestLogger.logTestEnd('无效光标位置测试', true);
    });

    it('应该处理多行SQL语句', () => {
      TestLogger.logTestStart('多行SQL语句测试');
      
      const sql = 'SELECT *\nFROM users\nWHERE id = 1';
      const position: CaretPosition = { lineNumber: 2, column: 5 }; // 光标在第二行
      
      TestLogger.logTestCase('多行SQL语句测试', { sql, position });
      
      const suggestions = parser.getSuggestionAtCaretPosition(sql, position);
      TestLogger.logTestResult('完整建议', suggestions);
      
      expect(suggestions?.syntax[0].syntaxContextType).toBe('table');
      TestLogger.logTestEnd('多行SQL语句测试', true);
    });
  });
}); 