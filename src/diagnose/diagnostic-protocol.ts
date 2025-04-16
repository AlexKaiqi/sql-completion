/**
 * SQL诊断协议定义
 * 定义了SQL编辑器中的语法和语义诊断功能
 */

import { SQLContext } from "../context/context-protocol";

/**
 * 诊断信息接口
 * 定义了SQL语句中的错误、警告等信息
 */
export interface Diagnostic {
  /**
   * 诊断范围
   * 定义了诊断信息在SQL语句中的位置
   */
  range: {
    /** 起始位置 */
    start: {
      /** 行号 */
      line: number;
      /** 列号 */
      character: number
    };
    /** 结束位置 */
    end: {
      /** 行号 */
      line: number;
      /** 列号 */
      character: number
    };
  };

  /**
   * 诊断严重程度
   * 定义了诊断信息的严重程度级别
   */
  severity: DiagnosticSeverity;

  /**
   * 诊断代码
   * 用于标识具体的诊断类型
   */
  code?: SQLDiagnosticCode;

  /**
   * 诊断来源
   * 标识产生诊断信息的组件或模块
   */
  source?: string;

  /**
   * 诊断消息
   * 描述具体的诊断信息
   */
  message: string;
}

/**
 * 诊断严重程度枚举
 * 定义了不同级别的诊断信息
 */
export enum DiagnosticSeverity {
  /** 错误级别，表示严重问题 */
  Error = 1,
  /** 警告级别，表示潜在问题 */
  Warning = 2,
  /** 信息级别，表示提示信息 */
  Information = 3,
  /** 提示级别，表示建议信息 */
  Hint = 4,
}

/**
 * SQL诊断错误代码枚举
 * 定义了常见的SQL错误类型
 */
export enum SQLDiagnosticCode {
  // 语法错误 (1000-1999)
  /** 语法错误 */
  SYNTAX_ERROR = 1000,
  /** 缺少关键字 */
  MISSING_KEYWORD = 1001,
  /** 意外的标记 */
  UNEXPECTED_TOKEN = 1002,

  // 语义错误 (2000-2999)
  /** 表不存在 */
  TABLE_NOT_FOUND = 2000,
  /** 列不存在 */
  COLUMN_NOT_FOUND = 2001,
  /** 列名歧义 */
  AMBIGUOUS_COLUMN = 2002,
  /** 类型不匹配 */
  TYPE_MISMATCH = 2003,
}

/**
 * 诊断结果接口
 * 定义了诊断功能的返回结果
 */
export interface DiagnosticResult {
  /**
   * 诊断信息列表
   * 包含所有发现的诊断信息
   */
  diagnostics: Diagnostic[];

  /**
   * 诊断提供者ID
   * 标识产生诊断结果的提供者
   */
  providerId?: string;

  /**
   * 诊断时间戳
   * 记录诊断执行的时间
   */
  timestamp?: number;
} 