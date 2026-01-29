import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import fs from 'fs';

export const dbConfig: any = {
    assemblyFile: 'public/sqlite/sql-wasm.wasm',
    dataFile: 'public/sqlite/database.sqlite'
}

// initSqlJs returns a Promise
initSqlJs({ locateFile: (file: string) => dbConfig.assemblyFile }).then((SQL) => {
  const db: Database = new SQL.Database();
  
  const CreateTableQuery: string = "CREATE TABLE projects ( lat INTEGER, lon INTEGER, title TEXT, text TEXT, img TEXT );";
  const CreateDataQuery: string = `INSERT INTO projects VALUES 
  (5, 5, 'Unity Development', 'Completed a unity junior developer course...', 'assets/images/Unity_Country.png'), 
  (30, 60, 'Bravura Solutions', 'Work on maintaining...', 'assets/images/Bravura_Country.png'), 
  (-30, 120, 'Website Development', 'Developed this dynamic website...', 'assets/images/Angular_Country.png'), 
  (10, 200, 'University', 'Completed a bachelor...', 'assets/images/Usyd_Country.png');`;

  db.exec(CreateTableQuery);
  db.exec(CreateDataQuery);

  const binary = db.export();
  const buffer = Buffer.from(binary);
  fs.writeFileSync(dbConfig.dataFile, buffer);

  console.log("Database created and written to " + dbConfig.dataFile + ".");
}).catch(err => console.error(err));