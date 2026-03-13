// scripts/seed.js - 初始化内置话术模板和演示账号（PostgreSQL 版本）
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

const BUILTIN_TEMPLATES = [
  { name: '本周工作完成情况', category: 'weekly', sort_order: 1, content: `本周主要完成了以下工作：
1. [工作项1]：[完成情况和成果]
2. [工作项2]：[完成情况和成果]
3. [工作项3]：[完成情况和成果]

工作成果量化：[关键指标数据]` },
  { name: '下周工作计划', category: 'weekly', sort_order: 2, content: `下周计划重点推进以下工作：
1. [计划项1]：预计完成[具体目标]
2. [计划项2]：预计完成[具体目标]
3. [计划项3]：预计完成[具体目标]

需要协调资源：[资源需求]` },
  { name: '遇到的问题与风险', category: 'weekly', sort_order: 3, content: `本周遇到的主要问题：
- 问题1：[问题描述]，影响：[影响范围]，解决方案：[处理方式]
- 问题2：[问题描述]，当前状态：[进展]

潜在风险提示：[风险说明]` },
  { name: '月度工作总结', category: 'monthly', sort_order: 4, content: `本月工作总结：

一、重点工作完成情况
[列举本月完成的重点工作及成果]

二、关键指标完成情况
- 指标1：目标[X]，实际完成[Y]，完成率[Z%]
- 指标2：目标[X]，实际完成[Y]，完成率[Z%]

三、亮点与创新
[本月工作中的亮点、创新点或超预期完成的工作]

四、存在的不足
[客观分析本月工作中的不足之处]` },
  { name: '下月工作计划', category: 'monthly', sort_order: 5, content: `下月工作计划：

一、重点工作安排
1. [重点工作1]：[目标和计划]
2. [重点工作2]：[目标和计划]

二、关键里程碑
- [日期]：[里程碑事项]
- [日期]：[里程碑事项]

三、资源需求
[人力、资源、协作需求说明]` },
  { name: '晨会汇报模板', category: 'standup', sort_order: 6, content: `昨日完成：
- [完成事项1]
- [完成事项2]

今日计划：
- [计划事项1]
- [计划事项2]

阻塞/需要协助：
- [如无则填"无"]` },
  { name: '述职报告-工作业绩', category: 'review', sort_order: 7, content: `一、岗位职责履行情况
[描述本岗位核心职责及履行情况]

二、重点工作业绩
1. [项目/工作名称]
   - 背景：[工作背景]
   - 行动：[具体做了什么]
   - 结果：[取得的成果，尽量量化]` },
  { name: '述职报告-成长与规划', category: 'review', sort_order: 8, content: `三、个人成长与能力提升
[本考核期内在专业技能、管理能力、综合素质等方面的成长]

四、不足与改进计划
- 不足1：[描述]，改进措施：[具体计划]

五、下一阶段工作规划
[未来6-12个月的工作目标和发展规划]` },
  { name: '成果量化话术', category: 'general', sort_order: 9, content: '通过[具体措施]，实现了[指标]提升[X%]，为团队/公司带来了[价值描述]。' },
  { name: '问题解决话术', category: 'general', sort_order: 10, content: '针对[问题描述]，我采取了[解决方案]，最终[解决结果]，有效避免了[潜在影响]。' },
  { name: '跨部门协作话术', category: 'general', sort_order: 11, content: '积极协调[部门名称]，共同推进[项目/事项]，通过[协作方式]，确保了[目标达成]。' },
  { name: '项目进展汇报', category: 'general', sort_order: 12, content: `[项目名称]当前进展：
- 整体进度：[X%]，[超前/按时/滞后][X天]
- 本阶段完成：[已完成内容]
- 下阶段重点：[待完成内容]
- 风险提示：[风险说明或"暂无风险"]` },
];

async function seed() {
  try {
    // 清空并重建内置模板
    await pool.query('DELETE FROM templates WHERE is_builtin = true');
    for (const t of BUILTIN_TEMPLATES) {
      await pool.query(
        'INSERT INTO templates (name, category, content, is_builtin, sort_order) VALUES ($1, $2, $3, true, $4)',
        [t.name, t.category, t.content, t.sort_order]
      );
    }
    console.log(`✓ 内置话术模板已写入 (${BUILTIN_TEMPLATES.length} 条)`);

    // 演示账号
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['demo@repoai.com']);
    if (!rows.length) {
      const password_hash = await bcrypt.hash('demo123456', 10);
      await pool.query(
        'INSERT INTO users (email, password_hash, nickname, role) VALUES ($1, $2, $3, $4)',
        ['demo@repoai.com', password_hash, '演示用户', 'free']
      );
      console.log('✓ 演示账号已创建: demo@repoai.com / demo123456');
    } else {
      console.log('✓ 演示账号已存在，跳过');
    }

    console.log('✓ 数据初始化完成');
    process.exit(0);
  } catch (err) {
    console.error('✗ 初始化失败:', err.message);
    process.exit(1);
  }
}

seed();
