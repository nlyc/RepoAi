-- ============================================================
-- RepoAI 数据库初始化脚本
-- PostgreSQL 15
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname    VARCHAR(100),
    role        VARCHAR(20) DEFAULT 'free' CHECK (role IN ('free', 'pro', 'admin')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- 话术模板表
-- is_builtin=true 为系统内置，user_id=NULL
-- is_builtin=false 为用户自定义
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(50) NOT NULL,   -- 分类：general/weekly/monthly/standup/review
    content     TEXT NOT NULL,          -- 话术内容
    is_builtin  BOOLEAN DEFAULT FALSE,
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user ON templates(user_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_builtin ON templates(is_builtin);

-- ============================================================
-- 汇报记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type     VARCHAR(30) NOT NULL CHECK (report_type IN ('weekly','monthly','standup','review')),
    audience_style  VARCHAR(30) DEFAULT 'manager',  -- 汇报对象风格: manager/executive/peer/hr
    input_snapshot  JSONB,          -- 原始输入快照（文件名、文本内容等）
    template_ids    UUID[],         -- 使用的模板ID列表
    output_text     TEXT,           -- 生成的汇报内容
    title           VARCHAR(300),   -- 汇报标题
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','generating','done','error')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ============================================================
-- 大模型调用记录表（用于成本分析和调试）
-- ============================================================
CREATE TABLE IF NOT EXISTS llm_calls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id       UUID REFERENCES reports(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    model_name      VARCHAR(100) DEFAULT 'deepseek-reasoner',
    prompt_tokens   INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    latency_ms      INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success','error','timeout')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_calls_report ON llm_calls(report_id);
CREATE INDEX idx_llm_calls_user ON llm_calls(user_id);

-- ============================================================
-- 每日额度使用表
-- 使用 (user_id, date) 唯一约束实现原子性计数
-- ============================================================
CREATE TABLE IF NOT EXISTS quota_usage (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    count       INT DEFAULT 0,
    UNIQUE(user_id, date)
);

CREATE INDEX idx_quota_user_date ON quota_usage(user_id, date);

-- ============================================================
-- 自动更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 内置话术模板种子数据
-- ============================================================

-- 通用职场话术
INSERT INTO templates (name, category, content, is_builtin, sort_order) VALUES
('本周工作完成情况', 'weekly',
'本周主要完成了以下工作：
1. [工作项1]：[完成情况和成果]
2. [工作项2]：[完成情况和成果]
3. [工作项3]：[完成情况和成果]

工作成果量化：[关键指标数据]', TRUE, 1),

('下周工作计划', 'weekly',
'下周计划重点推进以下工作：
1. [计划项1]：预计完成[具体目标]
2. [计划项2]：预计完成[具体目标]
3. [计划项3]：预计完成[具体目标]

需要协调资源：[资源需求]', TRUE, 2),

('遇到的问题与风险', 'weekly',
'本周遇到的主要问题：
- 问题1：[问题描述]，影响：[影响范围]，解决方案：[处理方式]
- 问题2：[问题描述]，当前状态：[进展]

潜在风险提示：[风险说明]', TRUE, 3),

('月度工作总结', 'monthly',
'本月工作总结：

一、重点工作完成情况
[列举本月完成的重点工作及成果]

二、关键指标完成情况
- 指标1：目标[X]，实际完成[Y]，完成率[Z%]
- 指标2：目标[X]，实际完成[Y]，完成率[Z%]

三、亮点与创新
[本月工作中的亮点、创新点或超预期完成的工作]

四、存在的不足
[客观分析本月工作中的不足之处]', TRUE, 4),

('下月工作计划', 'monthly',
'下月工作计划：

一、重点工作安排
1. [重点工作1]：[目标和计划]
2. [重点工作2]：[目标和计划]

二、关键里程碑
- [日期]：[里程碑事项]
- [日期]：[里程碑事项]

三、资源需求
[人力、资源、协作需求说明]', TRUE, 5),

('晨会汇报模板', 'standup',
'昨日完成：
- [完成事项1]
- [完成事项2]

今日计划：
- [计划事项1]
- [计划事项2]

阻塞/需要协助：
- [如无则填"无"]', TRUE, 6),

('述职报告-工作业绩', 'review',
'一、岗位职责履行情况
[描述本岗位核心职责及履行情况]

二、重点工作业绩
1. [项目/工作名称]
   - 背景：[工作背景]
   - 行动：[具体做了什么]
   - 结果：[取得的成果，尽量量化]

2. [项目/工作名称]
   - 背景：[工作背景]
   - 行动：[具体做了什么]
   - 结果：[取得的成果，尽量量化]', TRUE, 7),

('述职报告-成长与规划', 'review',
'三、个人成长与能力提升
[本考核期内在专业技能、管理能力、综合素质等方面的成长]

四、不足与改进计划
- 不足1：[描述]，改进措施：[具体计划]
- 不足2：[描述]，改进措施：[具体计划]

五、下一阶段工作规划
[未来6-12个月的工作目标和发展规划]', TRUE, 8),

('成果量化话术', 'general',
'通过[具体措施]，实现了[指标]提升[X%]，为团队/公司带来了[价值描述]。', TRUE, 9),

('问题解决话术', 'general',
'针对[问题描述]，我采取了[解决方案]，最终[解决结果]，有效避免了[潜在影响]。', TRUE, 10),

('跨部门协作话术', 'general',
'积极协调[部门名称]，共同推进[项目/事项]，通过[协作方式]，确保了[目标达成]。', TRUE, 11),

('项目进展汇报', 'general',
'[项目名称]当前进展：
- 整体进度：[X%]，[超前/按时/滞后][X天]
- 本阶段完成：[已完成内容]
- 下阶段重点：[待完成内容]
- 风险提示：[风险说明或"暂无风险"]', TRUE, 12);

-- ============================================================
-- 创建管理员账号（密码: admin123456）
-- ============================================================
INSERT INTO users (email, password_hash, nickname, role) VALUES
('admin@repoai.com', crypt('admin123456', gen_salt('bf')), '管理员', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 创建演示账号（密码: demo123456）
-- 生产环境请删除此行
-- ============================================================
INSERT INTO users (email, password_hash, nickname, role) VALUES
('demo@repoai.com', crypt('demo123456', gen_salt('bf')), '演示用户', 'free')
ON CONFLICT (email) DO NOTHING;
