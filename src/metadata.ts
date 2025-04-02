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

interface Table {
    name: string;
    database: string;
    columns: ColumnInfo[];
}

interface View {
    name: string;
    database: string;
    columns: ColumnInfo[];
    isView: boolean;
}

export class MetadataManager {
    private tables: Map<string, Table> = new Map();
    private views: Map<string, View> = new Map();
    private databases: Map<string, DatabaseInfo> = new Map();

    // 添加表信息
    addTable(tableInfo: TableInfo) {
        this.tables.set(tableInfo.name, { name: tableInfo.name, database: tableInfo.database || '', columns: tableInfo.columns });
        if (!this.databases.has(tableInfo.database || '')) {
            this.databases.set(tableInfo.database || '', { name: tableInfo.database || '', tables: new Map() });
        }
        this.databases.get(tableInfo.database || '')?.tables.set(tableInfo.name, tableInfo);
    }

    // 获取表信息
    getTable(tableName: string): Table | undefined {
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
        this.views.clear();
    }

    getTablesByDatabase(database: string): string[] {
        return Array.from(this.databases.get(database)?.tables.keys() || []);
    }

    getAllDatabaseNames(): string[] {
        return Array.from(this.databases.keys());
    }

    addView(view: View): void {
        const key = `${view.database}.${view.name}`;
        this.views.set(key, view);
    }

    getView(name: string): View | undefined {
        return this.views.get(name);
    }

    getAllViews(): View[] {
        return Array.from(this.views.values());
    }

    // 获取数据库信息
    getDatabase(databaseName: string): DatabaseInfo | undefined {
        return this.databases.get(databaseName);
    }
} 