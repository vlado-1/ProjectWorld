import { Injectable } from '@angular/core';
import sqlInitJS, { Database } from 'sql.js';
import { dbConfig } from '../../core/Constants/db';

@Injectable({
  providedIn: 'root',
})
export class SqliteDb {
  
  private db: Promise<Database> | null = null;

  private getProjectsQuery: string = 'SELECT * FROM projects';

  constructor() {
    async function loadDB(): Promise<Database> {
      const SQL = await sqlInitJS({ locateFile: () => dbConfig.assemblyFile });
      
        // Try to load an existing DB file from assets
      const response = await fetch(dbConfig.dataFile);
      if (response.ok) {
        const data = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(data));
        return db;
      } 
      // file missing → create a new DB
      return new SQL.Database();
      // optionally create table + seed data here
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
