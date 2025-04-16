import { SQLContext } from "../../context/context-protocol";
import { Rule, RuleAction, RuleCondition, RuleType } from "./rule-protocol";

export class ColumnRule implements Rule {
    id = 'column-basic';
    type = RuleType.Column;
    name = 'Basic Column Rule';
    description = '提供表列名补全';
    priority = 90;
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