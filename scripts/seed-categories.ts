import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

const dbPath = path.join(process.cwd(), "dev.db");
const db = new Database(dbPath);

const categories = [
  { name: "비트 시황", color: "orange" },
  { name: "나스닥 시황", color: "blue" },
  { name: "골드 시황", color: "yellow" },
  { name: "매매기법", color: "violet" },
  { name: "매매기법(현강)", color: "purple" },
  { name: "매매기법(리메이크)", color: "fuchsia" },
  { name: "실력 입증", color: "emerald" },
  { name: "정보성", color: "slate" },
  { name: "인사이트", color: "cyan" },
  { name: "삼시세끼", color: "pink" },
  { name: "모음집", color: "indigo" },
  { name: "팟캐스트", color: "rose" },
];

const stmt = db.prepare(`
  INSERT OR IGNORE INTO Category (id, name, color, sortOrder, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
`);

let inserted = 0;
for (let i = 0; i < categories.length; i++) {
  const cat = categories[i];
  const result = stmt.run(crypto.randomUUID(), cat.name, cat.color, i);
  if (result.changes > 0) inserted++;
}

console.log(`Seeded ${inserted} categories (${categories.length - inserted} already existed)`);
db.close();
