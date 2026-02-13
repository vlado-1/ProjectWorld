import { Injectable } from '@angular/core';
import { dbConfig } from '../../core/Constants/db';
import type { Database } from 'sql.js';

@Injectable({
  providedIn: 'root',
})
export class SqliteDb {
  
  private db: Promise<Database> | null = null;

  private getProjectsQuery: string = 'SELECT * FROM projects';

  constructor() {
    async function loadSqlJsFromCdn(): Promise<any> {
      if ((window as any).initSqlJs) return (window as any).initSqlJs;
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js';
        s.onload = () => resolve(null);
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });
      return (window as any).initSqlJs;
    }

    async function loadDB(): Promise<Database> {
      const initSqlJs = await loadSqlJsFromCdn();
      const SQL = await initSqlJs({ locateFile: () => dbConfig.assemblyFile });

      // Try to load an existing DB file from assets
      const response = await fetch(dbConfig.dataFile);
      if (response.ok) {
        const data = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(data));
        return db;
      }
      // file missing → create a new DB
      return new SQL.Database();
    }

    this.db = loadDB();
  }

  /* TO DO: Create data and test this query. */
  async getProjects(): Promise<any[]> {
    if (this.db != null) {
      const ldb = await this.db;
      const result = ldb.exec(this.getProjectsQuery);
      return result;
    }
    return [];
  }

}
