interface ColumnInfo {
    name: string;
    type: string;
    comment?: string;
}

interface TableInfo {
    name: string;
    columns: ColumnInfo[];
    comment?: string;
}

export class MetadataManager {
    private tables: Map<string, TableInfo> = new Map();

    // 添加表信息
    addTable(tableInfo: TableInfo) {
        this.tables.set(tableInfo.name, tableInfo);
    }

    // 获取表信息
    getTable(tableName: string): TableInfo | undefined {
        return this.tables.get(tableName);
    }

    // 获取所有表名
    getAllTableNames(): string[] {
        return Array.from(this.tables.keys());
    }

    // 获取表的列信息
    getTableColumns(tableName: string): ColumnInfo[] {
        return this.tables.get(tableName)?.columns || [];
    }

    // 获取列名列表
    getColumnNames(tableName: string): string[] {
        return this.getTableColumns(tableName).map(col => col.name);
    }

    // 清除所有元数据
    clear() {
        this.tables.clear();
    }
} 