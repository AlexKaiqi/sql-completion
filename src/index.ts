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
    cursorPosition?: number; // 添加光标位置字段
}

// 辅助函数：获取补全建议并处理 null 情况
function getSuggestions(parser: MySQL, sql: string, position: CaretPosition): ExtendedSuggestions {
    const rawSuggestions = parser.getSuggestionAtCaretPosition(sql, position) || { syntax: [], keywords: [] };
    
    // 获取光标前的文本
    const beforeCursor = sql.substring(0, position.column - 1);
    const lastWord = beforeCursor.split(/\s+/).pop() || '';
    
    // 过滤关键字建议，只保留以当前输入开头的建议，并去掉重复部分
    const filteredKeywords = rawSuggestions.keywords
        .filter(keyword => keyword.toUpperCase().startsWith(lastWord.toUpperCase()))
        .map(keyword => keyword.substring(lastWord.length)); // 去掉与光标前内容重复的部分
    
    return {
        syntax: rawSuggestions.syntax,
        keywords: filteredKeywords,
        cursorPosition: position.column
    };
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
    console.log('\n');

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