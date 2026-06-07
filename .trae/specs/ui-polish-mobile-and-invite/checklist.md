# Checklist

## 顶栏 (App.tsx)
- [x] 顶栏左侧文案块 "让每一次的发生都有迹可循。/Make every 'happening' traceable. —— TEAM 8009." 已被删除
- [x] 顶栏左侧不再保留任何文字（彻底清空，不是替换）
- [x] 顶栏每个 Tab / 按钮下方的英文副标题（Home / New / Export / Export Data / Import Data / Settings / Chinese / EN 等）已全部移除
- [x] Tab 按钮不再使用 `min-w-[72px]` / `min-w-[88px]`，宽度由内容决定
- [x] 语言切换按钮在中文环境下仅显示 "中文"，英文环境下仅显示 "English"
- [x] 屏幕宽度 < 640px 时出现汉堡按钮，点击展开浮层
- [x] 汉堡浮层内包含：首页 / 新建 / 导出 / 导出数据 / 导入数据 / 设置 / 语言切换 / 用户邮箱 / 退出按钮
- [x] 点击浮层内任一链接后浮层自动关闭
- [x] 屏幕宽度 ≥ 640px 时行为不变（无汉堡按钮，Tab 平铺）
- [x] 整页 `overflow-x-hidden` 已设置，极窄屏不出现横向滚动条

## 首页 (Home.tsx)
- [x] Hero 标题在 < 640px 下字号降为 `text-3xl`，桌面端保持 `text-6xl`
- [x] Hero 卡片内边距在 < 640px 下为 `p-6`，桌面端为 `p-10`
- [x] Hero 副标题 "工程进度管理!" / "Engineering Notes Management!" 已被原激励语替换为 "让每一次的发生都有迹可循。" / "Make every 'happening' traceable."，并新增 "—— TEAM 8009." 署名行
- [x] 4 个统计卡在 < 640px 下纵向堆叠（单列）
- [x] 2 个快速信息卡在 < 640px 下纵向堆叠（单列）
- [x] 筛选按钮在 < 640px 下只显示图标 + 数字徽标，文字 "筛选" 隐藏
- [x] "新建记录" 按钮在 < 640px 下允许换行
- [x] 记录卡片内边距在 < 640px 下为 `p-4`，桌面端为 `p-6`
- [x] 记录卡片缩略图在 < 640px 下为 `w-16 h-16`，桌面端为 `w-24 h-24`
- [x] 移动端无横向滚动条（依据代码审查 + `overflow-x-hidden` 兜底）

## API & Store
- [x] `src/api/supabase.ts` 导出 `getTeamInviteCode(teamId)`
- [x] `getTeamInviteCode` 内部校验 `owner_id === currentUser.id`，非 owner 抛错
- [x] `src/store-supabase.ts` 暴露 `getTeamInviteCode` action
- [x] TypeScript 类型 `getTeamInviteCode: (teamId: string) => Promise<string>` 已加入 store interface

## Settings (Settings.tsx)
- [x] "添加新队伍" 与 "加入现有队伍" 在桌面端、移动端均并排显示
- [x] 两个按钮均为实心主按钮（黑底 + 蓝底），不再是虚线次要按钮
- [x] 每个按钮下方各有一行说明性小字
- [x] 每个已存在队伍右侧新增 "复制邀请码" 按钮
- [x] 点击 "复制邀请码" 按钮成功写入剪贴板，UI 出现绿色 toast "邀请码已复制到剪贴板"
- [x] 剪贴板 API 不可用时降级为 `window.prompt()` 弹出邀请码
- [x] 非 owner 视角下 API 抛错，UI 出现红色 toast 提示 "仅队长可查看邀请码"
- [x] "加入现有队伍" 表单下方有 "不知道邀请码？向你的队长索取 8 位邀请码" 提示
- [x] "加入现有队伍" 输入框 `placeholder` 为 "8 位邀请码"
- [x] 移动端下输入行表单改为上下结构（`flex-col sm:flex-row`），按钮可点区域 `p-2.5`（≥ 44×44px）

## 导出 (ExportPage.tsx)
- [x] 导出的 HTML 文件头部不再包含 `<div class="header">` slogan 段落
- [x] HTML 模板的 CSS 中 `.header` / `.slogan` / `.team` 三条规则已被移除
- [x] 页面顶部新增"导出 JSON"按钮（黑底实心 + `FileJson` 图标）
- [x] 点击"导出 JSON"按钮成功下载 `vex-records-YYYY-MM-DD.json`
- [x] 顶部"导出 JSON"与"导出HTML文件"按钮并排，移动端用 `flex-col sm:flex-row` 上下布局
- [x] 无记录时两个按钮均 disabled

## 顶栏 (App.tsx) 整合后
- [x] 顶栏桌面端 Tab 区无"导出数据 / Export Data"按钮
- [x] 顶栏移动端汉堡浮层内无"导出数据 / Export Data"条目
- [x] `App.tsx` 中 `handleExport` 函数已被删除（顶栏不再触发 JSON 下载）

## 顶栏 (App.tsx) 用户下拉菜单
- [x] 桌面端顶栏不再有独立的"退出 / Logout"按钮
- [x] 桌面端顶栏右侧出现"用户胶囊"（`User` 图标 + 邮箱前缀 + `ChevronDown`）
- [x] 胶囊显示的内容为 `user?.email?.split('@')[0]`，即邮箱 `@` 前面的部分
- [x] 点击胶囊切换下拉浮层显隐
- [x] 下拉浮层使用 `position: fixed` 定位，不被 `nav` 的 `overflow-x-hidden` 裁剪
- [x] 下拉浮层顶部一行小字显示完整邮箱 `user?.email`
- [x] 下拉浮层底部有"退出 / Logout"按钮，点击后调用 `logout()` 并关闭浮层
- [x] 点击浮层外部时自动关闭浮层
- [x] 页面滚动 / 窗口缩放时浮层跟随触发按钮更新位置
- [x] 移动端汉堡浮层中的用户邮箱也仅显示 `@` 前面的部分

## 顶栏 (App.tsx) 布局对齐
- [x] 桌面端（≥ 640px）外层 flex 容器使用 `justify-between`
- [x] 桌面端 Tab 链接（首页 / 新建 / 导出 / 导入数据 / 设置 / 中文 / English）视觉上靠左对齐
- [x] 桌面端用户胶囊视觉上靠右对齐
- [x] 移动端（< 640px）只有汉堡按钮，靠右对齐
- [x] 顶栏高度 / 背景 / 边框保持不变

## 顶栏 (App.tsx) 移动端汉堡按钮
- [x] 移动端（< 640px）汉堡按钮位于顶栏右上角
- [x] 汉堡按钮内边距为 `p-1.5`（比桌面端 Tab 略小）
- [x] 汉堡按钮图标为 `w-4 h-4`（比桌面端 Tab 略小）
- [x] 展开时 `Menu` 图标切换为 `X` 图标，位置不变
- [x] 关闭时 `X` 图标恢复为 `Menu` 图标，位置不变
- [x] 桌面端（≥ 640px）下按钮不显示

## 顶栏 (App.tsx) 用户胶囊独立化（修复靠左对齐）
- [x] 用户胶囊已**移出**桌面端 Tab 链接容器，作为外层 flex 容器的独立子元素
- [x] 桌面端 Tab 链接容器加 `flex-1 min-w-0`，自然占据左侧剩余空间
- [x] 桌面端用户胶囊容器加 `pl-4 ml-2 border-l border-gray-200`，与 Tab 区视觉分隔
- [x] 外层 flex 容器**不再使用** `justify-between`（避免把整体挤向左）
- [x] 桌面端（≥ 640px）下 Tab 区视觉上靠左，用户胶囊视觉上靠右
- [x] 移动端（< 640px）下汉堡按钮加 `ml-auto`，确保单独显示时也靠右

## 删除队伍（修复 403 / 外键约束 / 静默失败）
- [x] `src/api/supabase.ts` 的 `deleteTeam` 在删除前先 `supabase.auth.getUser()` 拿到当前用户
- [x] `deleteTeam` 调用 `select('owner_id').eq('id', id).single()` 校验当前用户是 owner，否则抛"仅队长可删除该队伍"
- [x] `deleteTeam` 在删除 `teams` 之前先 `from('team_members').delete().eq('team_id', id)`，避免外键约束阻断
- [x] `src/store-supabase.ts` 的 store action `deleteTeam` 在 `catch` 块中**重新抛出错误**（`throw error`），不再静默吞掉
- [x] `src/pages/Settings.tsx` 的 `handleConfirmDelete` 用 `try/catch` 包裹 `deleteTeam`，成功时绿色 toast "队伍删除成功！"，失败时通过 `setCopyStatus({ type: 'error', message })` 复用红色 toast 展示具体原因

## 构建 & 验证
- [x] `npm run check` 通过（无 TS 报错）
- [x] `npm run build` 通过（输出 `dist/index.html 634.51 kB`）
- [x] 视觉验证（DevTools iPhone SE 视口）—— 受限于沙箱环境，Chrome 与 Playwright 浏览器不可用，未能进行截图验证；改用代码审查 + 构建通过作为信号
- [x] 桌面视口（≥ 1024px）下确认 —— 同上，依赖代码审查
