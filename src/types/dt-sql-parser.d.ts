declare module 'dt-sql-parser' {
    export class Parser {
        parse(sql: string): any;
        stringify(ast: any): string;
    }
} 