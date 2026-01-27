import { Injectable } from '@angular/core';
import sqlInitJS, { Database } from 'sql.js';
import { dbConfig } from '../../core/Constants/db';

@Injectable({
  providedIn: 'root',
})
export class SqliteDb {
  
  private SQL: any;
  private db: Database;

  private getProjectsQuery: string = 'SELECT * FROM projects';

  constructor() {
    this.SQL = sqlInitJS({ locateFile: (file: string) => dbConfig.assemblyFile });
    this.db = new this.SQL.Database(dbConfig.dataFile);
  }

  /* TO DO: Create data and test this query. */
  getProjects(): any[] {
    return this.db.exec(this.getProjectsQuery);
  }

}
