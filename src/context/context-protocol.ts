import { FunctionInfo, TableInfo, ColumnInfo, DatabaseInfo } from "../completion/core/metadata-protocol";

/**
 * 光标位置接口
 */
export interface CaretPosition {
  lineNumber: number;  // 行号
  column: number;      // 列号
}

/**
 * SQL上下文接口
 * 用于收集特定位置的上下文信息，帮助推断当前位置的补全建议
 */
export interface SQLContext {
  // 1. 语法结构特征
  syntax: {
    clauseType: string;          // SELECT, FROM, WHERE等
    positionType: string;        // COLUMN, KEYWORD, OPERATOR等
    isInSubquery: boolean;       // 是否在子查询中
    isInJoin: boolean;          // 是否在JOIN中
    isInWhere: boolean;         // 是否在WHERE中
    isInGroupBy: boolean;       // 是否在GROUP BY中
    isInOrderBy: boolean;       // 是否在ORDER BY中
    isInHaving: boolean;        // 是否在HAVING中
  };

  // 2. 作用域特征
  scope: {
    availableDatabases: DatabaseInfo; // 可访问的库
    availableTables: TableInfo[];      // 可访问的表
    availableColumns: ColumnInfo[];     // 可访问的列
    availableFunctions: FunctionInfo[];   // 可访问的函数
    currentDatabase: DatabaseInfo;      // 当前数据库
    currentTable: TableInfo;            // 当前表
    currentColumn: ColumnInfo;          // 当前列
    currentFunction: FunctionInfo;      // 当前函数
    tableAliases: Map<string, string>;    // 表别名
    columnAliases: Map<string, string>;   // 列别名
  };

  // 3. 文本特征
  text: {
    currentWord: string;        // 当前单词
    currentLine: string;        // 当前行
    currentToken: string;        // 当前token
    currentTokenCase: 'upper' | 'lower' | 'mixed';  // 大小写
    previousToken: string;       // 前一个token
    nextToken: string;          // 后一个token
  };
}

/**
 * 上下文收集器接口
 * 用于从SQL语句和光标位置收集上下文信息
 */
export interface SQLContextCollector {
  /**
   * 收集指定位置的上下文信息
   * @param sql SQL语句
   * @param position 光标位置
   * @returns 上下文信息
   */
  collect(sql: string, position: CaretPosition): SQLContext;
}