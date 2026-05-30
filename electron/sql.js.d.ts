declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string, params?: unknown[]): { columns: string[]; values: unknown[][] }[];
    export(): Uint8Array;
  }
  export interface SqlJsConfig {
    locateFile?: (filename: string) => string;
  }
  export default function initSqlJs(config?: SqlJsConfig): Promise<{ Database: new (data?: Uint8Array) => Database }>;
}
