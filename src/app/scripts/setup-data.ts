import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import fs from 'fs';

/* dbconfig src/core/constants file is .ts and cannot be imported
   so need to hardcode it here. Double check these values are the same
   as in constants files, as they could potentially go out of sync if not careful. */
export const dbConfig: any = {
    assemblyFile: 'public/assets/sqlite/sql-wasm.wasm',
    dataFile: 'public/assets/sqlite/database.sqlite'
}

// initSqlJs returns a Promise
initSqlJs({ locateFile: (file: string) => dbConfig.assemblyFile }).then((SQL) => {
  const db: Database = new SQL.Database();
  
  const CreateTableQuery: string = "CREATE TABLE projects ( lat INTEGER, lon INTEGER, title TEXT, text TEXT, img TEXT );";
  const CreateDataQuery: string = `INSERT INTO projects VALUES 
      ( 5, 5, 'Unity Development', 'Completed a unity junior developer course, and developed some beginner level games using the Unity Game Engine.', 'assets/images/Unity_Country.png' ),
      ( 30, 60, 'Bravura Solutions', 'Work on maintaining and enhancing a desktop application for funds administration.', 'assets/images/Bravura_Country.png' ),
      ( -30, 120, 'Website Development', 'Developed this dynamic website using Angular and SQLite.', 'assets/images/Angular_Country.png' ),
      ( 10, 200, 'University', 'Completed a bachelor and masters degree majoring in computer science and software development respectively.', 'assets/images/Usyd_Country.png' );
`;
  db.exec(CreateTableQuery);
  db.exec(CreateDataQuery);

  const binary = db.export();
  const buffer = Buffer.from(binary);
  fs.writeFileSync(dbConfig.dataFile, buffer);

  console.log("Database created and written to " + dbConfig.dataFile + ".");
}).catch(err => console.error(err));