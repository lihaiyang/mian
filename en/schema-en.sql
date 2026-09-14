-- 萌语岛 English Island 云同步（Cloudflare D1）
-- 追加进萌码 Python 的同一个 mian-db，**不动原有表**。
--
-- 部署（第一次）：
--   wrangler d1 execute mian-db --remote --file=./en/schema-en.sql
-- 本地联调：
--   wrangler d1 execute mian-db --local --file=./en/schema-en.sql
--
-- 设计要点（与萌码 Python 完全一致，踩过的坑不再踩）：
--   * 身份复用 accounts 表：**一个同步码管两站**，只存 code_hash + 可选 pin_hash，不收集任何个人信息
--   * 每行都带 account_id：本地 id（p_default / food_apple …）在不同账号之间可以重复，不会互相覆盖
--   * 每行带 rev（账号级单调递增），客户端按 rev 增量拉取，不依赖设备时钟
--   * deleted 软删除墓碑：删除动作也能同步到别的设备
--   * 内容（词库/关卡/绘本/音频）全部是静态资源，**不入库**，不烧 D1 读额度

CREATE TABLE IF NOT EXISTS en_profiles (
  id          TEXT NOT NULL,
  account_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT,
  grade       INTEGER DEFAULT 2,
  goal        INTEGER DEFAULT 15,
  created_at  INTEGER,
  updated_at  INTEGER NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0,
  rev         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, id)
);
CREATE INDEX IF NOT EXISTS idx_en_profiles_rev ON en_profiles(account_id, rev);

-- 成长数据整体存 JSON（等级/徽章/奖牌/每日任务/打卡），与萌码 Python 的做法一致
CREATE TABLE IF NOT EXISTS en_progress (
  account_id  TEXT NOT NULL,
  profile_id  TEXT NOT NULL,
  stats_json  TEXT,
  updated_at  INTEGER NOT NULL,
  rev         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_en_progress_rev ON en_progress(account_id, rev);

-- 记忆盒：英语站的核心业务表
CREATE TABLE IF NOT EXISTS en_srs (
  account_id  TEXT NOT NULL,
  profile_id  TEXT NOT NULL,
  item_id     TEXT NOT NULL,
  box         INTEGER NOT NULL DEFAULT 0,
  due_at      INTEGER NOT NULL DEFAULT 0,   -- 天序号（floor(ts/86400000)），跨设备不受时区影响
  streak      INTEGER NOT NULL DEFAULT 0,
  lapses      INTEGER NOT NULL DEFAULT 0,
  last_result INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0,
  rev         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, profile_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_en_srs_rev ON en_srs(account_id, rev);

-- 按天的学习记录（家长周报要按天查，单独建表避免拉全量 stats）
CREATE TABLE IF NOT EXISTS en_daily (
  account_id    TEXT NOT NULL,
  profile_id    TEXT NOT NULL,
  date          TEXT NOT NULL,               -- YYYY-MM-DD（本地日期）
  minutes       REAL NOT NULL DEFAULT 0,
  new_words     INTEGER NOT NULL DEFAULT 0,
  reviews       INTEGER NOT NULL DEFAULT 0,
  speak_count   INTEGER NOT NULL DEFAULT 0,
  speak_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL,
  rev           INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, profile_id, date)
);
CREATE INDEX IF NOT EXISTS idx_en_daily_rev ON en_daily(account_id, rev);

-- 公开分享（只读周报页；内容上限 32KB，不存音频）
CREATE TABLE IF NOT EXISTS en_shares (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'report',
  profile_id  TEXT,
  title       TEXT,
  content     TEXT,
  created_at  INTEGER NOT NULL,
  views       INTEGER NOT NULL DEFAULT 0,
  revoked     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_en_shares_account ON en_shares(account_id, created_at);
