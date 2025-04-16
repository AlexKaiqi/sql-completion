import { SparkSQL, EntityContextType } from 'dt-sql-parser';
import { CaretPosition, SQLContext, ContextCollector as SQLContextCollector, SQLLanguage } from '../types/context';

export class SQLContextService implements SQLContextCollector {
  private parser: SparkSQL;

  constructor() {
    this.parser = new SparkSQL();
  }

  public collect(sql: string, position: CaretPosition, language: SQLLanguage): SQLContext {
    // 获取对应语言的解析器
    if (language !== 'spark') {
      throw new Error(`不支持的SQL语言类型: ${language}`);
    }
    
    const entityContext = this.parser.getAllEntities(sql, position);
    const suggestions = this.parser.getSuggestionAtCaretPosition(sql, position);
    // 返回默认上下文对象
    return {
      keywords: suggestions?.keywords || [],
      entities: entityContext || [],
      syntax: {
        syntaxSuggestions: suggestions?.syntax || [],
      },
      scope: {
        currentDatabase: '',
        currentTable: '',
        currentColumn: '',
        currentFunction: '',
        tableAliases: new Map(),
        columnAliases: new Map()
      },
      text: {
        currentWord: '',
        currentLine: '',
        currentToken: '',
        currentTokenCase: 'mixed',
        previousToken: '',
        nextToken: ''
      }
    };
  }

  private analyzeContext(context: SQLContext, sql: string, position: CaretPosition, language: SQLLanguage): void {
    // 这里实现上下文分析逻辑
  }
} 