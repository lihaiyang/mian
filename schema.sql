-- 萌码 Python 云同步（Cloudflare D1）
-- 首次部署：wrangler d1 execute mian-db --remote --file=./schema.sql
--
-- 设计要点：
--   * 账号 = 匿名同步码（只存 code_hash，不收集个人信息）
--   * 每行都带 account_id：本地 id（p_default / ex_1 …）在不同账号间可以重复，互不干扰
--   * 每行带 rev（账号级单调递增版本号），客户端按 rev 增量拉取
--   * deleted 软删除（墓碑），保证删除动作也能同步到别的设备

CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT PRIMARY KEY,
  code_hash   TEXT UNIQUE NOT NULL,
  pin_hash    TEXT,
  nickname    TEXT,
  avatar      TEXT,
  rev         INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  last_seen   INTEGER
);

CREATE TABLE IF NOT EXISTS rate (
  k TEXT NOT NULL,
  w INTEGER NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (k, w)
);

CREATE TABLE IF NOT EXISTS profiles (
  id          TEXT NOT NULL,
  account_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT,
  created_at  INTEGER,
  updated_at  INTEGER NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0,
  rev         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, id)
);
CREATE INDEX IF NOT EXISTS idx_profiles_rev ON profiles(account_id, rev);

CREATE TABLE IF NOT EXISTS folders (
  id          TEXT NOT NULL,
  account_id  TEXT NOT NULL,
  profile_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT,
  builtin     INTEGER DEFAULT 0,
  keep        INTEGER DEFAULT 0,
  position    INTEGER DEFAULT 0,
  updated_at  INTEGER NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0,
  rev         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, id)
);
CREATE INDEX IF NOT EXISTS idx_folders_rev ON folders(account_id, rev);

CREATE TABLE IF NOT EXISTS files (
  id          TEXT NOT NULL,
  account_id  TEXT NOT NULL,
  profile_id  TEXT NOT NULL,
  folder_id   TEXT,
  name        TEXT NOT NULL,
  content     TEXT,
  updated_at  INTEGER NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0,
  rev         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, id)
);
CREATE INDEX IF NOT EXISTS idx_files_rev ON files(account_id, rev);

CREATE TABLE IF NOT EXISTS progress (
  account_id  TEXT NOT NULL,
  profile_id  TEXT NOT NULL,
  stats_json  TEXT,
  updated_at  INTEGER NOT NULL,
  rev         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, profile_id)
);

CREATE TABLE IF NOT EXISTS vfs (
  account_id  TEXT NOT NULL,
  profile_id  TEXT NOT NULL,
  path        TEXT NOT NULL,
  text        TEXT,
  updated_at  INTEGER NOT NULL,
  rev         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, profile_id, path)
);
-- 公开分享（作品短链 / 学习进度只读页）
CREATE TABLE IF NOT EXISTS shares (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL,
  kind        TEXT NOT NULL,          -- code | progress
  profile_id  TEXT,
  title       TEXT,
  content     TEXT,                   -- kind=code 存代码；kind=progress 存 JSON
  created_at  INTEGER NOT NULL,
  views       INTEGER NOT NULL DEFAULT 0,
  revoked     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_shares_account ON shares(account_id, created_at);