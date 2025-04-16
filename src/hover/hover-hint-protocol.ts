/**
 * SQL悬停提示协议定义
 * 定义了SQL编辑器中的悬停提示功能
 */

import { CaretPosition, SQLContext } from "../context/context-protocol";

/**
 * 悬停提示接口
 * 定义了鼠标悬停时显示的提示信息
 */
export interface Hover {
  /**
   * 悬停提示内容
   * 可以是简单文本或Markdown格式
   * 示例：
   * - 简单文本：'这是一个表'
   * - Markdown：'# 表名\n这是一个用户表'
   */
  contents: string;

  /**
   * 悬停提示的文本范围
   * 定义了提示信息对应的SQL文本范围
   */
  range?: {
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
}

/**
 * 标记字符串接口
 * 用于定义带有语言标识的代码片段
 */
export interface MarkedString {
  /**
   * 语言标识
   * 用于语法高亮，如：'sql', 'markdown'等
   */
  language: string;

  /**
   * 字符串内容
   * 实际的代码或文本内容
   */
  value: string;
}

/**
 * 悬停提示提供者接口
 * 定义了获取悬停提示信息的方法
 */
export interface HoverProvider {
  /**
   * 获取指定位置的悬停提示信息
   * @param sql SQL语句
   * @param position 光标位置
   * @param context 上下文信息
   * @returns 悬停提示信息
   */
  getHover(sql: string, position: CaretPosition, context: SQLContext): Hover;
} 