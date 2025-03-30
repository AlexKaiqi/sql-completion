import { Parser } from 'node-sql-parser';
import { SQLParserResult } from '../types/sql';

export class SQLParserService {
    private parser: Parser;

    constructor() {
        this.parser = new Parser();
    }

    /**
     * 解析 SQL 语句
     * @param sql SQL 语句
     * @returns 解析后的 AST
     */
    public parse(sql: string): SQLParserResult {
        try {
            const ast = this.parser.astify(sql);
            return {
                success: true,
                ast
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }

    /**
     * 将 AST 转换回 SQL 语句
     * @param ast AST 对象
     * @returns SQL 语句
     */
    public stringify(ast: any): string {
        return this.parser.sqlify(ast);
    }
} 