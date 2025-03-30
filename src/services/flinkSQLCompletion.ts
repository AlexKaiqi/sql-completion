import { CompletionItem, CompletionContext, CompletionResult, FlinkSQLContext } from '../types/sql';
import { SQLParserService } from './sqlParser';

export class FlinkSQLCompletionService {
    private parser: SQLParserService;
    private context: FlinkSQLContext;

    constructor(context: FlinkSQLContext) {
        this.parser = new SQLParserService();
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

        // 获取当前位置之前的文本
        const textBeforeCursor = text.substring(0, position);
        const lastWord = this.getLastWord(textBeforeCursor);

        // 根据上下文智能返回补全项
        if (this.isInKeywordContext(textBeforeCursor)) {
            items.push(...this.getKeywordCompletions());
        }
        
        if (this.isInFunctionContext(textBeforeCursor)) {
            items.push(...this.getFunctionCompletions());
        }
        
        if (this.isInTableContext(textBeforeCursor)) {
            items.push(...this.getTableCompletions());
        }
        
        if (this.isInColumnContext(textBeforeCursor)) {
            items.push(...this.getColumnCompletions(text, position));
        }

        // 如果没有特定上下文，返回所有补全项
        if (items.length === 0) {
            items.push(
                ...this.getKeywordCompletions(),
                ...this.getFunctionCompletions(),
                ...this.getTableCompletions(),
                ...this.getColumnCompletions(text, position)
            );
        }

        return items;
    }

    /**
     * 获取最后一个单词
     */
    private getLastWord(text: string): string {
        const words = text.trim().split(/\s+/);
        return words[words.length - 1] || '';
    }

    /**
     * 判断是否在关键字上下文中
     */
    private isInKeywordContext(text: string): boolean {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'];
        const lastWord = this.getLastWord(text);
        return keywords.some(keyword => keyword.toLowerCase().startsWith(lastWord.toLowerCase()));
    }

    /**
     * 判断是否在函数上下文中
     */
    private isInFunctionContext(text: string): boolean {
        // 判断是否在函数调用位置
        // 通过检查括号匹配
        return text.includes('(') && !text.includes(')');
    }

    /**
     * 判断是否在表名上下文中
     */
    private isInTableContext(text: string): boolean {
        const keywords = ['FROM', 'JOIN', 'INTO', 'UPDATE', 'TABLE'];
        const lastWord = this.getLastWord(text);
        return keywords.some(keyword => keyword.toLowerCase().startsWith(lastWord.toLowerCase()));
    }

    /**
     * 判断是否在列名上下文中
     */
    private isInColumnContext(text: string): boolean {
        // 判断是否在列名位置
        // 在 SELECT 之后，FROM 之前
        return text.includes('SELECT') && !text.includes('FROM');
    }

    /**
     * 获取关键字补全
     */
    private getKeywordCompletions(): CompletionItem[] {
        const keywords = [
            // 基础 SQL 关键字
            'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT',
            'INSERT INTO', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE',
            'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
            'UNION', 'UNION ALL',
            'WITH', 'AS',
            'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
            
            // FlinkSQL 特定关键字
            'CREATE VIEW', 'CREATE FUNCTION', 'CREATE CATALOG',
            'CREATE DATABASE', 'CREATE SCHEMA',
            'USE CATALOG', 'USE DATABASE',
            'SHOW CATALOGS', 'SHOW DATABASES', 'SHOW TABLES',
            'SHOW FUNCTIONS', 'SHOW VIEWS',
            'DESCRIBE', 'DESC',
            'EXPLAIN', 'EXECUTE',
            'SET', 'RESET',
            'MATCH_RECOGNIZE', 'PATTERN', 'DEFINE', 'MEASURES',
            'MATCHES', 'ONE ROW PER MATCH', 'ALL ROWS PER MATCH',
            'AFTER MATCH SKIP', 'AFTER MATCH SKIP PAST LAST ROW',
            'AFTER MATCH SKIP TO NEXT ROW', 'AFTER MATCH SKIP TO LAST',
            'AFTER MATCH SKIP TO FIRST'
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
        const flinkFunctions = [
            // 时间函数
            'DATE_FORMAT', 'TO_TIMESTAMP', 'FROM_UNIXTIME', 'UNIX_TIMESTAMP',
            'DATE_ADD', 'DATE_SUB', 'EXTRACT', 'FLOOR', 'CEIL',
            
            // 字符串函数
            'CONCAT', 'SUBSTRING', 'TRIM', 'LOWER', 'UPPER', 'LENGTH',
            'REGEXP_REPLACE', 'REGEXP_EXTRACT', 'SPLIT_INDEX',
            
            // 数值函数
            'ROUND', 'FLOOR', 'CEILING', 'ABS', 'MOD', 'POWER',
            'EXP', 'LN', 'LOG10', 'LOG2', 'SIN', 'COS', 'TAN',
            
            // 聚合函数
            'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'STDDEV', 'VARIANCE',
            'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
            
            // 窗口函数
            'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'PERCENT_RANK',
            'CUME_DIST', 'NTILE', 'LAG', 'LEAD',
            
            // 条件函数
            'CASE', 'IF', 'IFNULL', 'COALESCE', 'NULLIF',
            
            // 类型转换函数
            'CAST', 'CONVERT', 'TO_DATE', 'TO_TIME', 'TO_TIMESTAMP',
            
            // Flink 特有函数
            'TUMBLE', 'HOP', 'SESSION', 'CUMULATE',
            'PROCTIME', 'ROWTIME', 'CURRENT_TIMESTAMP',
            'CURRENT_DATE', 'CURRENT_TIME'
        ];

        return flinkFunctions.map(func => ({
            label: func,
            kind: 'function',
            detail: 'FlinkSQL 内置函数'
        }));
    }

    /**
     * 获取表名补全
     */
    private getTableCompletions(): CompletionItem[] {
        // 从上下文中获取可用表名
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
        // 智能提供相关表的列名
        // 通过解析 SQL 获取相关表
        // 从上下文中获取这些表的列名
        const items: CompletionItem[] = [];
        
        // 解析当前 SQL 语句
        const parseResult = this.parser.parse(sql);
        if (parseResult.success && parseResult.ast) {
            // 从 AST 中提取表名
            const tables = this.extractTablesFromAST(parseResult.ast);
            
            // 只返回相关表的列名
            tables.forEach(table => {
                if (this.context.columns[table]) {
                    this.context.columns[table].forEach(column => {
                        items.push({
                            label: column,
                            kind: 'column',
                            detail: `表 ${table} 的列`
                        });
                    });
                }
            });
        } else {
            // 如果 SQL 不完整或解析失败，返回所有可能的列名
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

    /**
     * 从 AST 中提取表名
     */
    private extractTablesFromAST(ast: any): string[] {
        const tables: string[] = [];
        
        if (!ast) return tables;

        // 处理 FROM 子句中的表
        if (ast.from) {
            if (Array.isArray(ast.from)) {
                ast.from.forEach((from: any) => {
                    if (from.table) {
                        tables.push(from.table);
                    }
                });
            } else if (ast.from.table) {
                tables.push(ast.from.table);
            }
        }

        // 处理 JOIN 子句中的表
        if (ast.join) {
            if (Array.isArray(ast.join)) {
                ast.join.forEach((join: any) => {
                    if (join.table) {
                        tables.push(join.table);
                    }
                });
            } else if (ast.join.table) {
                tables.push(ast.join.table);
            }
        }

        return tables;
    }
} 