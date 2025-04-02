import { MySQL, CaretPosition } from 'dt-sql-parser';
import { MetadataManager } from './metadata';
import { ScopeAnalyzer, SQL_FUNCTIONS, SQL_OPERATORS } from './scope';
import { ScopeContext } from './scope';

// 扩展 Suggestions 类型
export interface SuggestionItem {
    value: string;      // 补全建议的值
    type: 'keyword' | 'function' | 'table' | 'column' | 'database' | 'view' | 'alias';  // 补全建议的类型
}

export interface ExtendedSuggestions {
    suggestions: SuggestionItem[];  // 所有补全建议
    cursorPosition?: number;        // 光标位置
}

// 辅助函数：处理关键字建议
function getKeywordSuggestions(keywords: string[], lastWord: string): SuggestionItem[] {
    return keywords
        .filter(keyword => keyword.toUpperCase().startsWith(lastWord.toUpperCase()))
        .map(keyword => ({
            value: keyword.substring(lastWord.length),
            type: 'keyword' as const
        }));
}

// 辅助函数：处理建议的排序和过滤
function processSuggestions(suggestions: SuggestionItem[], maxSuggestions: number = 20): SuggestionItem[] {
    // 按类型分组
    const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
        if (!acc[suggestion.type]) {
            acc[suggestion.type] = [];
        }
        acc[suggestion.type].push(suggestion);
        return acc;
    }, {} as Record<SuggestionItem['type'], SuggestionItem[]>);

    // 从每种类型中取一个建议
    const typePriority = {
        'keyword': 1000,
        'function': 900,
        'table': 800,
        'column': 700,
        'database': 600,
        'view': 500,
        'alias': 400
    };

    // 按优先级排序类型
    const sortedTypes = Object.keys(typePriority).sort(
        (a, b) => typePriority[b as keyof typeof typePriority] - typePriority[a as keyof typeof typePriority]
    );

    // 收集建议，每种类型取一个，直到达到最大数量
    const result: SuggestionItem[] = [];
    let currentIndex = 0;
    const types = Object.keys(groupedSuggestions) as SuggestionItem['type'][];

    while (result.length < maxSuggestions && currentIndex < types.length) {
        const type = types[currentIndex];
        if (groupedSuggestions[type]?.length > 0) {
            result.push(groupedSuggestions[type][0]);
        }
        currentIndex++;
    }

    // 按类型优先级和字母顺序排序
    return result.sort((a, b) => {
        // 首先按类型优先级排序
        const priorityDiff = typePriority[b.type] - typePriority[a.type];
        if (priorityDiff !== 0) {
            return priorityDiff;
        }
        // 如果类型相同，按字母顺序排序
        return a.value.localeCompare(b.value);
    });
}

// 辅助函数：获取表名补全建议
function getTableSuggestions(scope: ScopeContext, prefix: string): SuggestionItem[] {
    const suggestions: SuggestionItem[] = [];
    
    // 从 scope 中获取所有表名
    scope.tables.forEach((tableInfo, tableName) => {
        if (tableName.toUpperCase().startsWith(prefix.toUpperCase())) {
            suggestions.push({
                value: tableName.substring(prefix.length),
                type: 'table' as const
            });
        }
    });
    
    // 从 scope 中获取所有视图名
    scope.views.forEach((viewInfo, viewName) => {
        if (viewName.toUpperCase().startsWith(prefix.toUpperCase())) {
            suggestions.push({
                value: viewName.substring(prefix.length),
                type: 'view' as const
            });
        }
    });
    
    return suggestions;
}

// 辅助函数：获取列名补全建议
function getColumnSuggestions(scope: ScopeContext, prefix: string): SuggestionItem[] {
    const suggestions: SuggestionItem[] = [];
    console.log('Getting column suggestions for prefix:', prefix);
    console.log('Table aliases:', Array.from(scope.tableAliases.entries()));
    
    // 如果包含.，则只补全当前table/view/alias的列
    if (prefix.includes('.')) {
        const [tableName, columnPrefix] = prefix.split('.');
        console.log('Table name:', tableName, 'Column prefix:', columnPrefix);
        
        // 检查是否是表别名
        const actualTableName = scope.tableAliases.get(tableName) || tableName;
        console.log('Actual table name:', actualTableName);
        
        // 从表或视图中获取列
        const tableInfo = scope.tables.get(actualTableName) || scope.views.get(actualTableName);
        if (tableInfo) {
            console.log('Found table/view info:', tableInfo);
            tableInfo.columns.forEach(column => {
                if (column.name.toUpperCase().startsWith(columnPrefix.toUpperCase())) {
                    suggestions.push({
                        value: column.name.substring(columnPrefix.length),
                        type: 'column' as const
                    });
                }
            });
        } else {
            console.log('No table/view info found for:', actualTableName);
        }
        return suggestions;
    }
    
    // 处理不带点号的列名情况
    // 从所有表和视图中获取列
    for (const table of scope.tables.values()) {
        table.columns.forEach(column => {
            if (column.name.toUpperCase().startsWith(prefix.toUpperCase())) {
                suggestions.push({
                    value: column.name.substring(prefix.length),
                    type: 'column' as const
                });
            }
        });
    }
    
    for (const view of scope.views.values()) {
        view.columns.forEach(column => {
            if (column.name.toUpperCase().startsWith(prefix.toUpperCase())) {
                suggestions.push({
                    value: column.name.substring(prefix.length),
                    type: 'column' as const
                });
            }
        });
    }
    
    return suggestions;
}

// 辅助函数：获取数据库名补全建议
function getDatabaseSuggestions(scope: ScopeContext, prefix: string): SuggestionItem[] {
    const suggestions: SuggestionItem[] = [];
    
    // 从 scope 中获取所有数据库
    scope.databases.forEach((dbInfo, dbName) => {
        if (dbName.toUpperCase().startsWith(prefix.toUpperCase())) {
            suggestions.push({
                value: dbName.substring(prefix.length),
                type: 'database' as const
            });
        }
    });
    
    return suggestions;
}

// 修改 getFunctionSuggestions 函数以支持聚合函数
function getFunctionSuggestions(prefix: string, includeAggregate: boolean = false): string[] {
    const allFunctions = [
        ...SQL_FUNCTIONS.window,
        ...(includeAggregate ? SQL_FUNCTIONS.aggregate : [])
    ];

    return allFunctions
        .filter(func => func.toUpperCase().startsWith(prefix.toUpperCase()))
        .map(func => {
            const remaining = func.substring(prefix.length);
            return remaining + '()'; // 添加括号
        });
}

// 获取补全建议并处理 null 情况
export function getSuggestions(
    parser: MySQL,
    metadataManager: MetadataManager,
    scopeAnalyzer: ScopeAnalyzer,
    sql: string,
    position: CaretPosition
): ExtendedSuggestions {
    const rawSuggestions = parser.getSuggestionAtCaretPosition(sql, position) || { syntax: [], keywords: [] };
    console.log('rawSuggestions', rawSuggestions);
    // 获取光标前的文本
    const beforeCursor = sql.substring(0, position.column - 1);
    const lastWord = beforeCursor.split(/\s+/).pop() || '';

    // 获取当前位置的上下文
    const context = scopeAnalyzer.getContextAtPosition(sql, position);
    console.log('Current context:', context);

    // 获取完整的作用域分析
    const scope = scopeAnalyzer.analyzeScope(sql, position);
    console.log('Scope analysis:', scope);

    // 转换所有建议为统一格式
    const suggestions: SuggestionItem[] = [];

    // 处理关键字建议
    suggestions.push(...getKeywordSuggestions(rawSuggestions.keywords, lastWord));

    // 处理语法建议
    rawSuggestions.syntax.forEach(syntaxSuggestion => {
        if (syntaxSuggestion.syntaxContextType) {
            // 处理实体类型的建议
            switch (syntaxSuggestion.syntaxContextType) {
                case 'database':
                    // 处理数据库建议
                    suggestions.push(...getDatabaseSuggestions(scope, lastWord));
                    break;
                case 'table':
                    // 处理表名和视图建议，考虑当前数据库上下文
                    suggestions.push(...getTableSuggestions(scope, lastWord));
                    break;
                case 'column':
                    // 处理列名建议，考虑当前可访问的表
                    suggestions.push(...getColumnSuggestions(scope, lastWord));
                    break;
                case 'function':
                    suggestions.push(...getFunctionSuggestions(lastWord, false).map(value => ({
                        value,
                        type: 'function' as const
                    })));
                    
                    break;
            }
        }
    });

    // 处理建议的排序和过滤
    const processedSuggestions = processSuggestions(suggestions);

    return {
        suggestions: processedSuggestions,
        cursorPosition: position.column
    };
} 