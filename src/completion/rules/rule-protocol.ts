/**
 * SQL规则协议定义
 * 定义了SQL编辑器中的补全规则系统
 */

import { CompletionItem } from "../completion-protocol";
import { SQLContext } from "../../context/context-protocol";

/**
 * 规则类型枚举
 * 定义了不同类型的SQL补全规则
 */
export enum RuleType {
    // 基础规则类型
    /** 关键字规则，用于补全SQL关键字 */
    Keyword = 'keyword',
    /** 表名规则，用于补全表名 */
    Table = 'table',
    /** 列名规则，用于补全列名 */
    Column = 'column',
    /** 函数规则，用于补全函数名 */
    Function = 'function',
    /** 模式规则，用于补全数据库模式 */
    Schema = 'schema',

    // 组合规则类型
    /** JOIN规则，用于补全JOIN相关语法 */
    Join = 'join',
    /** WHERE规则，用于补全WHERE子句 */
    Where = 'where',
    /** GROUP BY规则，用于补全分组子句 */
    GroupBy = 'groupBy',
    /** ORDER BY规则，用于补全排序子句 */
    OrderBy = 'orderBy',

    // 智能规则类型
    /** 智能列名规则，基于上下文智能推荐列名 */
    SmartColumn = 'smartColumn',
    /** 智能表名规则，基于上下文智能推荐表名 */
    SmartTable = 'smartTable',
    /** 智能JOIN规则，基于上下文智能推荐JOIN条件 */
    SmartJoin = 'smartJoin'
}

/**
 * 规则条件接口
 * 定义了规则触发的条件判断逻辑
 */
export interface RuleCondition {
    /**
     * 评估规则条件
     * @param context SQL上下文信息
     * @returns 是否满足条件
     */
    evaluate(context: SQLContext): boolean;
}

/**
 * 规则动作接口
 * 定义了规则触发后执行的动作
 */
export interface RuleAction {
    /**
     * 执行规则动作
     * @param context SQL上下文信息
     * @returns 补全建议列表
     */
    execute(context: SQLContext): CompletionItem[];
}

/**
 * 规则定义接口
 * 定义了完整的规则结构
 */
export interface Rule {
    /** 规则唯一标识符 */
    id: string;
    /** 规则类型 */
    type: RuleType;
    /** 规则名称 */
    name: string;
    /** 规则描述 */
    description: string;
    /** 规则触发条件 */
    condition: RuleCondition;
    /** 规则执行动作 */
    action: RuleAction;
    /** 规则优先级，数字越小优先级越高 */
    priority: number;
    /** 规则是否启用 */
    enabled: boolean;
}