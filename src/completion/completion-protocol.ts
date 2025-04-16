/**
 * SQL补全建议协议定义
 */

import { SQLContext } from "../context/context-protocol";

/**
 * 光标位置接口
 */
export interface CaretPosition {
    lineNumber: number;  // 行号, 从1开始
    column: number;      // 列号, 从0开始
}

/**
 * SQL补全建议项接口
 */
export interface CompletionItem {
    /**
     * 补全列表中显示的文本
     * 示例: 
     * - "SELECT" (关键字)
     * - "users" (表名)
     * - "COUNT(*)" (函数)
     */
    label: string;

    /**
     * 建议项的类型
     * 示例: 
     * - SuggestionKind.Keyword (关键字)
     * - SuggestionKind.Table (表名)
     * - SuggestionKind.Function (函数)
     */
    kind: CompletionKind;

    /**
     * 替换到编辑器中的文本
     * 示例: 
     * - "SELECT " (自动添加空格)
     * - "users" (表名)
     * - "COUNT(*)" (函数)
     * - "SELECT * FROM ${1:table} WHERE ${2:condition}" (带占位符)
     */
    replaceText: string;

    /**
     * 替换范围，用于替换已有的文本
     * 示例: 将 "SEL" 替换为 "SELECT"
     * 原则: 最少替换，尽可能少的替换
     */
    range?: {
        start: CaretPosition;
        end: CaretPosition;
        /**
         * 光标位置
         * 示例: 
         * - { lineNumber: 1, column: 1 } (行号1，列号1)
         */
        position: CaretPosition;
    };

    /**
     * 排序文本
     * 示例: 
     * - "100SELECFT" (关键字)
     * - "200users" (表名)
     * - "300sum()" (函数)
     */
    sortText?: string;

    /**
     * 补全建议的详细信息
     * 示例: 
     * - "SELECT * FROM users" (完整的SELECT语句)
     * - "SELECT COUNT(*) FROM users" (带注释的SELECT语句)
     */
    detail?: string;
}

/**
 * SQL补全建议类型枚举
 * 用于标识不同类型的补全建议，影响建议的显示样式和排序
 */
export enum CompletionKind {
    // 基础类型
    Keyword = 'keyword',           // 关键字，如 SELECT, FROM, WHERE
    Operator = 'operator',         // 操作符，如 =, >, <, IN, LIKE
    Clause = 'clause',            // 子句，如 GROUP BY, ORDER BY, HAVING
    DataType = 'dataType',        // 数据类型，如 INT, VARCHAR, DATE
    Variable = 'variable',        // 变量，如 @var, :param
    Parameter = 'parameter',      // 参数，如 ? 或命名参数
    Snippet = 'snippet',          // 代码片段，如完整的 SELECT 语句模板

    // 数据库对象
    Database = 'database',        // 数据库，如 mydb, testdb
    Schema = 'schema',           // 模式，如 public, dbo
    Table = 'table',             // 表，如 users, orders
    View = 'view',               // 视图，如 user_view, order_summary
    Column = 'column',           // 列，如 id, name, created_at
    Function = 'function',       // 函数，如 COUNT, SUM, MAX

    // 别名
    TableAlias = 'tableAlias',             // 表别名，如 u, o
    ColumnAlias = 'columnAlias',           // 列别名，如 user_id, order_date
}

/**
 * SQL补全建议提供者接口
 */
export interface SuggestionProvider {
    /**
     * 获取指定位置的补全建议
     * @param sql SQL语句
     * @param position 光标位置
     * @param context 上下文信息
     * @returns 补全建议列表
     */
    getSuggestions(sqlContext: SQLContext): CompletionItem[];
}