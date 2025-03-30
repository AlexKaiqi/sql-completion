/**
 * 格式化 SQL 语句
 * @param sql 原始 SQL 语句
 * @returns 格式化后的 SQL 语句
 */
export function formatSQL(sql: string): string {
    // 移除多余的空格
    sql = sql.trim().replace(/\s+/g, ' ');
    
    // 将关键字转换为大写
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'UPDATE', 'DELETE', 'JOIN'];
    keywords.forEach(keyword => {
        sql = sql.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), keyword);
    });
    
    return sql;
} 