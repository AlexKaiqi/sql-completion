import { CompletionItem, CompletionContext, CompletionResult, FlinkSQLContext, CompletionContextType } from '../types/sql';
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
        const parseResult = this.parser.parse(sql, position);
        const { line, column } = this.calculateLineAndColumn(sql, position);
        const contextType = this.determineContextFromAST(parseResult.ast, position);

        // 获取基于语法规则的补全建议
        const items = this.getCompletionItemsByRules(parseResult.suggestions?.rules || [], sql, position);

        // 获取基于关键字的补全建议
        if (parseResult.suggestions?.keywords) {
            items.push(...this.getKeywordCompletionItems(parseResult.suggestions.keywords));
        }

        // 根据上下文对补全项进行排序和过滤
        const sortedItems = this.sortCompletionItems(items, contextType);

        return {
            items: sortedItems,
            context: {
                position,
                text: sql,
                line,
                column,
                contextType,
                ast: parseResult.ast
            }
        };
    }

    /**
     * 根据语法规则获取补全建议
     */
    private getCompletionItemsByRules(rules: string[], sql: string, position: number): CompletionItem[] {
        const items: CompletionItem[] = [];

        for (const rule of rules) {
            switch (rule) {
                case 'table':
                    items.push(...this.getTableCompletions());
                    break;
                case 'column':
                    items.push(...this.getColumnCompletions(sql, position));
                    break;
                case 'function':
                    items.push(...this.getFunctionCompletions());
                    break;
                case 'expression':
                    items.push(
                        ...this.getColumnCompletions(sql, position),
                        ...this.getFunctionCompletions(),
                        ...this.getOperatorCompletions()
                    );
                    break;
            }
        }

        return items;
    }

    /**
     * 获取关键字补全建议
     */
    private getKeywordCompletionItems(keywords: string[]): CompletionItem[] {
        return keywords.map(keyword => ({
            label: keyword,
            kind: 'keyword',
            detail: 'FlinkSQL 关键字'
        }));
    }

    /**
     * 对补全项进行排序
     */
    private sortCompletionItems(items: CompletionItem[], contextType: CompletionContextType): CompletionItem[] {
        // 根据上下文类型设置排序权重
        const getWeight = (item: CompletionItem): number => {
            switch (contextType) {
                case CompletionContextType.SELECT:
                    if (item.kind === 'column' && this.isCommonColumn(item.label)) return 100;
                    if (item.kind === 'function') return 90;
                    if (item.kind === 'column') return 80;
                    break;
                case CompletionContextType.WHERE:
                    if (item.kind === 'column' && this.isFilterableColumn(item.label)) return 100;
                    if (item.kind === 'operator') return 90;
                    if (item.kind === 'column') return 80;
                    if (item.kind === 'function') return 70;
                    break;
                case CompletionContextType.FROM:
                    if (item.kind === 'table') return 100;
                    if (item.kind === 'keyword' && item.label.includes('JOIN')) return 90;
                    break;
                case CompletionContextType.JOIN:
                    if (item.kind === 'table') return 100;
                    break;
                case CompletionContextType.GROUP_BY:
                case CompletionContextType.ORDER_BY:
                    if (item.kind === 'column') return 100;
                    if (item.kind === 'function') return 90;
                    break;
                case CompletionContextType.HAVING:
                    if (item.kind === 'function') return 100;
                    if (item.kind === 'column') return 90;
                    if (item.kind === 'operator') return 80;
                    break;
            }
            return 0;
        };

        // 为每个补全项添加权重并排序
        return items
            .map(item => ({
                ...item,
                weight: getWeight(item)
            }))
            .sort((a, b) => {
                // 首先按权重排序
                if (b.weight !== a.weight) {
                    return b.weight - a.weight;
                }
                // 权重相同时按标签字母顺序排序
                return a.label.localeCompare(b.label);
            })
            .map(({ weight, ...item }) => item);  // 移除权重属性
    }

    /**
     * 获取补全上下文
     */
    private getCompletionContext(sql: string, position: number): CompletionContext {
        const parseResult = this.parser.parse(sql);
        const { line, column } = this.calculateLineAndColumn(sql, position);

        // 使用 AST 来确定当前位置的上下文
        if (parseResult.ast) {
            const contextType = this.determineContextFromAST(parseResult.ast, position);
            return {
                position,
                text: sql,
                line,
                column,
                contextType,
                ast: parseResult.ast
            };
        }

        // 降级处理：使用当前的简单逻辑
        return {
            position,
            text: sql,
            line,
            column,
            contextType: CompletionContextType.NONE,
            ast: null
        };
    }

    /**
     * 计算指定位置的行号和列号
     */
    private calculateLineAndColumn(sql: string, position: number): { line: number; column: number } {
        const lines = sql.split('\n');
        let currentPosition = 0;
        let line = 1;
        let column = 1;

        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (currentPosition + lineLength > position) {
                line = i + 1;
                column = position - currentPosition + 1;
                break;
            }
            currentPosition += lineLength;
        }

        return { line, column };
    }

    /**
     * 获取简单的补全上下文（降级处理）
     */
    private getSimpleCompletionContext(sql: string, position: number): CompletionContext {
        const { line, column } = this.calculateLineAndColumn(sql, position);
        return {
            position,
            text: sql,
            line,
            column,
            contextType: CompletionContextType.NONE,
            ast: null
        };
    }

    /**
     * 在 AST 中查找指定位置的节点
     * @param ast AST 根节点
     * @param position 目标位置
     * @returns 找到的节点或 null
     */
    private findNodeAtPosition(ast: any, position: number): any {
        if (!ast || typeof ast !== 'object') {
            return null;
        }

        // 如果节点有位置信息，检查是否包含目标位置
        if (ast.start && ast.end) {
            if (position >= ast.start && position <= ast.end) {
                // 遍历子节点，找到最具体的节点
                for (const key in ast) {
                    if (key === 'start' || key === 'end' || key === 'type') {
                        continue;
                    }
                    const child = ast[key];
                    if (child && typeof child === 'object') {
                        const found = this.findNodeAtPosition(child, position);
                        if (found) {
                            return found;
                        }
                    }
                }
                return ast;
            }
        }

        // 如果没有位置信息，递归检查所有子节点
        for (const key in ast) {
            if (key === 'start' || key === 'end' || key === 'type') {
                continue;
            }
            const child = ast[key];
            if (child && typeof child === 'object') {
                const found = this.findNodeAtPosition(child, position);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * 判断是否在 SELECT 上下文中
     */
    private isInSelectContext(context: CompletionContext): boolean {
        const { text, position, ast } = context;
        if (!ast) return false;

        // 检查是否在 selectList 中
        if (ast.locations) {
            return ast.locations.some((loc: any) => 
                loc.type === 'selectList' && 
                this.isPositionInLocation(position, loc.location)
            );
        }

        // 降级处理：使用文本分析
        const textBeforeCursor = text.substring(0, position).toLowerCase();
        return textBeforeCursor.includes('select') && !textBeforeCursor.includes('from');
    }

    /**
     * 判断是否在 FROM 上下文中
     */
    private isInFromContext(context: CompletionContext): boolean {
        const { text, position, ast } = context;
        if (!ast) return false;

        // 检查是否在 FROM 子句中
        if (ast.locations) {
            return ast.locations.some((loc: any) => 
                loc.type === 'fromClause' && 
                this.isPositionInLocation(position, loc.location)
            );
        }

        // 降级处理：使用文本分析
        const textBeforeCursor = text.substring(0, position).toLowerCase();
        return textBeforeCursor.includes('from') && !textBeforeCursor.includes('where');
    }

    /**
     * 判断是否在 WHERE 上下文中
     */
    private isInWhereContext(context: CompletionContext): boolean {
        const { text, position, ast } = context;
        if (!ast) return false;

        // 检查是否在 WHERE 子句中
        if (ast.locations) {
            return ast.locations.some((loc: any) => 
                loc.type === 'whereClause' && 
                this.isPositionInLocation(position, loc.location)
            );
        }

        // 降级处理：使用文本分析
        const textBeforeCursor = text.substring(0, position).toLowerCase();
        return textBeforeCursor.includes('where');
    }

    /**
     * 判断位置是否在指定的位置范围内
     */
    private isPositionInLocation(position: number, location: any): boolean {
        const { line, column } = this.calculateLineAndColumn(location.text || '', position);
        return line >= location.first_line && 
               line <= location.last_line &&
               (line > location.first_line || column >= location.first_column) &&
               (line < location.last_line || column <= location.last_column);
    }

    /**
     * 根据上下文获取补全建议
     */
    private getCompletionItemsByContext(context: CompletionContext): CompletionItem[] {
        const items: CompletionItem[] = [];

        // 根据上下文类型返回对应的补全项
        if (this.isInSelectContext(context)) {
            // 在 SELECT 上下文中，提供列名和函数
            items.push(...this.getColumnCompletions(context.text, context.position));
            items.push(...this.getFunctionCompletions());
        } else if (this.isInFromContext(context)) {
            // 在 FROM 上下文中，只提供表名
            items.push(...this.getTableCompletions());
        } else if (this.isInWhereContext(context)) {
            // 在 WHERE 上下文中，提供列名、函数和操作符
            items.push(...this.getColumnCompletions(context.text, context.position));
            items.push(...this.getFunctionCompletions());
            items.push(...this.getOperatorCompletions());
        } else if (this.isInKeywordContext(context.text)) {
            // 在关键字上下文中，只提供关键字
            items.push(...this.getKeywordCompletions());
        } else if (this.isInFunctionContext(context.text)) {
            // 在函数上下文中，只提供函数
            items.push(...this.getFunctionCompletions());
        } else if (this.isInTableContext(context.text)) {
            // 在表名上下文中，只提供表名
            items.push(...this.getTableCompletions());
        } else {
            // 如果没有特定上下文，返回所有补全项
            items.push(
                ...this.getKeywordCompletions(),
                ...this.getFunctionCompletions(),
                ...this.getTableCompletions(),
                ...this.getColumnCompletions(context.text, context.position)
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
        const openBrackets = (text.match(/\(/g) || []).length;
        const closeBrackets = (text.match(/\)/g) || []).length;
        return openBrackets > closeBrackets;
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
    private isInColumnContext(context: CompletionContext): boolean {
        const { text, position, ast } = context;
        if (!ast) return false;
        
        // 检查是否在 SELECT 子句中
        if (ast.type === 'SELECT') {
            // 检查是否在列列表中
            return this.isInColumnList(ast, position);
        }
        
        // 检查是否在子查询中
        if (ast.type === 'SUBQUERY') {
            return this.isInColumnContext({
                ...context,
                ast: ast.select
            });
        }
        
        return false;
    }

    /**
     * 检查是否在列列表中
     */
    private isInColumnList(node: any, position: number): boolean {
        if (!node || !node.columns) return false;

        // 检查位置是否在列列表的范围内
        if (node.columns.start && node.columns.end) {
            return position >= node.columns.start && position <= node.columns.end;
        }

        // 如果没有位置信息，检查是否在 SELECT 语句中
        return node.type === 'SELECT' && !node.from;
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
        const items: CompletionItem[] = [];
        
        // 解析当前 SQL 语句
        const parseResult = this.parser.parse(sql);
        if (parseResult.success && parseResult.ast) {
            // 从 AST 中提取表名
            const tables = this.extractTablesFromAST(parseResult.ast);
            
            // 获取当前上下文
            const context = this.determineContextFromAST(parseResult.ast, position);
            
            // 根据上下文过滤列名
            tables.forEach(table => {
                if (this.context.columns[table]) {
                    this.context.columns[table].forEach(column => {
                        // 在 WHERE 子句中，优先显示可用于过滤的列
                        if (context === CompletionContextType.WHERE) {
                            items.push({
                                label: column,
                                kind: 'column',
                                detail: `表 ${table} 的列`,
                                sortText: this.isFilterableColumn(column) ? '0' + column : '1' + column
                            });
                        }
                        // 在 SELECT 子句中，优先显示常用列
                        else if (context === CompletionContextType.SELECT) {
                            items.push({
                                label: column,
                                kind: 'column',
                                detail: `表 ${table} 的列`,
                                sortText: this.isCommonColumn(column) ? '0' + column : '1' + column
                            });
                        }
                        // 其他情况正常显示
                        else {
                            items.push({
                                label: column,
                                kind: 'column',
                                detail: `表 ${table} 的列`
                            });
                        }
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
        const tables = new Set<string>();
        
        if (!ast || !ast.locations) return Array.from(tables);

        // 从 locations 中提取表名
        ast.locations.forEach((loc: any) => {
            if (loc.type === 'table' && loc.identifierChain) {
                const tableName = loc.identifierChain.map((id: any) => id.name).join('.');
                tables.add(tableName);
            }
        });

        return Array.from(tables);
    }

    /**
     * 从 AST 中确定上下文类型
     */
    private determineContextFromAST(ast: any, position: number): CompletionContextType {
        if (!ast.locations) {
            return CompletionContextType.NONE;
        }

        // 遍历所有位置信息，找到最具体的上下文
        let mostSpecificContext = CompletionContextType.NONE;
        let mostSpecificDepth = -1;

        for (const loc of ast.locations) {
            const { first_line, last_line, first_column, last_column } = loc.location;
            const { line, column } = this.calculateLineAndColumn(ast.text || '', position);

            // 检查位置是否在当前节点范围内
            if (line >= first_line && line <= last_line &&
                (line > first_line || column >= first_column) &&
                (line < last_line || column <= last_column)) {
                
                // 计算当前节点的深度
                const depth = this.calculateNodeDepth(loc);
                
                // 如果当前节点更具体（深度更大），更新上下文
                if (depth > mostSpecificDepth) {
                    mostSpecificDepth = depth;
                    mostSpecificContext = this.getContextTypeFromLocation(loc);
                }
            }
        }

        return mostSpecificContext;
    }

    /**
     * 计算节点深度
     */
    private calculateNodeDepth(node: any): number {
        let depth = 0;
        let current = node;

        while (current.parent) {
            depth++;
            current = current.parent;
        }

        return depth;
    }

    /**
     * 从位置信息获取上下文类型
     */
    private getContextTypeFromLocation(loc: any): CompletionContextType {
        switch (loc.type) {
            case 'statement':
                return CompletionContextType.NONE;
            case 'selectList':
                return CompletionContextType.SELECT;
            case 'table':
                return CompletionContextType.TABLE;
            case 'column':
                return CompletionContextType.COLUMN;
            case 'whereClause':
                return CompletionContextType.WHERE;
            case 'groupByClause':
                return CompletionContextType.GROUP_BY;
            case 'havingClause':
                return CompletionContextType.HAVING;
            case 'orderByClause':
                return CompletionContextType.ORDER_BY;
            case 'function':
                return CompletionContextType.FUNCTION;
            case 'joinClause':
                return CompletionContextType.JOIN;
            case 'onClause':
                return CompletionContextType.ON;
            case 'expression':
                return this.getExpressionContextType(loc);
            default:
                return CompletionContextType.NONE;
        }
    }

    /**
     * 获取表达式的上下文类型
     */
    private getExpressionContextType(loc: any): CompletionContextType {
        if (!loc.parent) return CompletionContextType.NONE;

        switch (loc.parent.type) {
            case 'whereClause':
                return CompletionContextType.WHERE;
            case 'havingClause':
                return CompletionContextType.HAVING;
            case 'onClause':
                return CompletionContextType.ON;
            case 'selectList':
                return CompletionContextType.SELECT;
            default:
                return CompletionContextType.NONE;
        }
    }

    /**
     * 判断是否为可过滤的列
     */
    private isFilterableColumn(column: string): boolean {
        const filterablePatterns = [
            /id$/i,
            /status$/i,
            /type$/i,
            /category$/i,
            /date$/i,
            /time$/i,
            /code$/i,
            /name$/i
        ];
        return filterablePatterns.some(pattern => pattern.test(column));
    }

    /**
     * 判断是否为常用列
     */
    private isCommonColumn(column: string): boolean {
        const commonPatterns = [
            /^id$/i,
            /name$/i,
            /title$/i,
            /description$/i,
            /status$/i,
            /created/i,
            /updated/i
        ];
        return commonPatterns.some(pattern => pattern.test(column));
    }

    /**
     * 获取操作符补全
     */
    private getOperatorCompletions(): CompletionItem[] {
        const operators = [
            '=', '>', '<', '>=', '<=', '<>', '!=',
            'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
            'IS NULL', 'IS NOT NULL'
        ];

        return operators.map(op => ({
            label: op,
            kind: 'operator',
            detail: 'SQL 操作符'
        }));
    }
} 