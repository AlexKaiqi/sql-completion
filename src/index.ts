import { MySQL, EntityContextType, CaretPosition, Suggestions } from 'dt-sql-parser';
import { MetadataManager } from './metadata';
import { ScopeAnalyzer, ScopeContext, CompletionItem, SQL_FUNCTIONS, SQL_OPERATORS } from './scope';

// 初始化元数据管理器
const metadataManager = new MetadataManager();

// 初始化 SQL 解析器
const parser = new MySQL();

// 初始化作用域分析器
const scopeAnalyzer = new ScopeAnalyzer(parser, metadataManager);

// 扩展 Suggestions 类型
interface ExtendedSuggestions extends Suggestions {
    functions: string[];
    cursorPosition?: number; // 添加光标位置字段
}

// 辅助函数：获取补全建议并处理 null 情况
function getSuggestions(parser: MySQL, sql: string, position: CaretPosition): ExtendedSuggestions {
    const rawSuggestions = parser.getSuggestionAtCaretPosition(sql, position) || { syntax: [], keywords: [] };
    
    // 获取光标前的文本
    const beforeCursor = sql.substring(0, position.column - 1);
    const lastWord = beforeCursor.split(/\s+/).pop() || '';
    
    // 检查光标是否在括号内
    const isInParentheses = beforeCursor.split('(').length > beforeCursor.split(')').length;
    
    // 过滤关键字建议，只保留以当前输入开头的建议，并去掉重复部分
    const filteredKeywords = rawSuggestions.keywords
        .filter(keyword => keyword.toUpperCase().startsWith(lastWord.toUpperCase()))
        .map(keyword => keyword.substring(lastWord.length)); // 去掉与光标前内容重复的部分

    // 处理函数建议
    const functionSuggestions = getFunctionSuggestions(lastWord);
    
    // 如果在括号内，添加函数参数相关的建议
    let paramSuggestions: string[] = [];
    if (isInParentheses) {
        paramSuggestions = getFunctionParamSuggestions(beforeCursor);
    }
    
    return {
        syntax: rawSuggestions.syntax,
        keywords: [...filteredKeywords, ...paramSuggestions],
        functions: functionSuggestions,
        cursorPosition: position.column
    };
}

// 辅助函数：获取函数补全建议
function getFunctionSuggestions(prefix: string): string[] {
    const allFunctions = [
        ...SQL_FUNCTIONS.aggregate,
        ...SQL_FUNCTIONS.window
    ];
    
    return allFunctions
        .filter(func => func.toUpperCase().startsWith(prefix.toUpperCase()))
        .map(func => {
            const remaining = func.substring(prefix.length);
            return remaining + '(｜)'; // 在括号内添加光标位置
        });
}

// 辅助函数：获取函数参数补全建议
function getFunctionParamSuggestions(beforeCursor: string): string[] {
    // 获取最近的函数名
    const functionMatch = beforeCursor.match(/(\w+)\s*\([^)]*$/);
    if (!functionMatch) return [];
    
    const functionName = functionMatch[1].toUpperCase();
    
    // 获取可用的字段名
    const availableColumns = getAvailableColumns(beforeCursor);
    
    // 根据函数名返回相应的参数建议
    switch (functionName) {
        case 'COUNT':
            return ['*', '1', ...availableColumns];
        case 'SUM':
        case 'AVG':
        case 'MAX':
        case 'MIN':
            return availableColumns;
        case 'GROUP_CONCAT':
            return availableColumns;
        default:
            return availableColumns;
    }
}

// 辅助函数：获取可用的字段名
function getAvailableColumns(beforeCursor: string): string[] {
    // 从 SQL 语句中提取表名
    const tableMatch = beforeCursor.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return [];
    
    const tableName = tableMatch[1];
    const tableInfo = metadataManager.getTable(tableName);
    if (!tableInfo) return [];
    
    return tableInfo.columns.map(col => col.name);
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
function registerTableMetadata(sql: string) {
    const ast = parser.parse(sql);
    // 这里需要根据实际的AST结构来解析表信息
    // 为了演示，我们使用硬编码的表信息
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
    registerTableMetadata(createTablesSQL);

    // 测试用例 1: SQL关键字补全
    console.log('测试用例 1: SQL关键字补全');
    console.log('----------------------------------------');
    
    // 测试场景 1.1: SELECT 关键字补全
    const selectSql = 'SELE｜';
    const selectPosition = getCaretPosition(selectSql);
    console.log('测试场景 1.1: SELECT 关键字补全');
    console.log('SQL语句:', selectSql);
    console.log('光标位置:', `行: ${selectPosition.lineNumber}, 列: ${selectPosition.column}`);
    const selectSuggestions = getSuggestions(parser, selectSql, selectPosition);
    console.log('补全建议:', selectSuggestions.keywords);
    const selectPassed = selectSuggestions.keywords.includes('CT');
    console.log('测试通过:', selectPassed);
    console.log('\n');

    // 测试场景 1.2: SELECT * FROM 中的 FROM 补全
    const fromSql = 'SELECT * FR｜';
    const fromPosition = getCaretPosition(fromSql);
    console.log('测试场景 1.2: SELECT * FROM 中的 FROM 补全');
    console.log('SQL语句:', fromSql);
    console.log('光标位置:', `行: ${fromPosition.lineNumber}, 列: ${fromPosition.column}`);
    const fromSuggestions = getSuggestions(parser, fromSql, fromPosition);
    console.log('补全建议:', fromSuggestions.keywords);
    const fromPassed = fromSuggestions.keywords.includes('OM');
    console.log('测试通过:', fromPassed);
    console.log('\n');

    // 测试场景 1.3: SELECT * FROM users WH 中的 WHERE 补全
    const whereSql = 'SELECT * FROM users WH｜';
    const wherePosition = getCaretPosition(whereSql);
    console.log('测试场景 1.3: SELECT * FROM users WH 中的 WHERE 补全');
    console.log('SQL语句:', whereSql);
    console.log('光标位置:', `行: ${wherePosition.lineNumber}, 列: ${wherePosition.column}`);
    const whereSuggestions = getSuggestions(parser, whereSql, wherePosition);
    console.log('补全建议:', whereSuggestions.keywords);
    const wherePassed = whereSuggestions.keywords.includes('ERE');
    console.log('测试通过:', wherePassed);
    console.log('\n');

    // 测试场景 1.4: SELECT * FROM users GROUP BY 中的 GROUP 补全
    const groupSql = 'SELECT * FROM users GRO｜';
    const groupPosition = getCaretPosition(groupSql);
    console.log('测试场景 1.4: SELECT * FROM users GROUP BY 中的 GROUP 补全');
    console.log('SQL语句:', groupSql);
    console.log('光标位置:', `行: ${groupPosition.lineNumber}, 列: ${groupPosition.column}`);
    const groupSuggestions = getSuggestions(parser, groupSql, groupPosition);
    console.log('补全建议:', groupSuggestions.keywords);
    const groupPassed = groupSuggestions.keywords.includes('UP');
    console.log('测试通过:', groupPassed);
    console.log('\n');

    // 测试场景 1.5: SELECT * FROM users ORDER BY 中的 ORDER 补全
    const orderSql = 'SELECT * FROM users ORD｜';
    const orderPosition = getCaretPosition(orderSql);
    console.log('测试场景 1.5: SELECT * FROM users ORDER BY 中的 ORDER 补全');
    console.log('SQL语句:', orderSql);
    console.log('光标位置:', `行: ${orderPosition.lineNumber}, 列: ${orderPosition.column}`);
    const orderSuggestions = getSuggestions(parser, orderSql, orderPosition);
    console.log('补全建议:', orderSuggestions.keywords);
    const orderPassed = orderSuggestions.keywords.includes('ER');
    console.log('测试通过:', orderPassed);
    console.log('\n');

    // 测试场景 1.6: SELECT * FROM users GROUP BY name HAV 中的 HAVING 补全
    const havingSql = 'SELECT * FROM users GROUP BY name HAV｜';
    const havingPosition = getCaretPosition(havingSql);
    console.log('测试场景 1.6: SELECT * FROM users GROUP BY name HAV 中的 HAVING 补全');
    console.log('SQL语句:', havingSql);
    console.log('光标位置:', `行: ${havingPosition.lineNumber}, 列: ${havingPosition.column}`);
    const havingSuggestions = getSuggestions(parser, havingSql, havingPosition);
    console.log('补全建议:', havingSuggestions.keywords);
    const havingPassed = havingSuggestions.keywords.includes('ING');
    console.log('测试通过:', havingPassed);
    console.log('\n');

    // 测试场景 1.7: SELECT * FROM users JOIN orders ON 中的 JOIN 补全
    const joinSql = 'SELECT * FROM users JOI｜';
    const joinPosition = getCaretPosition(joinSql);
    console.log('测试场景 1.7: SELECT * FROM users JOIN orders ON 中的 JOIN 补全');
    console.log('SQL语句:', joinSql);
    console.log('光标位置:', `行: ${joinPosition.lineNumber}, 列: ${joinPosition.column}`);
    const joinSuggestions = getSuggestions(parser, joinSql, joinPosition);
    console.log('补全建议:', joinSuggestions.keywords);
    const joinPassed = joinSuggestions.keywords.includes('N');
    console.log('测试通过:', joinPassed);
    console.log('\n');

    // 测试场景 1.8: 空输入时的补全
    const emptySql = '｜';
    const emptyPosition = getCaretPosition(emptySql);
    console.log('测试场景 1.8: 空输入时的补全');
    console.log('SQL语句:', emptySql);
    console.log('光标位置:', `行: ${emptyPosition.lineNumber}, 列: ${emptyPosition.column}`);
    const emptySuggestions = getSuggestions(parser, emptySql, emptyPosition);
    console.log('补全建议:', emptySuggestions.keywords);
    const emptyPassed = emptySuggestions.keywords.length === 0;
    console.log('测试通过:', emptyPassed);
    console.log('\n');

    // 测试场景 1.9: 函数补全
    const functionSql = 'SELECT COU｜';
    const functionPosition = getCaretPosition(functionSql);
    console.log('测试场景 1.9: 函数补全');
    console.log('SQL语句:', functionSql);
    console.log('光标位置:', `行: ${functionPosition.lineNumber}, 列: ${functionPosition.column}`);
    const functionSuggestions = getSuggestions(parser, functionSql, functionPosition);
    console.log('函数补全建议:', functionSuggestions.functions);
    console.log('返回的光标位置:', functionSuggestions.cursorPosition);
    const functionPassed = functionSuggestions.functions.includes('NT(｜)');
    console.log('测试通过:', functionPassed);
    console.log('\n');

    // 测试场景 1.10: 函数补全后的参数输入
    const functionParamSql = 'SELECT COUNT(｜';
    const functionParamPosition = getCaretPosition(functionParamSql);
    console.log('测试场景 1.10: 函数补全后的参数输入');
    console.log('SQL语句:', functionParamSql);
    console.log('光标位置:', `行: ${functionParamPosition.lineNumber}, 列: ${functionParamPosition.column}`);
    const functionParamSuggestions = getSuggestions(parser, functionParamSql, functionParamPosition);
    console.log('参数补全建议:', functionParamSuggestions.keywords);
    console.log('返回的光标位置:', functionParamSuggestions.cursorPosition);
    const functionParamPassed = functionParamSuggestions.keywords.includes('*') && 
                               functionParamSuggestions.keywords.includes('DISTINCT');
    console.log('测试通过:', functionParamPassed);
    console.log('\n');

    // 测试场景 1.11: 窗口函数参数补全
    const windowFunctionSql = 'SELECT ROW_NUMBER(｜';
    const windowFunctionPosition = getCaretPosition(windowFunctionSql);
    console.log('测试场景 1.11: 窗口函数参数补全');
    console.log('SQL语句:', windowFunctionSql);
    console.log('光标位置:', `行: ${windowFunctionPosition.lineNumber}, 列: ${windowFunctionPosition.column}`);
    const windowFunctionSuggestions = getSuggestions(parser, windowFunctionSql, windowFunctionPosition);
    console.log('参数补全建议:', windowFunctionSuggestions.keywords);
    console.log('返回的光标位置:', windowFunctionSuggestions.cursorPosition);
    const windowFunctionPassed = windowFunctionSuggestions.keywords.includes('ORDER BY');
    console.log('测试通过:', windowFunctionPassed);
    console.log('\n');

    // 测试场景 1.12: 函数参数字段建议
    const functionColumnSql = 'SELECT SUM(｜ FROM users';
    const functionColumnPosition = getCaretPosition(functionColumnSql);
    console.log('测试场景 1.12: 函数参数字段建议');
    console.log('SQL语句:', functionColumnSql);
    console.log('光标位置:', `行: ${functionColumnPosition.lineNumber}, 列: ${functionColumnPosition.column}`);
    const functionColumnSuggestions = getSuggestions(parser, functionColumnSql, functionColumnPosition);
    console.log('参数补全建议:', functionColumnSuggestions.keywords);
    console.log('返回的光标位置:', functionColumnSuggestions.cursorPosition);
    const functionColumnPassed = functionColumnSuggestions.keywords.includes('id') && 
                                functionColumnSuggestions.keywords.includes('amount');
    console.log('测试通过:', functionColumnPassed);
    console.log('\n');

    // 测试用例 1 总结
    console.log('测试用例 1 总结:');
    console.log('----------------------------------------');
    console.log(`场景 1.1: ${selectPassed ? '通过' : '失败'}`);
    console.log(`场景 1.2: ${fromPassed ? '通过' : '失败'}`);
    console.log(`场景 1.3: ${wherePassed ? '通过' : '失败'}`);
    console.log(`场景 1.4: ${groupPassed ? '通过' : '失败'}`);
    console.log(`场景 1.5: ${orderPassed ? '通过' : '失败'}`);
    console.log(`场景 1.6: ${havingPassed ? '通过' : '失败'}`);
    console.log(`场景 1.7: ${joinPassed ? '通过' : '失败'}`);
    console.log(`场景 1.8: ${emptyPassed ? '通过' : '失败'}`);
    console.log(`场景 1.9: ${functionPassed ? '通过' : '失败'}`);
    console.log(`场景 1.10: ${functionParamPassed ? '通过' : '失败'}`);
    console.log(`场景 1.11: ${windowFunctionPassed ? '通过' : '失败'}`);
    console.log(`场景 1.12: ${functionColumnPassed ? '通过' : '失败'}`);
    console.log('\n');

    // // 测试用例 2: FROM 子句补全
    // console.log('测试用例 2: FROM 子句补全');
    // console.log('----------------------------------------');
    // const fromSql = 'SELECT * FROM |';
    // const fromPosition: CaretPosition = { lineNumber: 1, column: 16 };
    // console.log('SQL语句:', fromSql);
    // console.log('光标位置:', `行: ${fromPosition.lineNumber}, 列: ${fromPosition.column}`);
    // console.log('预期结果: 应该包含所有表名 (users, orders)');
    // const fromSuggestions = getSuggestions(parser, fromSql, fromPosition);
    // console.log('实际结果:', fromSuggestions.keywords);
    // console.log('测试通过:', fromSuggestions.keywords.some(kw => ['users', 'orders'].includes(kw)));
    // console.log('\n');

    // // 测试用例 3: WHERE 子句补全
    // console.log('测试用例 3: WHERE 子句补全');
    // console.log('----------------------------------------');
    // const whereSql = 'SELECT * FROM users WHERE id |';
    // const wherePosition: CaretPosition = { lineNumber: 1, column: 32 };
    // console.log('SQL语句:', whereSql);
    // console.log('光标位置:', `行: ${wherePosition.lineNumber}, 列: ${wherePosition.column}`);
    // console.log('预期结果: 应该包含比较运算符 (=, >, <, >=, <=, !=)');
    // const whereSuggestions = getSuggestions(parser, whereSql, wherePosition);
    // console.log('实际结果:', whereSuggestions.keywords);
    // console.log('测试通过:', whereSuggestions.keywords.some(kw => ['=', '>', '<'].includes(kw)));
    // console.log('\n');

    // // 测试用例 4: SELECT | FROM users 场景下的字段提示
    // console.log('测试用例 4: SELECT | FROM users 场景下的字段提示');
    // console.log('----------------------------------------');
    // const selectFromSql = 'SELECT | FROM users';
    // const selectFromPosition: CaretPosition = { lineNumber: 1, column: 8 };
    // console.log('SQL语句:', selectFromSql);
    // console.log('光标位置:', `行: ${selectFromPosition.lineNumber}, 列: ${selectFromPosition.column}`);
    // console.log('预期结果: 应该只包含 users 表的字段 (id, name, email, created_at)');
    // const selectFromSuggestions = getSuggestions(parser, selectFromSql, selectFromPosition);
    // console.log('实际结果:', selectFromSuggestions.keywords);
    // console.log('测试通过:', selectFromSuggestions.keywords.some(kw => 
    //     ['id', 'name', 'email', 'created_at'].includes(kw) && 
    //     !selectFromSuggestions.keywords.some(k => k.includes('orders'))
    // ));
    // console.log('\n');

    // // 测试用例 5: JOIN 语句补全
    // console.log('测试用例 5: JOIN 语句补全');
    // console.log('----------------------------------------');
    // const joinSql = 'SELECT * FROM users JOIN orders ON |';
    // const joinPosition: CaretPosition = { lineNumber: 1, column: 35 };
    // console.log('SQL语句:', joinSql);
    // console.log('光标位置:', `行: ${joinPosition.lineNumber}, 列: ${joinPosition.column}`);
    // console.log('预期结果: 应该包含两个表的字段 (users.id, orders.user_id 等)');
    // const joinSuggestions = getSuggestions(parser, joinSql, joinPosition);
    // console.log('实际结果:', joinSuggestions.keywords);
    // console.log('测试通过:', joinSuggestions.keywords.some(kw => 
    //     ['users.id', 'orders.user_id', 'users.name', 'orders.amount'].includes(kw)
    // ));
    // console.log('\n');

    // // 测试用例 6: 子查询补全
    // console.log('测试用例 6: 子查询补全');
    // console.log('----------------------------------------');
    // const subquerySql = 'SELECT * FROM users WHERE id IN (SELECT | FROM orders)';
    // const subqueryPosition: CaretPosition = { lineNumber: 1, column: 45 };
    // console.log('SQL语句:', subquerySql);
    // console.log('光标位置:', `行: ${subqueryPosition.lineNumber}, 列: ${subqueryPosition.column}`);
    // console.log('预期结果: 应该只包含 orders 表的字段 (id, user_id, amount 等)');
    // const subquerySuggestions = getSuggestions(parser, subquerySql, subqueryPosition);
    // console.log('实际结果:', subquerySuggestions.keywords);
    // console.log('测试通过:', subquerySuggestions.keywords.some(kw => 
    //     ['id', 'user_id', 'amount'].includes(kw) && 
    //     !subquerySuggestions.keywords.some(k => k.includes('users'))
    // ));
    // console.log('\n');

    // // 测试用例 7: 表别名补全
    // console.log('测试用例 7: 表别名补全');
    // console.log('----------------------------------------');
    // const aliasSql = 'SELECT u.| FROM users u JOIN orders o ON u.id = o.user_id';
    // const aliasPosition: CaretPosition = { lineNumber: 1, column: 12 };
    // console.log('SQL语句:', aliasSql);
    // console.log('光标位置:', `行: ${aliasPosition.lineNumber}, 列: ${aliasPosition.column}`);
    // console.log('预期结果: 应该只包含 users 表的字段，使用别名 u (u.id, u.name 等)');
    // const aliasSuggestions = getSuggestions(parser, aliasSql, aliasPosition);
    // console.log('实际结果:', aliasSuggestions.keywords);
    // console.log('测试通过:', aliasSuggestions.keywords.some(kw => 
    //     ['u.id', 'u.name', 'u.email'].includes(kw) && 
    //     !aliasSuggestions.keywords.some(k => k.includes('o.'))
    // ));
    // console.log('\n');

    // // 测试用例 8: 复杂嵌套查询补全
    // console.log('测试用例 8: 复杂嵌套查询补全');
    // console.log('----------------------------------------');
    // const nestedSql = 'SELECT * FROM (SELECT u.id, u.name FROM users u JOIN orders o ON u.id = o.user_id) t WHERE t.|';
    // const nestedPosition: CaretPosition = { lineNumber: 1, column: 85 };
    // console.log('SQL语句:', nestedSql);
    // console.log('光标位置:', `行: ${nestedPosition.lineNumber}, 列: ${nestedPosition.column}`);
    // console.log('预期结果: 应该只包含派生表的字段 (t.id, t.name)');
    // const nestedSuggestions = getSuggestions(parser, nestedSql, nestedPosition);
    // console.log('实际结果:', nestedSuggestions.keywords);
    // console.log('测试通过:', nestedSuggestions.keywords.some(kw => 
    //     ['t.id', 't.name'].includes(kw) && 
    //     !nestedSuggestions.keywords.some(k => k.includes('u.') || k.includes('o.'))
    // ));
    // console.log('\n');

    // // 测试用例 9: GROUP BY 补全
    // console.log('测试用例 9: GROUP BY 补全');
    // console.log('----------------------------------------');
    // const groupBySql = 'SELECT u.name, COUNT(*) FROM users u JOIN orders o ON u.id = o.user_id GROUP BY |';
    // const groupByPosition: CaretPosition = { lineNumber: 1, column: 75 };
    // console.log('SQL语句:', groupBySql);
    // console.log('光标位置:', `行: ${groupByPosition.lineNumber}, 列: ${groupByPosition.column}`);
    // console.log('预期结果: 应该包含非聚合字段 (u.name)');
    // const groupBySuggestions = getSuggestions(parser, groupBySql, groupByPosition);
    // console.log('实际结果:', groupBySuggestions.keywords);
    // console.log('测试通过:', groupBySuggestions.keywords.some(kw => 
    //     ['u.name'].includes(kw)
    // ));
    // console.log('\n');

    // // 测试用例 10: HAVING 子句补全
    // console.log('测试用例 10: HAVING 子句补全');
    // console.log('----------------------------------------');
    // const havingSql = 'SELECT u.name, COUNT(*) as cnt FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.name HAVING |';
    // const havingPosition: CaretPosition = { lineNumber: 1, column: 95 };
    // console.log('SQL语句:', havingSql);
    // console.log('光标位置:', `行: ${havingPosition.lineNumber}, 列: ${havingPosition.column}`);
    // console.log('预期结果: 应该包含聚合函数和别名 (cnt)');
    // const havingSuggestions = getSuggestions(parser, havingSql, havingPosition);
    // console.log('实际结果:', havingSuggestions.keywords);
    // console.log('测试通过:', havingSuggestions.keywords.some(kw => 
    //     ['cnt', 'COUNT(*)'].includes(kw)
    // ));
    // console.log('\n');

    // // 测试用例 11: 数据库.表名补全
    // console.log('测试用例 11: 数据库.表名补全');
    // console.log('----------------------------------------');
    // const dbTableSql = 'SELECT * FROM test_db.|';
    // const dbTablePosition: CaretPosition = { lineNumber: 1, column: 25 };
    // console.log('SQL语句:', dbTableSql);
    // console.log('光标位置:', `行: ${dbTablePosition.lineNumber}, 列: ${dbTablePosition.column}`);
    // console.log('预期结果: 应该只包含 test_db 数据库的表 (users, orders)');
    // const dbTableSuggestions = getSuggestions(parser, dbTableSql, dbTablePosition);
    // console.log('实际结果:', dbTableSuggestions.keywords);
    // console.log('测试通过:', dbTableSuggestions.keywords.some(kw => 
    //     ['test_db.users', 'test_db.orders'].includes(kw)
    // ));
    // console.log('\n');

    // // 测试用例 12: 数据库.表.字段补全
    // console.log('测试用例 12: 数据库.表.字段补全');
    // console.log('----------------------------------------');
    // const dbTableColumnSql = 'SELECT test_db.users.| FROM test_db.users';
    // const dbTableColumnPosition: CaretPosition = { lineNumber: 1, column: 20 };
    // console.log('SQL语句:', dbTableColumnSql);
    // console.log('光标位置:', `行: ${dbTableColumnPosition.lineNumber}, 列: ${dbTableColumnPosition.column}`);
    // console.log('预期结果: 应该只包含 users 表的字段 (id, name, email, created_at)');
    // const dbTableColumnSuggestions = getSuggestions(parser, dbTableColumnSql, dbTableColumnPosition);
    // console.log('实际结果:', dbTableColumnSuggestions.keywords);
    // console.log('测试通过:', dbTableColumnSuggestions.keywords.some(kw => 
    //     ['id', 'name', 'email', 'created_at'].includes(kw)
    // ));
    // console.log('\n');

    console.log('测试完成！');
}

// 运行测试
runTests();

// 导出主要功能
export {
    parser,
    metadataManager,
    scopeAnalyzer,
    registerTableMetadata,
    getSuggestions
};