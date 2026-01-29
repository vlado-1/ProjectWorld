import { Injectable } from '@angular/core';
import sqlInitJS, { Database } from 'sql.js';
import { dbConfig } from '../../core/Constants/db';

@Injectable({
  providedIn: 'root',
})
export class SqliteDb {
  
  private db: Database | null = null;

  private getProjectsQuery: string = 'SELECT * FROM projects';

  constructor() {
    async function loadDB(): Promise<void> {
      sqlInitJS({ locateFile: () => dbConfig.assemblyFile }).then(async (SQL: any) => {
      // Try to load an existing DB file from assets
      try {
        const resp = await fetch(dbConfig.dataFile);
        if (resp.ok) {
          const ab = await resp.arrayBuffer();
          this.db = new SQL.Database(new Uint8Array(ab));
        } else {
          // file missing → create a new DB
          this.db = new SQL.Database();
          // optionally create table + seed data here
        }
        console.log("Database loaded successfully.");
      } catch (err) {
        console.error('Could not load DB file, creating a new one', err);
        this.db = new SQL.Database();
      }
    }).catch(err => console.error('sql.js init error', err));
    }
    await loadDB.call(this);
  }

  /* TO DO: Create data and test this query. */
  getProjects(): any[] {
    if (this.db) {
      return this.db.exec(this.getProjectsQuery);
    }
    return [];
  }

}
