# Tasks

- [x] Task 1: 重构 `src/App.tsx` 的 Navigation 顶栏
  - [x] SubTask 1.1: **删除** 左侧 "让每一次的发生都有迹可循。/Make every 'happening' traceable. —— TEAM 8009." 三行文案块；顶栏左侧不再保留任何文字
  - [x] SubTask 1.2: 移除每个 Tab / 按钮下方的英文副标题（Home / New / Export / Export Data / Import Data / Settings / Chinese / EN 等），并去掉 `min-w-[72px]` / `min-w-[88px]`
  - [x] SubTask 1.3: 新增 `useState` 控制汉堡菜单开合；在 < 640px 时把 Tab 链接 / 按钮 / 用户邮箱 / 退出按钮收纳到浮层中；浮层用 `fixed top-20 inset-x-0 z-50`，点击链接后自动关闭
  - [x] SubTask 1.4: 使用 Tailwind 的 `sm:hidden` / `hidden sm:flex` 控制桌面/移动两套布局的显隐
  - [x] SubTask 1.5: 给 `nav` 的根容器加 `overflow-x-hidden` 兜底，避免极窄屏横向滚动

- [x] Task 2: 适配首页 `src/pages/Home.tsx` 移动端样式
  - [x] SubTask 2.1: Hero 标题 `text-6xl` 改为 `text-3xl sm:text-5xl md:text-6xl`；卡片内边距 `p-10` 改为 `p-6 sm:p-10`
  - [x] SubTask 2.1b: **替换 Hero 副标题**：把 "工程进度管理!" / "Engineering Notes Management!" 替换为原激励语 "让每一次的发生都有迹可循。" / "Make every 'happening' traceable."，并在下方追加署名行 "—— TEAM 8009."
  - [x] SubTask 2.2: 4 列统计卡 `lg:grid-cols-4` 保留，但保证 < 640px 下为 `grid-cols-1`（已是默认）；2 列快速信息卡 `md:grid-cols-2` 同理
  - [x] SubTask 2.3: 筛选按钮文字 "筛选" 在 < 640px 下隐藏（`hidden sm:inline`），只显示图标 + 数字徽标
  - [x] SubTask 2.4: 头部 "新建记录 / 筛选" 容器加 `flex-wrap`，允许窄屏换行
  - [x] SubTask 2.5: 记录卡片内边距 `p-6` 改为 `p-4 sm:p-6`；缩略图 `w-24 h-24` 改为 `w-16 h-16 sm:w-24 sm:h-24`

- [x] Task 3: 新增 `getTeamInviteCode` API
  - [x] SubTask 3.1: 在 `src/api/supabase.ts` 中导出 `getTeamInviteCode(teamId)`：调用 `supabase.from('teams').select('invite_code, owner_id').eq('id', teamId).single()`，并校验 `owner_id === currentUser.id`，否则抛 "仅队长可查看邀请码"
  - [x] SubTask 3.2: 在 `src/store-supabase.ts` 的 store 类型中增加 `getTeamInviteCode: (teamId: string) => Promise<string>`，实现内部调用上面的 API 并返回 `invite_code`
  - [x] SubTask 3.3: 现有 `convertSBTeam` 已不返回 `invite_code`（避免泄露给非 owner）；此处新增 `getTeamInviteCode` 单独按需取一次，保持现状

- [x] Task 4: 改造 `src/pages/Settings.tsx` 队伍管理
  - [x] SubTask 4.1: 把顶部 "添加新队伍" / "加入现有队伍" 两个虚线按钮改为并排的实心主按钮（`grid grid-cols-2 gap-3`），黑底 + 蓝底区分；按钮下方各加一行小字提示
  - [x] SubTask 4.2: 列表项中每个队伍增加 "复制邀请码" 按钮（`Copy` 图标），点击后调用 `getTeamInviteCode(teamId)` 拿到邀请码并写入剪贴板；成功后用临时绿色 toast 提示 "已复制"；失败时降级为 `prompt()` + 红色 toast
  - [x] SubTask 4.3: "加入现有队伍" 表单下方增加 "不知道邀请码？向你的队长索取 8 位邀请码" 提示；`placeholder` 改为 "8 位邀请码"
  - [x] SubTask 4.4: 移动端下输入行 input + 2 个按钮改为上下结构（input 在上，按钮在下），保证按钮可点区域 ≥ 44×44px（`p-2.5`）

- [x] Task 5: 清理 `src/pages/ExportPage.tsx` 导出 HTML 模板
  - [x] SubTask 5.1: 移除 `htmlContent` 中 `<div class="header">…</div>` 整块（slogan + team 段落）
  - [x] SubTask 5.2: 同步移除 `.header` / `.slogan` / `.team` 三条 CSS 规则，避免遗留样式

- [x] Task 6: 构建与冒烟验证
  - [x] SubTask 6.1: 运行 `npm run check` 通过
  - [x] SubTask 6.2: 运行 `npm run build` 通过
  - [x] SubTask 6.3: 视觉验证（DevTools iPhone SE 视口）—— 受限于沙箱环境，Chrome 与 Playwright 浏览器不可用，未能进行截图验证；改用代码审查 + 构建通过作为信号
  - [x] SubTask 6.4: 桌面视口（≥ 1024px）下确认 —— 同上，依赖代码审查

# Task Dependencies
- Task 3 必须在 Task 4 之前完成（Settings 复制按钮依赖 store action） ✅
- Task 1 / 2 / 4 / 5 互相独立，并行执行 ✅
- Task 6 在所有 UI 改动后执行 ✅
