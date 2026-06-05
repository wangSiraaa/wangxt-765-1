import initSqlJs, { type Database } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let db: Database | null = null
const DB_PATH = path.join(__dirname, '..', 'data', 'meddevice.db')

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS adverse_events (
  id TEXT PRIMARY KEY,
  event_code TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('一般', '严重', '特别严重')),
  status TEXT NOT NULL DEFAULT '已登记' CHECK(status IN ('已登记', '已上报', '审核通过', '审核驳回', '整改中', '已归档')),
  event_time TEXT NOT NULL,
  discover_time TEXT NOT NULL,
  description TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  batch_no TEXT,
  patient_name TEXT,
  patient_age INTEGER,
  patient_gender TEXT CHECK(patient_gender IN ('男', '女', '未知')),
  injury_level TEXT NOT NULL CHECK(injury_level IN ('无', '轻度', '中度', '重度', '死亡')),
  reporter_id TEXT NOT NULL DEFAULT 'user001',
  reporter_name TEXT NOT NULL DEFAULT '上报员',
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS rectifications (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  measure TEXT NOT NULL,
  responsible_person TEXT NOT NULL,
  deadline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '待执行' CHECK(status IN ('待执行', '执行中', '已关闭')),
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (event_id) REFERENCES adverse_events(id)
);

CREATE TABLE IF NOT EXISTS event_status_log (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  operator TEXT NOT NULL,
  operated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  remark TEXT,
  FOREIGN KEY (event_id) REFERENCES adverse_events(id)
);

CREATE INDEX IF NOT EXISTS idx_events_status ON adverse_events(status);
CREATE INDEX IF NOT EXISTS idx_events_severity ON adverse_events(severity);
CREATE INDEX IF NOT EXISTS idx_rectifications_event ON rectifications(event_id);
CREATE INDEX IF NOT EXISTS idx_status_log_event ON event_status_log(event_id);
`

export async function initDatabase(): Promise<Database> {
  if (db) return db

  const SQL = await initSqlJs()

  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
    db.run(SCHEMA_SQL)
    saveDatabase()
  }

  return db
}

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function saveDatabase(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(DB_PATH, buffer)
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}
