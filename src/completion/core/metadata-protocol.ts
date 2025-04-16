/**
 * SQL元数据协议定义
 * 定义了SQL编辑器所需的数据库对象元数据结构和管理接口
 */

/**
 * Catalog信息接口
 * 用于描述数据目录的基本信息
 */
export interface CatalogInfo {
    /** Catalog名称 */
    name: string;
    /** Catalog类型，如：hive, iceberg, delta等，用于catalog相关补全 */
    type: string;
}

/**
 * 数据库信息接口
 * 用于描述数据库的基本信息
 */
export interface DatabaseInfo {
    /** 数据库名称 */
    name: string;
    /** 所属catalog，用于跨catalog补全 */
    catalog?: string;
    /** 数据库注释，用于提示 */
    comment?: string;
}

/**
 * 表信息接口
 * 用于描述表的基本信息和结构
 */
export interface TableInfo {
    /** 表名 */
    name: string;
    /** 表的列信息列表 */
    columns: ColumnInfo[];
    /** 表注释 */
    comment?: string;
    /** 所属数据库 */
    database?: string;
    /** 所属catalog */
    catalog?: string;
    /** 是否为视图 */
    isView?: boolean;
    /** 表类型，用于DDL补全 */
    tableType: 'MANAGED' | 'EXTERNAL' | 'VIEW' | 'MATERIALIZED_VIEW';
    /** 分区键列表，用于分区相关补全 */
    partitionKeys?: ColumnInfo[];
}

/**
 * 列信息接口
 * 用于描述列的基本信息和属性
 */
export interface ColumnInfo {
    /** 列名 */
    name: string;
    /** 列数据类型 */
    type: string;
    /** 列注释 */
    comment?: string;
    /** 所属表名 */
    table?: string;
    /** 所属数据库 */
    database?: string;
    /** 所属catalog */
    catalog?: string;
    /** 列位置，用于补全时排序 */
    position: number;
    /** 是否可为空，用于语法检查 */
    isNullable?: boolean;
    /** 默认值，用于补全时显示 */
    defaultValue?: string;
    /** 是否为分区键，用于分区相关补全 */
    isPartitionKey?: boolean;
}

/**
 * 分区信息接口
 * 用于描述表分区的详细信息
 */
export interface PartitionInfo {
    /** 表名 */
    tableName: string;
    /** 数据库名 */
    database: string;
    /** 所属catalog */
    catalog?: string;
    /** 分区键值对 */
    values: Map<string, string>;
    /** 分区存储位置 */
    location: string;
    /** 创建时间 */
    createTime?: Date;
    /** 最后访问时间 */
    lastAccessTime?: Date;
    /** 分区统计信息 */
    statistics?: {
        /** 行数 */
        numRows?: number;
        /** 总大小 */
        totalSize?: number;
        /** 原始数据大小 */
        rawDataSize?: number;
    };
}

/**
 * 函数信息接口
 * 用于描述SQL函数的基本信息和参数
 */
export interface FunctionInfo {
    /** 函数名 */
    name: string;
    /** 是否为聚合函数，用于函数补全分类 */
    isAggregate?: boolean;
    /** 是否为窗口函数，用于函数补全分类 */
    isWindow?: boolean;
    /** 函数参数列表 */
    parameters: {
        /** 参数名 */
        name: string;
        /** 参数类型 */
        type: string;
        /** 参数位置 */
        position: number;
    }[];
    /** 返回类型，用于类型检查 */
    returnType: string;
}

/**
 * 表别名信息接口
 * 用于描述SQL解析上下文中的表别名信息
 */
export interface TableAliasInfo {
    /** 别名 */
    alias: string;
    /** 原表信息 */
    table: TableInfo;
}

/**
 * 列别名信息接口
 * 用于描述SQL解析上下文中的列别名信息
 */
export interface ColumnAliasInfo {
    /** 别名 */
    alias: string;
    /** 原列信息 */
    column: ColumnInfo;
}

/**
 * 元数据管理接口
 * 定义了SQL补全场景下需要的元数据访问方法
 */
export interface MetadataManager {
    /**
     * 获取指定用户可用的catalog列表
     * @param user 用户名
     * @returns Catalog信息列表
     */
    listCatalogs(user: string): CatalogInfo[];

    /**
     * 获取指定catalog下的所有数据库
     * @param catalog 可选的catalog名称
     * @param user 用户名
     * @returns 数据库信息列表
     */
    listDatabases(catalog?: string, user?: string): DatabaseInfo[];

    /**
     * 获取指定数据库下用户有权限的所有表
     * @param database 数据库名称
     * @param user 用户名
     * @returns 表信息列表
     */
    listTables(catalog: string, database: string, user?: string): TableInfo[];

    /**
     * 获取指定表的所有列
     * @param table 表名
     * @param database 数据库名
     * @param user 用户名
     * @returns 列信息列表
     */
    listColumns(catalog: string, database: string, table: string, user?: string): ColumnInfo[];

    /**
     * 获取指定用户可用的函数
     * @param user 用户名
     * @returns 函数信息列表
     */
    listFunctions(user?: string): FunctionInfo[];

    /**
     * 根据名称查找catalog
     * @param name catalog名称
     * @returns 找到的Catalog信息，未找到则返回undefined
     */
    findCatalog(name: string): CatalogInfo | undefined;

    /**
     * 根据名称查找数据库
     * @param name 数据库名称
     * @param catalog 可选的catalog名称
     * @returns 找到的数据库信息，未找到则返回undefined
     */
    findDatabase(name: string, catalog?: string): DatabaseInfo | undefined;

    /**
     * 根据名称查找表
     * @param name 表名
     * @param database 数据库名
     * @returns 找到的表信息，未找到则返回undefined
     */
    findTable(name: string, database: string, catalog?: string): TableInfo | undefined;

    /**
     * 根据名称查找列
     * @param column 列名
     * @param table 表名
     * @param database 数据库名
     * @returns 找到的列信息，未找到则返回undefined
     */
    findColumn(column: string, table: string, database: string, catalog?: string): ColumnInfo | undefined;

    /**
     * 根据名称查找函数
     * @param name 函数名
     * @returns 找到的函数信息，未找到则返回undefined
     */
    findFunction(name: string): FunctionInfo | undefined;

    /**
     * 按前缀查找catalog
     * @param prefix 前缀字符串
     * @returns 匹配的Catalog信息列表
     */
    searchCatalogs(prefix: string): CatalogInfo[];

    /**
     * 按前缀查找数据库
     * @param prefix 前缀字符串
     * @param catalog 可选的catalog名称
     * @returns 匹配的数据库信息列表
     */
    searchDatabases(prefix: string, catalog?: string): DatabaseInfo[];

    /**
     * 按前缀查找表
     * @param prefix 前缀字符串
     * @param database 数据库名
     * @param catalog 可选的catalog名称
     * @returns 匹配的表信息列表
     */
    searchTables(prefix: string, database: string, catalog?: string): TableInfo[];

    /**
     * 按前缀查找列
     * @param prefix 前缀字符串
     * @param table 表名
     * @param database 数据库名
     * @param catalog 可选的catalog名称
     * @returns 匹配的列信息列表
     */
    searchColumns(prefix: string, table: string, database: string, catalog?: string): ColumnInfo[];

    /**
     * 按前缀查找函数
     * @param prefix 前缀字符串
     * @returns 匹配的函数信息列表
     */
    searchFunctions(prefix: string): FunctionInfo[];
} 