export interface ColumnInfo {
    name: string;
    type: string;
    comment?: string;
}

export interface TableInfo {
    name: string;
    columns: ColumnInfo[];
    comment?: string;
    database?: string;
}

export interface DatabaseInfo {
    name: string;
    tables: Map<string, TableInfo>;
}

export class MetadataManager {
    private tables: Map<string, TableInfo> = new Map();
    private databases: Map<string, DatabaseInfo> = new Map();

    // 添加表信息
    addTable(tableInfo: TableInfo) {
        this.tables.set(tableInfo.name, tableInfo);
        if (!this.databases.has(tableInfo.database || '')) {
            this.databases.set(tableInfo.database || '', { name: tableInfo.database || '', tables: new Map() });
        }
        this.databases.get(tableInfo.database || '')?.tables.set(tableInfo.name, tableInfo);
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
        this.databases.clear();
    }

    getTablesByDatabase(database: string): string[] {
        return Array.from(this.databases.get(database)?.tables.keys() || []);
    }

    getAllDatabaseNames(): string[] {
        return Array.from(this.databases.keys());
    }
} 