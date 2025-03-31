import pkg from 'dt-sql-parser';
const { MySQL, EntityContextType, StmtContextType } = pkg;
import { CaretPosition, Suggestions } from 'dt-sql-parser/src/parser/common/types';
import { WordRange } from 'dt-sql-parser/src/parser/common/textAndWord';
import { MetadataManager } from './metadata';

// 初始化元数据管理器
const metadataManager = new MetadataManager();

// 辅助函数：可视化显示光标位置
function visualizeCaretPosition(sql: string, position: CaretPosition) {
    const pointer = ' '.repeat(position.column - 1) + '^';
    console.log('SQL:', sql);
    console.log('位置:', pointer);
    console.log(`行号: ${position.lineNumber}, 列号: ${position.column}`);
    console.log('---');
}

// 初始化 SQL 解析器
const parser = new MySQL();

// 注册表信息
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

// 解析CREATE TABLE语句并注册元数据
function registerTableMetadata(sql: string) {
    const ast = parser.parse(sql);
    // 这里需要根据实际的AST结构来解析表信息
    // 为了演示，我们使用硬编码的表信息
    metadataManager.addTable({
        name: 'users',
        columns: [
            { name: 'id', type: 'INT' },
            { name: 'name', type: 'VARCHAR(255)' },
            { name: 'email', type: 'VARCHAR(255)' },
            { name: 'created_at', type: 'TIMESTAMP' }
        ]
    });

    metadataManager.addTable({
        name: 'orders',
        columns: [
            { name: 'id', type: 'INT' },
            { name: 'user_id', type: 'INT' },
            { name: 'amount', type: 'DECIMAL(10,2)' },
            { name: 'status', type: 'VARCHAR(50)' },
            { name: 'created_at', type: 'TIMESTAMP' }
        ]
    });
}

// 注册表信息
registerTableMetadata(createTablesSQL);

// 测试函数：显示指定位置的补全提示
function testPosition(sql: string, position: CaretPosition) {
    console.log('SQL:', sql);
    console.log('位置:', sql.slice(0, position.column - 1) + '|' + sql.slice(position.column - 1));
    console.log(`行号: ${position.lineNumber}, 列号: ${position.column}`);
    console.log('---');

    // 获取所有实体
    const entities = parser.getAllEntities(sql, position);
    console.log('当前上下文实体:', JSON.stringify(entities, null, 2));

    const suggestions = parser.getSuggestionAtCaretPosition(sql, position) || {
        syntax: [],
        keywords: []
    };
    console.log('原始补全建议:', suggestions);
    
    // 根据上下文增强补全建议
    const enhancedSuggestions = enhanceSuggestions(suggestions, sql, position, entities);
    
    console.log('增强后的补全建议:', enhancedSuggestions);
    console.log('\n');
}

// 增强补全建议
function enhanceSuggestions(
    suggestions: Suggestions, 
    sql: string, 
    position: CaretPosition,
    entities: any[] | null
): Suggestions {
    // 检查光标前的字符是否是空格
    const charBeforeCursor = position.column > 1 ? sql[position.column - 2] : '';
    const isInToken = charBeforeCursor !== ' ' && charBeforeCursor !== '';

    // 如果在token中，进行token补全
    if (isInToken) {
        const currentWord = getCurrentWord(sql, position);
        return getTokenCompletions(suggestions, currentWord, sql, position, entities);
    }

    // 原有的空格后补全逻辑
    const sqlBeforeCursor = sql.slice(0, position.column - 1).toUpperCase();
    const hasSelect = sqlBeforeCursor.includes('SELECT');
    const hasFrom = sqlBeforeCursor.includes('FROM');
    const hasWhere = sqlBeforeCursor.includes('WHERE');
    
    // 如果在 SELECT 之后但在 FROM 之前
    if (hasSelect && !hasFrom) {
        const allColumns = metadataManager.getAllTableNames().flatMap(tableName => {
            const tableInfo = metadataManager.getTable(tableName);
            return tableInfo ? tableInfo.columns.map(col => `${tableName}.${col.name}`) : [];
        });
        return {
            ...suggestions,
            keywords: [...allColumns.slice(0, 10), ...suggestions.keywords.slice(0, 5)]
        };
    }

    // 如果在 FROM 之后
    if (hasFrom) {
        const afterFrom = sqlBeforeCursor.split('FROM')[1].trim();
        // 如果 FROM 后面没有内容，提供表名建议
        if (!afterFrom) {
            return {
                ...suggestions,
                keywords: [...metadataManager.getAllTableNames().slice(0, 10), ...suggestions.keywords.slice(0, 5)]
            };
        }

        // 如果有表名，提供该表的列名
        const tables = entities?.filter(e => 
            e.entityContextType === EntityContextType.TABLE
        ) || [];
        
        if (tables.length > 0) {
            const lastTable = tables[tables.length - 1];
            const tableInfo = metadataManager.getTable(lastTable.text);
            if (tableInfo) {
                const columns = tableInfo.columns.map(col => col.name);
                const columnsWithTable = tableInfo.columns.map(col => `${lastTable.text}.${col.name}`);
                return {
                    ...suggestions,
                    keywords: [...columns.slice(0, 5), ...columnsWithTable.slice(0, 5), ...suggestions.keywords.slice(0, 5)]
                };
            }
        }
    }

    // 如果在 WHERE 子句中
    if (hasWhere) {
        return {
            ...suggestions,
            keywords: suggestions.keywords.slice(0, 10)
        };
    }

    return suggestions;
}

// 获取当前正在输入的单词
function getCurrentWord(sql: string, position: CaretPosition): string {
    let start = position.column - 2;
    while (start >= 0 && /[a-zA-Z0-9_.]/.test(sql[start])) {
        start--;
    }
    return sql.slice(start + 1, position.column - 1);
}

// 根据当前单词进行补全
function getTokenCompletions(
    suggestions: Suggestions,
    currentWord: string,
    sql: string,
    position: CaretPosition,
    entities: any[] | null
): Suggestions {
    const sqlBeforeCursor = sql.slice(0, position.column - 1).toUpperCase();
    const hasSelect = sqlBeforeCursor.includes('SELECT');
    const hasFrom = sqlBeforeCursor.includes('FROM');
    
    let possibleCompletions: string[] = [];
    
    // 在 SELECT 之后但在 FROM 之前
    if (hasSelect && !hasFrom) {
        // 获取所有表的列名
        possibleCompletions = metadataManager.getAllTableNames().flatMap(tableName => {
            const tableInfo = metadataManager.getTable(tableName);
            return tableInfo ? [
                ...tableInfo.columns.map(col => col.name),
                ...tableInfo.columns.map(col => `${tableName}.${col.name}`)
            ] : [];
        });
    }
    // 在 FROM 之后
    else if (hasFrom) {
        const tables = entities?.filter(e => 
            e.entityContextType === EntityContextType.TABLE
        ) || [];
        
        if (tables.length > 0) {
            // 获取最后一个表的列名
            const lastTable = tables[tables.length - 1];
            const tableInfo = metadataManager.getTable(lastTable.text);
            if (tableInfo) {
                possibleCompletions = [
                    ...tableInfo.columns.map(col => col.name),
                    ...tableInfo.columns.map(col => `${lastTable.text}.${col.name}`)
                ];
            }
        } else {
            // 如果还没有选择表，提供表名补全
            possibleCompletions = metadataManager.getAllTableNames();
        }
    }
    
    // 过滤出匹配当前输入的建议
    const filteredCompletions = possibleCompletions
        .filter(comp => comp.toLowerCase().startsWith(currentWord.toLowerCase()))
        .slice(0, 10);
    
    // 添加匹配的关键字
    const filteredKeywords = suggestions.keywords
        .filter(kw => kw.toLowerCase().startsWith(currentWord.toLowerCase()))
        .slice(0, 5);
    
    return {
        ...suggestions,
        keywords: [...filteredCompletions, ...filteredKeywords]
    };
}

// 测试不同位置
const sql = 'SELECT * FROM users WHERE id = 1';

// 测试用例1：第一列
testPosition(sql, { lineNumber: 1, column: 1 });

// 测试用例2：在SELECT空格后面，有FROM table
testPosition("SELECT  FROM users WHERE id = 1", { lineNumber: 1, column: 8 });

// 测试用例2：在SELECT空格后面，无FROM
testPosition("SELECT ", { lineNumber: 1, column: 8 });

// 测试用例3：在FROM空格后面
testPosition(sql, { lineNumber: 1, column: 16 });

// 测试用例4：在WHERE空格后面
testPosition(sql, { lineNumber: 1, column: 21 });