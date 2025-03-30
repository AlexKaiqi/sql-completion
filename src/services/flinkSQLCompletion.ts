import { CompletionItem, CompletionContext, CompletionResult, FlinkSQLContext } from '../types/sql';

class MockFlinkSQL {
    parse(sql: string): any {
        // 简单的模拟实现
        return {
            type: 'select',
            tables: ['users'],
            columns: ['id', 'name']
        };
    }
}

export class FlinkSQLCompletionService {
    private parser: any;
    private context: FlinkSQLContext;

    constructor(context: FlinkSQLContext) {
        this.parser = new MockFlinkSQL();
        this.context = context;
    }

    /**
     * 获取补全建议
     * @param sql SQL 语句
     * @param position 光标位置
     * @returns 补全建议列表
     */
    public getCompletionItems(sql: string, position: number): CompletionResult {
        const context = this.getCompletionContext(sql, position);
        const items = this.getCompletionItemsByContext(context);
        
        return {
            items,
            context
        };
    }

    /**
     * 获取补全上下文
     */
    private getCompletionContext(sql: string, position: number): CompletionContext {
        const lines = sql.split('\n');
        let currentLine = 0;
        let currentColumn = 0;
        let currentPosition = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (currentPosition + line.length >= position) {
                currentLine = i;
                currentColumn = position - currentPosition;
                break;
            }
            currentPosition += line.length;
        }

        return {
            position,
            text: sql,
            line: currentLine,
            column: currentColumn
        };
    }

    /**
     * 根据上下文获取补全建议
     */
    private getCompletionItemsByContext(context: CompletionContext): CompletionItem[] {
        const items: CompletionItem[] = [];
        const { text, position } = context;

        // 添加关键字补全
        items.push(...this.getKeywordCompletions(text, position));

        // 添加函数补全
        items.push(...this.getFunctionCompletions());

        // 添加表名补全
        items.push(...this.getTableCompletions());

        // 添加列名补全
        items.push(...this.getColumnCompletions(text, position));

        return items;
    }

    /**
     * 获取关键字补全
     */
    private getKeywordCompletions(sql: string, position: number): CompletionItem[] {
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT',
            'INSERT INTO', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE',
            'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
            'UNION', 'UNION ALL',
            'WITH', 'AS',
            'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'
        ];

        return keywords.map(keyword => ({
            label: keyword,
            kind: 'keyword',
            detail: 'FlinkSQL 关键字'
        }));
    }

    /**
     * 获取函数补全
     */
    private getFunctionCompletions(): CompletionItem[] {
        return this.context.functions.map(func => ({
            label: func,
            kind: 'function',
            detail: 'FlinkSQL 内置函数'
        }));
    }

    /**
     * 获取表名补全
     */
    private getTableCompletions(): CompletionItem[] {
        return this.context.tables.map(table => ({
            label: table,
            kind: 'table',
            detail: '可用表'
        }));
    }

    /**
     * 获取列名补全
     */
    private getColumnCompletions(sql: string, position: number): CompletionItem[] {
        const items: CompletionItem[] = [];
        
        // 解析当前 SQL 语句
        try {
            const ast = this.parser.parse(sql);
            // 根据 AST 分析当前上下文，获取相关表的列名
            // TODO: 实现更复杂的列名补全逻辑
            Object.entries(this.context.columns).forEach(([table, columns]) => {
                columns.forEach(column => {
                    items.push({
                        label: column,
                        kind: 'column',
                        detail: `表 ${table} 的列`
                    });
                });
            });
        } catch (error) {
            // 如果 SQL 不完整，仍然返回所有可能的列名
            Object.entries(this.context.columns).forEach(([table, columns]) => {
                columns.forEach(column => {
                    items.push({
                        label: column,
                        kind: 'column',
                        detail: `表 ${table} 的列`
                    });
                });
            });
        }

        return items;
    }
} 