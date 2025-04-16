import { CompletionItem } from "../completion-protocol";
import { SQLContext } from "../../context/context-protocol";
import { Rule, RuleType } from "./rule-protocol";

export class RuleEngine {
    private rules: Map<RuleType, Rule[]> = new Map();
    // 不同类型规则的默认优先级
    private defaultPriorities: Map<RuleType, number> = new Map([
        [RuleType.Keyword, 100],    // 关键字优先级最高
        [RuleType.Table, 90],       // 表名次之
        [RuleType.Column, 80],      // 列名再次之
        [RuleType.Function, 70],    // 函数最后
    ]);

    // 获取规则优先级
    getPriority(rule: Rule): number {
        return rule.priority || this.defaultPriorities.get(rule.type) || 0;
    }
    
    // 注册规则
    registerRule(rule: Rule) {
        if (!this.rules.has(rule.type)) {
            this.rules.set(rule.type, []);
        }
        this.rules.get(rule.type)!.push(rule);
    }

    // 按类型获取规则
    getRulesByType(type: RuleType): Rule[] {
        return this.rules.get(type) || [];
    }

    // 应用规则
    applyRules(context: SQLContext): CompletionItem[] {
        const items: CompletionItem[] = [];
        
        // 按类型顺序执行规则
        const ruleTypes = [
            RuleType.Keyword,    // 先执行关键字规则
            RuleType.Table,      // 再执行表名规则
            RuleType.Column,     // 再执行列名规则
            RuleType.Function    // 最后执行函数规则
        ];

        for (const type of ruleTypes) {
            const rules = this.getRulesByType(type);
            for (const rule of rules) {
                if (rule.enabled && rule.condition.evaluate(context)) {
                    items.push(...rule.action.execute(context));
                }
            }
        }

        return items;
    }
}