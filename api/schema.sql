-- 创建 records 表
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  author TEXT NOT NULL,
  module TEXT NOT NULL,
  reason TEXT NOT NULL,
  content TEXT NOT NULL,
  photos TEXT,
  test_result TEXT,
  problems TEXT,
  next_steps TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at DESC);
