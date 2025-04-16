import { EntityContext, EntityContextType, WordRange, StmtContextType, SyntaxSuggestion } from "dt-sql-parser";

/**
 * SQL语言类型
 */
export type SQLLanguage = 'mysql' | 'postgresql' | 'hive' | 'spark' | 'trino' | 'impala';

/**
 * 光标位置接口
 */
export interface CaretPosition {
  lineNumber: number;  // 行号，从1开始
  column: number;      // 列号，从0开始
}

/**
 * SQL上下文接口
 */
export interface SQLContext {
  keywords: string[] | undefined;
  entities: EntityContext[] | undefined;
  // 1. 语法结构特征
  syntax: {
    syntaxSuggestions: SyntaxSuggestion[];
  };

  // 2. 作用域特征
  scope: {
    currentDatabase: string;      // 当前数据库
    currentTable: string;         // 当前表
    currentColumn: string;        // 当前列
    currentFunction: string;      // 当前函数
    tableAliases: Map<string, string>;    // 表别名
    columnAliases: Map<string, string>;   // 列别名
  };

  // 3. 文本特征
  text: {
    currentWord: string;        // 当前单词
    currentLine: string;        // 当前行
    currentToken: string;       // 当前token
    currentTokenCase: 'upper' | 'lower' | 'mixed';  // 大小写
    previousToken: string;      // 前一个token
    nextToken: string;         // 后一个token
  };
}

/**
 * 上下文收集器接口
 */
export interface ContextCollector {
  collect(sql: string, position: CaretPosition, language: SQLLanguage): SQLContext;
} 