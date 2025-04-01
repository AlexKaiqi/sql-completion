import { MySQL, CaretPosition } from 'dt-sql-parser';
import { MetadataManager, TableInfo, DatabaseInfo } from './metadata';

// 作用域相关类型定义
export interface ScopeContext {
    databases: Map<string, DatabaseInfo>;
    tables: Map<string, TableInfo>;
    aliases: Map<string, string>;
    derivedTables: Map<string, TableInfo>;
    currentClause: string;
    currentDatabase?: string;
}

export interface CompletionItem {
    text: string;
    type: 'keyword' | 'table' | 'column' | 'function' | 'alias';
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

// 作用域分析核心类
export class ScopeAnalyzer {
    private parser: MySQL;
    private metadataManager: MetadataManager;

    constructor(parser: MySQL, metadataManager: MetadataManager) {
        this.parser = parser;
        this.metadataManager = metadataManager;
    }

    // 获取当前位置的上下文
    public getContextAtPosition(sql: string, position: CaretPosition): {
        currentClause: string;
        accessibleTables: string[];
        accessibleColumns: string[];
        currentTable?: string;
        currentDatabase?: string;
    } {
        const ast = this.parser.parse(sql);
        const nodeAtPosition = this.findNodeAtPosition(ast, position);

        return {
            currentClause: this.determineCurrentClause(nodeAtPosition),
            accessibleTables: this.getAccessibleTables(nodeAtPosition),
            accessibleColumns: this.getAccessibleColumns(nodeAtPosition),
            currentTable: this.getCurrentTable(nodeAtPosition),
            currentDatabase: this.getCurrentDatabase(nodeAtPosition)
        };
    }

    // 分析完整作用域
    public analyzeScope(sql: string, position: CaretPosition): ScopeContext {
        const context: ScopeContext = {
            databases: new Map(),
            tables: new Map(),
            aliases: new Map(),
            derivedTables: new Map(),
            currentClause: '',
            currentDatabase: ''
        };
        
        const ast = this.parser.parse(sql);
        const nodeAtPosition = this.findNodeAtPosition(ast, position);
        
        // 分析当前子句
        context.currentClause = this.determineCurrentClause(nodeAtPosition);
        
        // 分析可访问的表
        const tables = this.getAccessibleTables(nodeAtPosition);
        tables.forEach(table => {
            const tableInfo = this.metadataManager.getTable(table);
            if (tableInfo) {
                context.tables.set(table, tableInfo);
            }
        });
        
        // 分析表别名
        this.analyzeTableAliases(nodeAtPosition, context);
        
        // 分析派生表
        this.analyzeDerivedTables(nodeAtPosition, context);
        
        // 分析当前数据库
        context.currentDatabase = this.getCurrentDatabase(nodeAtPosition);
        
        return context;
    }

    // 获取补全建议优先级
    public getCompletionPriority(item: CompletionItem): number {
        const basePriorities = {
            'keyword': 1000,
            'table': 900,
            'column': 800,
            'function': 700,
            'alias': 600
        };
        
        let priority = basePriorities[item.type];
        
        // 根据作用域调整优先级
        if (item.scope === 'current') {
            priority += 500;
        }
        
        return priority;
    }

    // 获取上下文感知的补全建议
    public getContextAwareCompletions(context: ScopeContext): CompletionItem[] {
        const completions: CompletionItem[] = [];
        
        switch (context.currentClause) {
            case 'SELECT':
                this.addSelectCompletions(context, completions);
                break;
            case 'FROM':
                this.addFromCompletions(context, completions);
                break;
            case 'WHERE':
                this.addWhereCompletions(context, completions);
                break;
            case 'GROUP BY':
                this.addGroupByCompletions(context, completions);
                break;
            case 'HAVING':
                this.addHavingCompletions(context, completions);
                break;
        }
        
        return completions.sort((a, b) => b.priority - a.priority);
    }

    // 私有辅助方法
    private determineCurrentClause(node: any): string {
        if (!node) return '';

        let current = node;
        while (current && current.parent) {
            if (current.type === 'SELECT') return 'SELECT';
            if (current.type === 'FROM') return 'FROM';
            if (current.type === 'WHERE') return 'WHERE';
            if (current.type === 'GROUP BY') return 'GROUP BY';
            if (current.type === 'HAVING') return 'HAVING';
            if (current.type === 'ORDER BY') return 'ORDER BY';
            if (current.type === 'JOIN') return 'JOIN';
            if (current.type === 'ON') return 'ON';
            current = current.parent;
        }
        return '';
    }

    private getAccessibleTables(node: any): string[] {
        const tables: string[] = [];
        
        let current = node;
        while (current && current.parent) {
            if (current.type === 'FROM') {
                tables.push(...this.extractTablesFromFromClause(current));
            }
            if (current.type === 'JOIN') {
                tables.push(...this.extractTablesFromJoinClause(current));
            }
            current = current.parent;
        }
        
        return [...new Set(tables)];
    }

    private getAccessibleColumns(node: any): string[] {
        const columns: string[] = [];
        const tables = this.getAccessibleTables(node);
        
        tables.forEach(table => {
            const tableInfo = this.metadataManager.getTable(table);
            if (tableInfo) {
                columns.push(...tableInfo.columns.map(col => col.name));
            }
        });
        
        return columns;
    }

    private findNodeAtPosition(ast: any, position: CaretPosition): any {
        // TODO: 实现AST节点查找
        return null;
    }

    private extractTablesFromFromClause(node: any): string[] {
        const tables: string[] = [];
        if (node.type === 'FROM') {
            node.children?.forEach((child: any) => {
                if (child.type === 'TABLE_REFERENCE') {
                    tables.push(child.name);
                }
            });
        }
        return tables;
    }

    private extractTablesFromJoinClause(node: any): string[] {
        const tables: string[] = [];
        if (node.type === 'JOIN') {
            node.children?.forEach((child: any) => {
                if (child.type === 'TABLE_REFERENCE') {
                    tables.push(child.name);
                }
            });
        }
        return tables;
    }

    private getCurrentTable(node: any): string | undefined {
        if (!node) return undefined;
        
        let current = node;
        while (current && current.parent) {
            if (current.type === 'TABLE_REFERENCE') {
                return current.name;
            }
            current = current.parent;
        }
        return undefined;
    }

    private getCurrentDatabase(node: any): string | undefined {
        if (!node) return undefined;
        
        let current = node;
        while (current && current.parent) {
            if (current.type === 'DATABASE_REFERENCE') {
                return current.name;
            }
            current = current.parent;
        }
        return undefined;
    }

    private analyzeTableAliases(node: any, context: ScopeContext): void {
        // TODO: 实现表别名分析
    }

    private analyzeDerivedTables(node: any, context: ScopeContext): void {
        // TODO: 实现派生表分析
    }

    private addSelectCompletions(context: ScopeContext, completions: CompletionItem[]): void {
        // TODO: 实现SELECT子句补全
    }

    private addFromCompletions(context: ScopeContext, completions: CompletionItem[]): void {
        // TODO: 实现FROM子句补全
    }

    private addWhereCompletions(context: ScopeContext, completions: CompletionItem[]): void {
        // TODO: 实现WHERE子句补全
    }

    private addGroupByCompletions(context: ScopeContext, completions: CompletionItem[]): void {
        // TODO: 实现GROUP BY子句补全
    }

    private addHavingCompletions(context: ScopeContext, completions: CompletionItem[]): void {
        // TODO: 实现HAVING子句补全
    }
} 