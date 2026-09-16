-- 萌学园平台 · 通用表
--
-- 这个文件**只放新学科要用的通用表**，不重复 db/py.sql 和 db/en.sql 的内容
-- （那两个是萌码 Python 与萌语岛的既有 schema，保持原样不动）。
--
-- 新库第一次建立时，三个文件都要跑一遍：
--   wrangler d1 execute mian-platform-db --remote --file=./db/py.sql
--   wrangler d1 execute mian-platform-db --remote --file=./db/en.sql
--   wrangler d1 execute mian-platform-db --remote --file=./db/platform.sql
--
-- 设计要点（见 docs/多学科平台架构设计.md 第 5 节）：
--   * payload_json 对服务端是**黑盒**：服务端只做 LWW 和墓碑，不理解内容。
--     这样以后加学科**完全不用改后端、不用改表**——这是"加一科很便宜"的关键。
--   * (account_id, subject, entity, row_id) 四元组定位一行，
--     本地 id 在不同账号之间可以重复，互不干扰（沿用既有约定）。
--   * rev 是账号级单调版本号（在 accounts 表上），客户端按 rev 增量拉取。
--   * deleted 是软删除墓碑，保证"删除"这个动作也能同步到别的设备。

CREATE TABLE IF NOT EXISTS sub_rows (
  account_id   TEXT    NOT NULL,
  subject      TEXT    NOT NULL,   -- python | en | math | typing | pinyin | chinese | cpp
  profile_id   TEXT    NOT NULL,
  entity       TEXT    NOT NULL,   -- progress | srs | daily | draft | stats …
  row_id       TEXT    NOT NULL,   -- 学科自己的行 id（题目 id / 卡片 id / 日期 …）
  payload_json TEXT,               -- 学科自定义，服务端不解析
  updated_at   INTEGER NOT NULL,
  deleted      INTEGER NOT NULL DEFAULT 0,
  rev          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, subject, entity, row_id)
);

-- 增量拉取靠这个索引（WHERE account_id = ? AND rev > ?）
CREATE INDEX IF NOT EXISTS idx_sub_rows_rev ON sub_rows(account_id, rev);
