import { CaretPosition } from '../types/context';

/**
 * SQL可视化工具类
 * 用于将SQL语句和光标位置转换为可视化格式，方便日志展示
 */
export class SQLVisualizer {
  /**
   * 将SQL语句和光标位置转换为可视化格式
   * 在光标位置插入|符号，方便在日志中查看光标位置
   * 
   * @param sql SQL语句
   * @param position 光标位置（行号和列号都从1开始）
   * @returns 带有光标标记的SQL语句
   */
  public static visualizeCursorPosition(sql: string, position: CaretPosition): string {
    if (!sql || !position) {
      return sql;
    }

    // 将SQL按行分割
    const lines = sql.split('\n');
    
    // 如果行号超出范围，直接返回原始SQL
    if (position.lineNumber > lines.length || position.lineNumber < 1) {
      return sql;
    }
    
    const lineIndex = position.lineNumber - 1; // 转换为0索引
    
    // 确保列号在有效范围内（列号从1开始）
    const column = Math.min(Math.max(1, position.column), lines[lineIndex].length + 1);
    
    // 在光标位置插入|符号
    const line = lines[lineIndex];
    const beforeCursor = line.substring(0, column - 1);
    const afterCursor = line.substring(column - 1);
    lines[lineIndex] = `${beforeCursor}|${afterCursor}`;
    
    // 重新组合SQL
    return lines.join('\n');
  }

  /**
   * 格式化SQL语句，添加行号和光标位置
   * 
   * @param sql SQL语句
   * @param position 光标位置（行号和列号都从1开始）
   * @returns 格式化后的SQL语句，包含行号和光标位置
   */
  public static formatSQLWithLineNumbers(sql: string, position: CaretPosition): string {
    if (!sql) {
      return '';
    }

    const lines = sql.split('\n');
    const formattedLines = lines.map((line, index) => {
      const lineNumber = index + 1;
      const isCursorLine = lineNumber === position.lineNumber && lineNumber <= lines.length;
      
      if (isCursorLine) {
        const column = Math.min(Math.max(1, position.column), line.length + 1);
        const beforeCursor = line.substring(0, column - 1);
        const afterCursor = line.substring(column - 1);
        return `${lineNumber.toString().padStart(3, ' ')} | ${beforeCursor}|${afterCursor}`;
      } else {
        return `${lineNumber.toString().padStart(3, ' ')} | ${line}`;
      }
    });

    return formattedLines.join('\n');
  }
} 