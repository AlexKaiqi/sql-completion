import { MySQL, CaretPosition, MySqlParserListener, MySqlParserVisitor, Suggestions, WordRange } from 'dt-sql-parser';
import type { CreateViewContext, ColumnNamesContext, SelectElementsContext } from 'dt-sql-parser/dist/lib/mysql/MySqlParser';
import type { ParserRuleContext, TerminalNode, ErrorNode } from 'antlr4ng';
import { MetadataManager, TableInfo, DatabaseInfo, ColumnInfo } from './metadata';
import { EntityContextType, EntityContext, FuncEntityContext, ColumnEntityContext } from 'dt-sql-parser';

// 作用域相关类型定义
export interface ScopeContext {
    // 数据库相关
    databases: Map<string, DatabaseInfo>;
    catalogs: Map<string, any>;
    currentDatabase?: string;
    currentCatalog?: string;

    // 表相关
    tables: Map<string, TableInfo>;
    tableAliases: Map<string, string>;
    derivedTables: Map<string, TableInfo>;
    currentTable?: string;

    // 视图相关
    views: Map<string, TableInfo>;
    viewAliases: Map<string, string>;

    // 列相关
    columns: Map<string, ColumnEntityContext>;
    columnAliases: Map<string, string>;
    selectColumnAliases: Map<string, string>;
    accessibleColumns?: string[];

    // 函数相关
    functions: Map<string, FuncEntityContext>;
    currentFunction?: string;

    // 存储过程相关
    procedures: Map<string, any>;
    currentProcedure?: string;

    // 别名相关
    aliases: Map<string, string>;

    // SQL 上下文
    currentClause?: string;  // SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY
    currentStatement?: string;  // 当前语句类型
    isInSubquery?: boolean;  // 是否在子查询中
    parentContext?: ScopeContext;  // 父级上下文（用于子查询）
}

export interface CompletionItem {
    text: string;
    type: 'keyword' | 'table' | 'column' | 'function' | 'alias' | 'database' | 'view' | 'operator';
    priority: number;
    scope: string;
}

// SQL函数和运算符定义
export const SQL_FUNCTIONS = {
    aggregate: [
        'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
        'GROUP_CONCAT', 'COUNT_DISTINCT', 'STDDEV',
        'VARIANCE', 'BIT_AND', 'BIT_OR', 'BIT_XOR'
    ],
    window: [
        'ROW_NUMBER', 'RANK', 'DENSE_RANK',
        'PERCENT_RANK', 'CUME_DIST', 'LAG',
        'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
        'NTH_VALUE', 'NTILE'
    ]
};

export const SQL_OPERATORS = {
    comparison: ['=', '>', '<', '>=', '<=', '!=', '<>', '<=>', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE'],
    logical: ['AND', 'OR', 'NOT', 'XOR']
};

// 元数据上下文接口
export interface MetadataContext {
    databases: Map<string, DatabaseInfo>;
    tables: Map<string, TableInfo>;
    views: Map<string, TableInfo>;
    tableAliases: Map<string, string>;
    columnAliases: Map<string, string>;
    currentDatabase?: string;
    currentClause?: string;
    currentTable?: string;
    accessibleColumns?: string[];
}

// 定义实体类型
interface Entity {
    entityContextType: string;  // 实体类型 (表、视图等)
    text: string;              // 实体名称
    _alias?: {                // 别名信息
        text: string;
        startIndex: number;
        endIndex: number;
        startColumn: number;
        endColumn: number;
        line: number;
    };
    position: {               // 位置信息
        startIndex: number;
        endIndex: number;
        startColumn: number;
        endColumn: number;
        line: number;
    };
    belongStmt?: {           // 所属语句信息
        stmtContextType: string;
        position: any;
        rootStmt: any;
        parentStmt: any;
        isContainCaret?: boolean;
    };
    _comment?: any;
    relatedEntities?: any;
}

// 作用域分析核心类
export class ScopeAnalyzer {
    private parser: MySQL;
    private metadataManager: MetadataManager;
    private collector: MetadataCollector;

    constructor(parser: MySQL, metadataManager: MetadataManager) {
        this.parser = parser;
        this.metadataManager = metadataManager;
        this.collector = new MetadataCollector(parser);
    }

    analyzeScope(sql: string, position: CaretPosition): ScopeContext {
        const context: ScopeContext = {
            databases: new Map(),
            catalogs: new Map(),
            tables: new Map(),
            views: new Map(),
            tableAliases: new Map(),
            viewAliases: new Map(),
            columnAliases: new Map(),
            selectColumnAliases: new Map(),
            aliases: new Map(),
            derivedTables: new Map(),
            columns: new Map(),
            functions: new Map(),
            procedures: new Map()
        };

        this.metadataManager.getAllDatabaseNames().forEach(dbName => {
            const dbInfo = this.metadataManager.getTablesByDatabase(dbName);
            context.databases.set(dbName, {
                name: dbName,
                tables: new Map()
            });
        });

        // 设置表信息
        this.metadataManager.getAllTableNames().forEach(tableName => {
            const tableInfo = this.metadataManager.getTable(tableName);
            if (tableInfo) {
                context.tables.set(tableName, tableInfo);
            }
        });

        // 设置视图信息
        this.metadataManager.getAllViews().forEach(view => {
            const viewInfo: TableInfo = {
                name: view.name,
                database: view.database,
                columns: view.columns
            };
            context.views.set(view.name, viewInfo);
            // 将视图添加到对应的数据库中
            const dbName = view.database || 'test_db';
            const dbInfo = context.databases.get(dbName);
            if (dbInfo) {
                dbInfo.tables.set(view.name, viewInfo);
            }
        });

        // 设置表别名
        this.collector.collect(sql).forEach(entity => {
            const entityType = entity.entityContextType;
            const entityName = entity.text;
            const entityAlias = (entity as any)._alias?.text;

            switch (entityType) {
                case EntityContextType.TABLE:
                case EntityContextType.TABLE_CREATE:
                    if (entityAlias) {
                        context.tableAliases.set(entityAlias, entityName);
                    }
                    break;

                case EntityContextType.VIEW:
                case EntityContextType.VIEW_CREATE:
                    if (entityAlias) {
                        context.viewAliases.set(entityAlias, entityName);
                    }
                    break;

                case EntityContextType.COLUMN:
                case EntityContextType.COLUMN_CREATE:
                    if (entityAlias) {
                        if (this.isSelectColumnAlias(entity)) {
                            context.selectColumnAliases.set(entityAlias, entityName);
                        } else {
                            context.columnAliases.set(entityAlias, entityName);
                        }
                    }
                    break;
            }
        });

        return context;
    }

    // 获取当前位置的上下文
    getContextAtPosition(sql: string, position: CaretPosition): ScopeContext {
        // 收集当前 SQL 中的实体
        const entities = this.collector.collect(sql);
        
        // 初始化上下文
        const context: ScopeContext = {
            databases: new Map(),
            catalogs: new Map(),
            tables: new Map(),
            views: new Map(),
            tableAliases: new Map(),
            viewAliases: new Map(),
            columnAliases: new Map(),
            selectColumnAliases: new Map(),
            aliases: new Map(),
            derivedTables: new Map(),
            columns: new Map(),
            functions: new Map(),
            procedures: new Map()
        };

        // 从 MetadataManager 获取所有数据库信息
        this.metadataManager.getAllDatabaseNames().forEach(dbName => {
            const dbInfo = this.metadataManager.getDatabase(dbName);
            if (dbInfo) {
                context.databases.set(dbName, dbInfo);
            }
        });

        // 从 MetadataManager 获取所有表信息
        this.metadataManager.getAllTableNames().forEach(tableName => {
            const tableInfo = this.metadataManager.getTable(tableName);
            if (tableInfo) {
                context.tables.set(tableName, tableInfo);
            }
        });

        // 从 MetadataManager 获取所有视图信息
        this.metadataManager.getAllViews().forEach(view => {
            const viewInfo: TableInfo = {
                name: view.name,
                database: view.database,
                columns: view.columns
            };
            context.views.set(view.name, viewInfo);
        });

        // 处理当前 SQL 中的别名信息
        entities.forEach(entity => {
            const entityType = entity.entityContextType;
            const entityName = entity.text;
            const entityAlias = (entity as any)._alias?.text;

            switch (entityType) {
                case EntityContextType.TABLE:
                case EntityContextType.TABLE_CREATE:
                    if (entityAlias) {
                        context.tableAliases.set(entityAlias, entityName);
                    }
                    break;

                case EntityContextType.VIEW:
                case EntityContextType.VIEW_CREATE:
                    if (entityAlias) {
                        context.viewAliases.set(entityAlias, entityName);
                    }
                    break;

                case EntityContextType.COLUMN:
                case EntityContextType.COLUMN_CREATE:
                    if (entityAlias) {
                        if (this.isSelectColumnAlias(entity)) {
                            context.selectColumnAliases.set(entityAlias, entityName);
                        } else {
                            context.columnAliases.set(entityAlias, entityName);
                        }
                    }
                    break;
            }
        });

        return context;
    }

    // 判断是否是 SELECT 语句中的列别名
    private isSelectColumnAlias(entity: EntityContext): boolean {
        const position = entity.position;
        return position.line === 1 && position.startColumn > 7;
    }
}

class MetadataCollector {
    private parser: MySQL;

    constructor(parser: MySQL) {
        this.parser = parser;
    }

    collect(sql: string): EntityContext[] {
        // 获取所有实体
        const entities = this.parser.getAllEntities(sql) as unknown as EntityContext[];
        console.log('entities', entities);
        return entities || [];
    }
} 