import { SQLContext } from "../../context/context-protocol";
import { Rule, RuleAction, RuleCondition, RuleType } from "./rule-protocol";

export class KeywordRule implements Rule {
    id = 'keyword-basic';
    type = RuleType.Keyword;
    name = 'Basic Keyword Rule';
    description = '提供基本SQL关键字补全';
    priority = 100;
    enabled = true;

    condition: RuleCondition = {
        evaluate: (context: SQLContext) => {
            return true;
        }
    };

    action: RuleAction = {
        execute: (context: SQLContext) => {
            return [];
        }
    };
}