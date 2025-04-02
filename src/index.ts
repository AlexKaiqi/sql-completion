import { MySQL, EntityContextType, CaretPosition } from 'dt-sql-parser';
import { MetadataManager } from './metadata';
import { ScopeAnalyzer } from './scope';
import { getSuggestions } from './suggestions';

// 初始化元数据管理器
const metadataManager = new MetadataManager();

// 初始化 SQL 解析器
const parser = new MySQL();

// 注册测试用的表结构
registerTestTableMetadata();

// 定义表结构接口
interface TableColumn {
    name: string;
    type: string;
}

interface Table {
    name: string;
    database: string;
    columns: TableColumn[];
}

// 定义视图结构接口
interface View {
    name: string;
    database: string;
    columns: TableColumn[];
}

// 辅助函数：从SQL语句中获取光标位置
function getCaretPosition(sql: string): CaretPosition {
    const lines = sql.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const column = lines[i].indexOf('｜');
        if (column !== -1) {
            return {
                lineNumber: i + 1,
                column: column + 1
            };
        }
    }
    throw new Error('SQL语句中未找到光标位置标记(｜)');
}

// 解析CREATE TABLE语句并注册元数据
function registerTestTableMetadata() {
    // 注册测试用的表结构
    metadataManager.addTable({
        name: 'users',
        database: 'test_db',
        columns: [
            { name: 'id', type: 'INT' },
            { name: 'name', type: 'VARCHAR(255)' },
            { name: 'email', type: 'VARCHAR(255)' },
            { name: 'created_at', type: 'TIMESTAMP' }
        ]
    });

    metadataManager.addTable({
        name: 'orders',
        database: 'test_db',
        columns: [
            { name: 'id', type: 'INT' },
            { name: 'user_id', type: 'INT' },
            { name: 'amount', type: 'DECIMAL(10,2)' },
            { name: 'status', type: 'VARCHAR(50)' },
            { name: 'created_at', type: 'TIMESTAMP' }
        ]
    });

    // 注册视图
    metadataManager.addView({
        name: 'user_orders',
        database: 'test_db',
        columns: [
            { name: 'user_id', type: 'INT' },
            { name: 'user_name', type: 'VARCHAR(255)' },
            { name: 'order_count', type: 'INT' },
            { name: 'total_amount', type: 'DECIMAL(10,2)' }
        ],
        isView: true
    });
}

// 运行测试
function runTests() {
    console.log('开始运行测试...\n');

    // 注册测试用的表结构
    const createTablesSQL = `
    CREATE TABLE users (
        id INT,
        name VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP
    );

    CREATE TABLE orders (
        id INT,
        user_id INT,
        amount DECIMAL(10,2),
        status VARCHAR(50),
        created_at TIMESTAMP
    );
    `;
    registerTestTableMetadata();

    // 重新初始化作用域分析器
    const scopeAnalyzer = new ScopeAnalyzer(parser, metadataManager);
    debugger; // 调试点1：检查 scopeAnalyzer 初始化

    // 测试用例 1: SQL关键字补全
    // {
    //     console.log('测试用例 1: SQL关键字补全');
    //     console.log('----------------------------------------');

    //     // 测试场景 1.1: SELECT 关键字补全
    //     const selectSql = 'SELE｜';
    //     const selectPosition = getCaretPosition(selectSql);
    //     debugger; // 调试点2：检查 selectPosition
    //     console.log('测试场景 1.1: SELECT 关键字补全');
    //     console.log('SQL语句:', selectSql);
    //     console.log('光标位置:', `行: ${selectPosition.lineNumber}, 列: ${selectPosition.column}`);
    //     const selectSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, selectSql, selectPosition);
    //     debugger; // 调试点3：检查 selectSuggestions
    //     console.log('补全建议:', selectSuggestions.suggestions.map(s => s.value));
    //     const selectPassed = selectSuggestions.suggestions.some(s => s.value === 'CT');
    //     console.log('测试通过:', selectPassed);
    //     console.log('\n');

    //     // 测试场景 1.2: SELECT * FROM 中的 FROM 补全
    //     const fromSql = 'SELECT * FR｜';
    //     const fromPosition = getCaretPosition(fromSql);
    //     console.log('测试场景 1.2: SELECT * FROM 中的 FROM 补全');
    //     console.log('SQL语句:', fromSql);
    //     console.log('光标位置:', `行: ${fromPosition.lineNumber}, 列: ${fromPosition.column}`);
    //     const fromSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, fromSql, fromPosition);
    //     console.log('补全建议:', fromSuggestions.suggestions.map(s => s.value));
    //     const fromPassed = fromSuggestions.suggestions.some(s => s.value === 'OM');
    //     console.log('测试通过:', fromPassed);
    //     console.log('\n');

    //     // 测试场景 1.3: SELECT * FROM users WH 中的 WHERE 补全
    //     const whereSql = 'SELECT * FROM users WH｜';
    //     const wherePosition = getCaretPosition(whereSql);
    //     console.log('测试场景 1.3: SELECT * FROM users WH 中的 WHERE 补全');
    //     console.log('SQL语句:', whereSql);
    //     console.log('光标位置:', `行: ${wherePosition.lineNumber}, 列: ${wherePosition.column}`);
    //     const whereSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, whereSql, wherePosition);
    //     console.log('补全建议:', whereSuggestions.suggestions.map(s => s.value));
    //     const wherePassed = whereSuggestions.suggestions.some(s => s.value === 'ERE');
    //     console.log('测试通过:', wherePassed);
    //     console.log('\n');

    //     // 测试场景 1.4: SELECT * FROM users GROUP BY 中的 GROUP 补全
    //     const groupSql = 'SELECT * FROM users GRO｜';
    //     const groupPosition = getCaretPosition(groupSql);
    //     console.log('测试场景 1.4: SELECT * FROM users GROUP BY 中的 GROUP 补全');
    //     console.log('SQL语句:', groupSql);
    //     console.log('光标位置:', `行: ${groupPosition.lineNumber}, 列: ${groupPosition.column}`);
    //     const groupSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, groupSql, groupPosition);
    //     console.log('补全建议:', groupSuggestions.suggestions.map(s => s.value));
    //     const groupPassed = groupSuggestions.suggestions.some(s => s.value === 'UP');
    //     console.log('测试通过:', groupPassed);
    //     console.log('\n');

    //     // 测试场景 1.5: SELECT * FROM users ORDER BY 中的 ORDER 补全
    //     const orderSql = 'SELECT * FROM users ORD｜';
    //     const orderPosition = getCaretPosition(orderSql);
    //     console.log('测试场景 1.5: SELECT * FROM users ORDER BY 中的 ORDER 补全');
    //     console.log('SQL语句:', orderSql);
    //     console.log('光标位置:', `行: ${orderPosition.lineNumber}, 列: ${orderPosition.column}`);
    //     const orderSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, orderSql, orderPosition);
    //     console.log('补全建议:', orderSuggestions.suggestions.map(s => s.value));
    //     const orderPassed = orderSuggestions.suggestions.some(s => s.value === 'ER');
    //     console.log('测试通过:', orderPassed);
    //     console.log('\n');

    //     // 测试场景 1.6: SELECT * FROM users GROUP BY name HAV 中的 HAVING 补全
    //     const havingSql = 'SELECT * FROM users GROUP BY name HAV｜';
    //     const havingPosition = getCaretPosition(havingSql);
    //     console.log('测试场景 1.6: SELECT * FROM users GROUP BY name HAV 中的 HAVING 补全');
    //     console.log('SQL语句:', havingSql);
    //     console.log('光标位置:', `行: ${havingPosition.lineNumber}, 列: ${havingPosition.column}`);
    //     const havingSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, havingSql, havingPosition);
    //     console.log('补全建议:', havingSuggestions.suggestions.map(s => s.value));
    //     const havingPassed = havingSuggestions.suggestions.some(s => s.value === 'ING');
    //     console.log('测试通过:', havingPassed);
    //     console.log('\n');

    //     // 测试场景 1.7: SELECT * FROM users JOIN orders ON 中的 JOIN 补全
    //     const joinSql = 'SELECT * FROM users JOI｜';
    //     const joinPosition = getCaretPosition(joinSql);
    //     console.log('测试场景 1.7: SELECT * FROM users JOIN orders ON 中的 JOIN 补全');
    //     console.log('SQL语句:', joinSql);
    //     console.log('光标位置:', `行: ${joinPosition.lineNumber}, 列: ${joinPosition.column}`);
    //     const joinSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, joinSql, joinPosition);
    //     console.log('补全建议:', joinSuggestions.suggestions.map(s => s.value));
    //     const joinPassed = joinSuggestions.suggestions.some(s => s.value === 'N');
    //     console.log('测试通过:', joinPassed);
    //     console.log('\n');

    //     // 测试场景 1.8: 空输入时的补全
    //     const emptySql = '｜';
    //     const emptyPosition = getCaretPosition(emptySql);
    //     console.log('测试场景 1.8: 空输入时的补全');
    //     console.log('SQL语句:', emptySql);
    //     console.log('光标位置:', `行: ${emptyPosition.lineNumber}, 列: ${emptyPosition.column}`);
    //     const emptySuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, emptySql, emptyPosition);
    //     console.log('补全建议:', emptySuggestions.suggestions.map(s => s.value));
    //     const emptyPassed = emptySuggestions.suggestions.length === 0;
    //     console.log('测试通过:', emptyPassed);
    //     console.log('\n');

    //     // 测试用例 1 总结
    //     console.log('测试用例 1 总结:');
    //     console.log('----------------------------------------');
    //     console.log(`场景 1.1: ${selectPassed ? '通过' : '失败'}`);
    //     console.log(`场景 1.2: ${fromPassed ? '通过' : '失败'}`);
    //     console.log(`场景 1.3: ${wherePassed ? '通过' : '失败'}`);
    //     console.log(`场景 1.4: ${groupPassed ? '通过' : '失败'}`);
    //     console.log(`场景 1.5: ${orderPassed ? '通过' : '失败'}`);
    //     console.log(`场景 1.6: ${havingPassed ? '通过' : '失败'}`);
    //     console.log(`场景 1.7: ${joinPassed ? '通过' : '失败'}`);
    //     console.log(`场景 1.8: ${emptyPassed ? '通过' : '失败'}`);
    //     console.log('\n');
    // }
    // 元数据补全：库、表、视图、字段、函数
    {
        console.log('测试用例 2: 元数据补全');
        console.log('----------------------------------------');

        // 测试场景 2.1: 数据库名补全
        const databaseSql = 'USE test_｜';
        const databasePosition = getCaretPosition(databaseSql);
        console.log('测试场景 2.1: 数据库名补全');
        console.log('SQL语句:', databaseSql);
        console.log('光标位置:', `行: ${databasePosition.lineNumber}, 列: ${databasePosition.column}`);
        const databaseSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, databaseSql, databasePosition);
        console.log('数据库补全建议:', databaseSuggestions.suggestions.filter(s => s.type === 'database').map(s => s.value));
        const databasePassed = databaseSuggestions.suggestions.some(s => s.value === 'db');
        console.log('测试通过:', databasePassed);
        console.log('\n');

        // 测试场景 2.2: 表名补全
        const tableSql = 'SELECT * FROM use｜';
        const tablePosition = getCaretPosition(tableSql);
        console.log('测试场景 2.2: 表名补全');
        console.log('SQL语句:', tableSql);
        console.log('光标位置:', `行: ${tablePosition.lineNumber}, 列: ${tablePosition.column}`);
        const tableSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, tableSql, tablePosition);
        console.log('表名补全建议:', tableSuggestions.suggestions.filter(s => s.type === 'table').map(s => s.value));
        const tablePassed = tableSuggestions.suggestions.some(s => s.value === 'rs');
        console.log('测试通过:', tablePassed);
        console.log('\n');

        // 测试场景 2.3: 视图名补全
        const viewSql = 'SELECT * FROM user_o｜';
        const viewPosition = getCaretPosition(viewSql);
        console.log('测试场景 2.3: 视图名补全');
        console.log('SQL语句:', viewSql);
        console.log('光标位置:', `行: ${viewPosition.lineNumber}, 列: ${viewPosition.column}`);
        const viewSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, viewSql, viewPosition);
        console.log('视图补全建议:', viewSuggestions.suggestions.filter(s => s.type === 'view').map(s => s.value));
        const viewPassed = viewSuggestions.suggestions.some(s => s.value === 'rders');
        console.log('测试通过:', viewPassed);
        console.log('\n');

        // 测试场景 2.4: 字段名补全
        const columnSql = 'SELECT na｜ FROM users';
        const columnPosition = getCaretPosition(columnSql);
        console.log('测试场景 2.4: 字段名补全');
        console.log('SQL语句:', columnSql);
        console.log('光标位置:', `行: ${columnPosition.lineNumber}, 列: ${columnPosition.column}`);
        const columnSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, columnSql, columnPosition);
        console.log('字段补全建议:', columnSuggestions.suggestions.filter(s => s.type === 'column').map(s => s.value));
        const columnPassed = columnSuggestions.suggestions.some(s => s.value === 'me');
        console.log('测试通过:', columnPassed);
        console.log('\n');

        // 测试场景 2.5: 表别名补全
        const aliasSql = 'SELECT u.na｜ FROM users u';
        const aliasPosition = getCaretPosition(aliasSql);
        console.log('测试场景 2.5: 表别名补全');
        console.log('SQL语句:', aliasSql);
        console.log('光标位置:', `行: ${aliasPosition.lineNumber}, 列: ${aliasPosition.column}`);
        const aliasSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, aliasSql, aliasPosition);
        console.log('别名补全建议:', aliasSuggestions.suggestions.filter(s => s.type === 'alias').map(s => s.value));
        const aliasPassed = aliasSuggestions.suggestions.some(s => s.value === 'me');
        console.log('测试通过:', aliasPassed);
        console.log('\n');

        // 测试用例 2 总结
        console.log('测试用例 2 总结:');
        console.log('----------------------------------------');
        console.log(`场景 2.1: ${databasePassed ? '通过' : '失败'}`);
        console.log(`场景 2.2: ${tablePassed ? '通过' : '失败'}`);
        console.log(`场景 2.3: ${viewPassed ? '通过' : '失败'}`);
        console.log(`场景 2.4: ${columnPassed ? '通过' : '失败'}`);
        console.log(`场景 2.5: ${aliasPassed ? '通过' : '失败'}`);
        console.log('\n');
    }

    //测试用例 4: 带上下文的补全
    {
        console.log('测试用例 4: 带上下文的补全');
        console.log('----------------------------------------');

        // 测试场景，推荐特定表字段
        const recommendColumnSql = 'SELECT ｜ FROM users';
        const recommendColumnPosition = getCaretPosition(recommendColumnSql);
        console.log('测试场景 4.1: 基于表别名的字段补全');
        console.log('SQL语句:', recommendColumnSql);
        console.log('光标位置:', `行: ${recommendColumnPosition.lineNumber}, 列: ${recommendColumnPosition.column}`); 
        const recommendColumnSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, recommendColumnSql, recommendColumnPosition);
        console.log('可访问的字段建议:', recommendColumnSuggestions.suggestions.filter(s => s.type === 'column').map(s => s.value));
        const recommendColumnPassed = recommendColumnSuggestions.suggestions.some(s => s.value === 'name');
        //不包含orders的字段
        const recommendColumnPassed2 = recommendColumnSuggestions.suggestions.every(s => s.value !== 'amount');
        console.log('测试通过:', recommendColumnPassed);
        console.log('\n');

        // 测试场景 4.1: 基于表别名的字段补全
        const aliasColumnContextSql = 'SELECT u.na｜ FROM users u';
        const aliasColumnContextPosition = getCaretPosition(aliasColumnContextSql);
        console.log('测试场景 4.1: 基于表别名的字段补全');
        console.log('SQL语句:', aliasColumnContextSql);
        console.log('光标位置:', `行: ${aliasColumnContextPosition.lineNumber}, 列: ${aliasColumnContextPosition.column}`);
        const aliasColumnContextSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, aliasColumnContextSql, aliasColumnContextPosition);
        console.log('可访问的字段建议:', aliasColumnContextSuggestions.suggestions.filter(s => s.type === 'column').map(s => s.value));
        const aliasColumnContextPassed = aliasColumnContextSuggestions.suggestions.some(s => s.value === 'me');
        console.log('测试通过:', aliasColumnContextPassed);
        console.log('\n');

        // 测试场景 4.2: 基于 JOIN 的字段补全
        const joinColumnContextSql = 'SELECT u.name, o.am｜ FROM users u JOIN orders o ON u.id = o.user_id';
        const joinColumnContextPosition = getCaretPosition(joinColumnContextSql);
        console.log('测试场景 4.2: 基于 JOIN 的字段补全');
        console.log('SQL语句:', joinColumnContextSql);
        console.log('光标位置:', `行: ${joinColumnContextPosition.lineNumber}, 列: ${joinColumnContextPosition.column}`);
        const joinColumnContextSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, joinColumnContextSql, joinColumnContextPosition);
        console.log('可访问的字段建议:', joinColumnContextSuggestions.suggestions.filter(s => s.type === 'column').map(s => s.value));
        const joinColumnContextPassed = joinColumnContextSuggestions.suggestions.some(s => s.value === 'ount');
        console.log('测试通过:', joinColumnContextPassed);
        console.log('\n');

        // 测试场景 4.3: HAVING 子句中的字段补全
        const havingColumnContextSql = 'SELECT COUNT(*) as count FROM users GROUP BY name HAVING co｜';
        const havingColumnContextPosition = getCaretPosition(havingColumnContextSql);
        console.log('测试场景 4.3: HAVING 子句中的字段补全');
        console.log('SQL语句:', havingColumnContextSql);
        console.log('光标位置:', `行: ${havingColumnContextPosition.lineNumber}, 列: ${havingColumnContextPosition.column}`);
        const havingColumnContextSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, havingColumnContextSql, havingColumnContextPosition);
        console.log('可访问的字段建议:', havingColumnContextSuggestions.suggestions.filter(s => s.type === 'column').map(s => s.value));
        const havingColumnContextPassed = havingColumnContextSuggestions.suggestions.some(s => s.value === 'unt');
        console.log('测试通过:', havingColumnContextPassed);
        console.log('\n');

        // 测试场景 4.4: 子查询中的字段补全
        const subqueryColumnContextSql = 'SELECT * FROM (SELECT id, name FROM users WHERE na｜) AS sub';
        const subqueryColumnContextPosition = getCaretPosition(subqueryColumnContextSql);
        console.log('测试场景 4.4: 子查询中的字段补全');
        console.log('SQL语句:', subqueryColumnContextSql);
        console.log('光标位置:', `行: ${subqueryColumnContextPosition.lineNumber}, 列: ${subqueryColumnContextPosition.column}`);
        const subqueryColumnContextSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, subqueryColumnContextSql, subqueryColumnContextPosition);
        console.log('可访问的字段建议:', subqueryColumnContextSuggestions.suggestions.filter(s => s.type === 'column').map(s => s.value));
        const subqueryColumnContextPassed = subqueryColumnContextSuggestions.suggestions.some(s => s.value === 'me');
        console.log('测试通过:', subqueryColumnContextPassed);
        console.log('\n');

        // 测试场景 4.5: 子查询中的表补全
        const subqueryContextSql = 'SELECT * FROM (SELECT * FROM use｜) AS sub';
        const subqueryContextPosition = getCaretPosition(subqueryContextSql);
        console.log('测试场景 4.5: 子查询中的表补全');
        console.log('SQL语句:', subqueryContextSql);
        console.log('光标位置:', `行: ${subqueryContextPosition.lineNumber}, 列: ${subqueryContextPosition.column}`);
        const subqueryContextSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, subqueryContextSql, subqueryContextPosition);
        console.log('可访问的表建议:', subqueryContextSuggestions.suggestions.filter(s => s.type === 'table').map(s => s.value));
        const subqueryContextPassed = subqueryContextSuggestions.suggestions.some(s => s.value === 'rs');
        console.log('测试通过:', subqueryContextPassed);
        console.log('\n');

        // 测试场景 4.6: 多表 JOIN 中的字段补全
        const multiJoinContextSql = 'SELECT u.name, o.amount, p.prod｜ FROM users u JOIN orders o ON u.id = o.user_id JOIN products p ON o.product_id = p.id';
        const multiJoinContextPosition = getCaretPosition(multiJoinContextSql);
        console.log('测试场景 4.6: 多表 JOIN 中的字段补全');
        console.log('SQL语句:', multiJoinContextSql);
        console.log('光标位置:', `行: ${multiJoinContextPosition.lineNumber}, 列: ${multiJoinContextPosition.column}`);
        const multiJoinContextSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, multiJoinContextSql, multiJoinContextPosition);
        console.log('可访问的字段建议:', multiJoinContextSuggestions.suggestions.filter(s => s.type === 'column').map(s => s.value));
        const multiJoinContextPassed = multiJoinContextSuggestions.suggestions.some(s => s.value === 'uct_name');
        console.log('测试通过:', multiJoinContextPassed);
        console.log('\n');

        // 测试场景 4.7: 子查询中的聚合函数字段补全
        const subqueryAggregateContextSql = 'SELECT * FROM (SELECT COUNT(*) as count, SUM(amount) as total FROM orders GROUP BY user_id HAVING co｜) AS sub';
        const subqueryAggregateContextPosition = getCaretPosition(subqueryAggregateContextSql);
        console.log('测试场景 4.7: 子查询中的聚合函数字段补全');
        console.log('SQL语句:', subqueryAggregateContextSql);
        console.log('光标位置:', `行: ${subqueryAggregateContextPosition.lineNumber}, 列: ${subqueryAggregateContextPosition.column}`);
        const subqueryAggregateContextSuggestions = getSuggestions(parser, metadataManager, scopeAnalyzer, subqueryAggregateContextSql, subqueryAggregateContextPosition);
        console.log('可访问的字段建议:', subqueryAggregateContextSuggestions.suggestions.filter(s => s.type === 'column').map(s => s.value));
        const subqueryAggregateContextPassed = subqueryAggregateContextSuggestions.suggestions.some(s => s.value === 'unt');
        console.log('测试通过:', subqueryAggregateContextPassed);
        console.log('\n');

        // 测试用例 4 总结
        console.log('测试用例 4 总结:');
        console.log('----------------------------------------');
        console.log(`场景 4.1: ${aliasColumnContextPassed ? '通过' : '失败'}`);
        console.log(`场景 4.2: ${joinColumnContextPassed ? '通过' : '失败'}`);
        console.log(`场景 4.3: ${havingColumnContextPassed ? '通过' : '失败'}`);
        console.log(`场景 4.4: ${subqueryColumnContextPassed ? '通过' : '失败'}`);
        console.log(`场景 4.5: ${subqueryContextPassed ? '通过' : '失败'}`);
        console.log(`场景 4.6: ${multiJoinContextPassed ? '通过' : '失败'}`);
        console.log(`场景 4.7: ${subqueryAggregateContextPassed ? '通过' : '失败'}`);
        console.log('\n');
    }

    console.log('测试完成！');
}

// 运行测试
runTests();

// 导出主要功能
export {
    parser,
    metadataManager,
    registerTestTableMetadata,
    getSuggestions
};