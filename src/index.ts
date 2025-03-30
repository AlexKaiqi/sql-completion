import { SQLParserService } from './services/sqlParser';
import { formatSQL } from './utils/sqlFormatter';
import { sqlConfig } from './config/sql.config';
import { FlinkSQLCompletionService } from './services/flinkSQLCompletion';
import { testContext } from './config/testData';

// 创建 SQL 解析服务实例
const sqlParser = new SQLParserService();

// 创建补全服务实例
const completionService = new FlinkSQLCompletionService(testContext);

// 测试 SQL 语句
const testSQL = 'select id, name, sex from user1 where age > 18;';

// 格式化 SQL
const formattedSQL = formatSQL(testSQL);
console.log('格式化后的 SQL:', formattedSQL);

// 解析 SQL
const result = sqlParser.parse(formattedSQL);

if (result.success) {
    console.log('SQL AST:', JSON.stringify(result.ast, null, 2));
    
    // 将 AST 转换回 SQL
    const regeneratedSQL = sqlParser.stringify(result.ast);
    console.log('重新生成的 SQL:', regeneratedSQL);
} else {
    console.error('SQL 解析错误:', result.error);
}

// 测试场景 1: 空 SQL 语句的补全
console.log('测试场景 1: 空 SQL 语句的补全');
const emptyResult = completionService.getCompletionItems('', 0);
console.log('补全建议:', emptyResult.items.map(item => `${item.label} (${item.kind})`));

// 测试场景 2: SELECT 语句中的列名补全
console.log('\n测试场景 2: SELECT 语句中的列名补全');
const selectResult = completionService.getCompletionItems('SELECT ', 7);
console.log('补全建议:', selectResult.items.map(item => `${item.label} (${item.kind})`));

// 测试场景 3: FROM 子句中的表名补全
console.log('\n测试场景 3: FROM 子句中的表名补全');
const fromResult = completionService.getCompletionItems('SELECT * FROM ', 15);
console.log('补全建议:', fromResult.items.map(item => `${item.label} (${item.kind})`));


// 测试场景 4: WHERE 子句中的列名补全
console.log('\n测试场景 4: WHERE 子句中的列名补全');
const whereResult = completionService.getCompletionItems('SELECT * FROM users WHERE ', 25);
console.log('补全建议:', whereResult.items.map(item => `${item.label} (${item.kind})`));

// 测试场景 5: 复杂查询中的补全
console.log('\n测试场景 5: 复杂查询中的补全');
const complexSQL = `SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY `;
const complexResult = completionService.getCompletionItems(complexSQL, complexSQL.length);
console.log('补全建议:', complexResult.items.map(item => `${item.label} (${item.kind})`));

// 测试场景 6: 在 select 后的字段补全
console.log('\n测试场景 6: 在 select 后的字段补全');
const selectFromResult = completionService.getCompletionItems('select  from user', 7);
console.log('补全建议:', JSON.stringify(selectFromResult.items, null, 2));

// 如果将来有其他相关的类或函数，也可以在这里统一导出
// export { OtherClass } from './otherFile'; 