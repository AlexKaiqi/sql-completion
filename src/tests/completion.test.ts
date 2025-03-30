import { FlinkSQLCompletionService } from '../services/flinkSQLCompletion';
import { testContext } from '../config/testData';

describe('FlinkSQL Completion Tests', () => {
    let completionService: FlinkSQLCompletionService;

    beforeEach(() => {
        completionService = new FlinkSQLCompletionService(testContext);
    });

    // 测试场景 1: 空 SQL 语句的补全
    test('Empty SQL completion', () => {
        const result = completionService.getCompletionItems('', 0);
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.items.some(item => item.kind === 'keyword')).toBe(true);
    });

    // 测试场景 2: SELECT 语句中的列名补全
    test('Column completion in SELECT statement', () => {
        const sql = 'SELECT ';
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => item.kind === 'column')).toBe(true);
    });

    // 测试场景 3: FROM 子句中的表名补全
    test('Table completion in FROM clause', () => {
        const sql = 'SELECT * FROM ';
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => item.kind === 'table')).toBe(true);
    });

    // 测试场景 4: WHERE 子句中的列名补全
    test('Column completion in WHERE clause', () => {
        const sql = 'SELECT * FROM users WHERE ';
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => item.kind === 'column')).toBe(true);
    });

    // 测试场景 5: 聚合函数补全
    test('Aggregate function completion', () => {
        const sql = 'SELECT ';
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => 
            item.kind === 'function' && 
            ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'].includes(item.label)
        )).toBe(true);
    });

    // 测试场景 6: JOIN 语句中的表名补全
    test('Table completion in JOIN clause', () => {
        const sql = 'SELECT * FROM users JOIN ';
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => item.kind === 'table')).toBe(true);
    });

    // 测试场景 7: GROUP BY 子句中的列名补全
    test('Column completion in GROUP BY clause', () => {
        const sql = 'SELECT * FROM users GROUP BY ';
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => item.kind === 'column')).toBe(true);
    });

    // 测试场景 8: 多行 SQL 中的补全
    test('Completion in multi-line SQL', () => {
        const sql = `SELECT *
FROM users
WHERE `;
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => item.kind === 'column')).toBe(true);
    });

    // 测试场景 9: 不完整 SQL 语句的补全
    test('Completion in incomplete SQL', () => {
        const sql = 'SELECT * FR';
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => item.label === 'FROM')).toBe(true);
    });

    // 测试场景 10: 复杂查询中的补全
    test('Completion in complex query', () => {
        const sql = `SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY `;
        const result = completionService.getCompletionItems(sql, sql.length);
        expect(result.items.some(item => item.kind === 'column')).toBe(true);
    });
}); 