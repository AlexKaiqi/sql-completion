import {
  MetadataManager,
  CatalogInfo,
  DatabaseInfo,
  TableInfo,
  ColumnInfo,
  FunctionInfo
} from './metadata-protocol';

/**
 * 默认元数据管理器实现
 * 实现了 MetadataManager 接口
 */
export class DefaultMetadataManager implements MetadataManager {
  /**
   * 获取所有可用的catalog列表
   */
  listCatalogs(): CatalogInfo[] {
    return [];
  }

  /**
   * 获取指定catalog下的所有数据库
   */
  listDatabases(catalog?: string): DatabaseInfo[] {
    return [];
  }

  /**
   * 获取指定数据库下的所有表
   */
  listTables(database: string): TableInfo[] {
    return [];
  }

  /**
   * 获取指定表的所有列
   */
  listColumns(table: string, database: string): ColumnInfo[] {
    return [];
  }

  /**
   * 获取所有可用的函数
   */
  listFunctions(): FunctionInfo[] {
    return [];
  }

  /**
   * 根据名称查找catalog
   */
  findCatalog(name: string): CatalogInfo | undefined {
    return undefined;
  }

  /**
   * 根据名称查找数据库
   */
  findDatabase(name: string, catalog?: string): DatabaseInfo | undefined {
    return undefined;
  }

  /**
   * 根据名称查找表
   */
  findTable(name: string, database: string): TableInfo | undefined {
    return undefined;
  }

  /**
   * 根据名称查找列
   */
  findColumn(column: string, table: string, database: string): ColumnInfo | undefined {
    return undefined;
  }

  /**
   * 根据名称查找函数
   */
  findFunction(name: string): FunctionInfo | undefined {
    return undefined;
  }

  /**
   * 按前缀查找catalog
   */
  searchCatalogs(prefix: string): CatalogInfo[] {
    return [];
  }

  /**
   * 按前缀查找数据库
   */
  searchDatabases(prefix: string, catalog?: string): DatabaseInfo[] {
    return [];
  }

  /**
   * 按前缀查找表
   */
  searchTables(prefix: string, database: string): TableInfo[] {
    return [];
  }

  /**
   * 按前缀查找列
   */
  searchColumns(prefix: string, table: string, database: string): ColumnInfo[] {
    return [];
  }

  /**
   * 按前缀查找函数
   */
  searchFunctions(prefix: string): FunctionInfo[] {
    return [];
  }

  /**
   * 添加catalog
   */
  addCatalog(catalog: CatalogInfo): void {
    throw new Error('Method not implemented.');
  }

  /**
   * 添加数据库
   */
  addDatabase(database: DatabaseInfo): void {
    throw new Error('Method not implemented.');
  }

  /**
   * 添加表
   */
  addTable(table: TableInfo): void {
    throw new Error('Method not implemented.');
  }

  /**
   * 添加函数
   */
  addFunction(func: FunctionInfo): void {
    throw new Error('Method not implemented.');
  }
} 