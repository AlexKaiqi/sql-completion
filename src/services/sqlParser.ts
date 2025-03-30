import { CodeCompletionCore } from 'antlr4-c3';
const { parser } = require('dt-sql-parser');

export interface SQLParserResult {
    success: boolean;
    error?: string;
    ast: any;
    suggestions?: {
        keywords: string[];
        rules: string[];
    };
}

export class SQLParserService {
    private parser: any;

    constructor() {
        this.parser = parser;
    }

    /**
     * 解析 SQL 语句并获取补全建议
     * @param sql SQL 语句
     * @param position 光标位置
     * @returns 解析结果和补全建议
     */
    public parse(sql: string, position?: number): SQLParserResult {
        try {
            // 使用 parserSql 方法进行解析
            const ast = this.parser.parserSql(sql, 'flink');
            if (!ast) {
                throw new Error('解析失败');
            }

            // 如果提供了位置信息，获取补全建议
            let suggestions;
            if (position !== undefined) {
                suggestions = this.getSuggestions(sql, position, ast);
            }

            // 确保 AST 包含必要的信息
            return {
                success: true,
                ast: {
                    text: sql,
                    locations: ast.locations || [],
                    type: ast.type || 'statement',
                    children: ast.children || [],
                    ...ast
                },
                suggestions
            };
        } catch (error: any) {
            // 如果解析失败，返回一个基本的 AST
            return {
                success: false,
                error: error.message || '未知错误',
                ast: {
                    text: sql,
                    locations: [],
                    type: 'statement',
                    children: []
                }
            };
        }
    }

    /**
     * 获取补全建议
     */
    private getSuggestions(sql: string, position: number, ast: any) {
        try {
            const { line, column } = this.calculateLineAndColumn(sql, position);
            const currentLocation = this.findLocationAtPosition(ast, line, column);

            const rules: string[] = [];
            const keywords: string[] = [];

            // 从 AST 中提取建议
            if (currentLocation) {
                // 根据位置类型添加规则
                switch (currentLocation.type) {
                    case 'selectList':
                        rules.push('column', 'function');
                        break;
                    case 'fromClause':
                        rules.push('table');
                        break;
                    case 'whereClause':
                        rules.push('column', 'function', 'expression');
                        break;
                    case 'table':
                        rules.push('table');
                        break;
                    case 'column':
                        rules.push('column');
                        break;
                    case 'function':
                        rules.push('function');
                        break;
                }
            }

            // 从 AST 中提取关键字建议
            if (ast.suggestKeywords) {
                keywords.push(...ast.suggestKeywords.map((k: any) => k.value));
            }

            return { keywords, rules };
        } catch (error) {
            console.error('获取补全建议失败:', error);
            return { keywords: [], rules: [] };
        }
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
     * 在 AST 中查找指定位置的节点
     */
    private findLocationAtPosition(ast: any, line: number, column: number): any {
        if (!ast || !ast.locations) {
            return null;
        }

        // 遍历所有位置信息找到包含当前位置的节点
        for (const loc of ast.locations) {
            const { first_line, last_line, first_column, last_column } = loc.location;
            if (line >= first_line && line <= last_line &&
                (line > first_line || column >= first_column) &&
                (line < last_line || column <= last_column)) {
                return loc;
            }
        }

        return null;
    }

    /**
     * 将 AST 转换回 SQL 语句
     * @param ast AST 对象
     * @returns SQL 语句
     */
    public stringify(ast: any): string {
        if (!ast) return '';
        return ast.text || '';  // 返回 AST 中的文本，如果没有则返回空字符串
    }
} 