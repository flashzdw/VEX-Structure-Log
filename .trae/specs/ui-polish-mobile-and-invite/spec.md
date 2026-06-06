# UI 优化：顶栏文案清理 + 移动端适配 + 邀请码入口改进

## Why
当前应用在桌面端运行良好，但存在三处体验问题：
- **顶栏信息冗余**：导航栏左侧的 "让每一次的发生都有迹可循。/Make every 'happening' traceable. —— TEAM 8009." 激励语与首页 Hero 中的 "工程进度管理!" 副标题语义重复；同时每个 Tab 按钮（中/英）都重复显示，浪费横向空间。
- **移动端无法正常使用**：顶栏在窄屏下所有 Tab 平铺并设置 `min-w-[72px]`，会撑出横向滚动；Hero 中的 `text-6xl` 标题、Hero 卡片、搜索/筛选、记录卡片、Settings 表单等也未针对 `sm` 以下断点做适配。
- **加入队伍入口不明显**：当前 Settings 页中 "加入现有队伍" 入口是次要虚线按钮，新用户第一眼只会看到 "添加新队伍"，体验上 "创建" 和 "加入" 是同等重要的两条路径，却把 "加入" 放到了边角位置。

## What Changes
- **顶栏左侧文案**：把 "让每一次的发生都有迹可循。/Make every 'happening' traceable. —— TEAM 8009." 替换为单一的 "工程进度管理!" 文本，与首页 Hero 副标题统一
- **顶栏 Tab 按钮**：移除每个 Tab 按钮下方的英文小字（Home / New / Export / Export Data / Import Data / Settings / Chinese / EN 等），仅保留中文标签
- **顶栏整体结构**：登录态顶栏在窄屏（< 640px）下切换为"汉堡菜单"：点击展开浮层，列出所有 Tab 与用户操作；用户邮箱 + 退出按钮合并到浮层底部
- **首页 Hero**：`text-6xl` 标题在移动端降为 `text-3xl`，Hero 卡片内边距 `p-10` 在移动端降为 `p-6`
- **首页统计卡片 / 快速信息卡片**：栅格在移动端全部退化为单列
- **首页搜索 + 筛选面板**：移动端隐藏筛选按钮的 "筛选" 文字、仅保留图标徽标；操作按钮（"新建记录"）在极窄屏下可换行
- **记录卡片**：`flex items-start gap-6` 内的 24×24 缩略图在移动端降为 16×16，记录元信息折行保持可读
- **Settings 页面（队伍管理）**：
  - "添加新队伍" 与 "加入现有队伍" 改为**等权重**的两个主按钮（实心 + 不同色），并排在第一行
  - 每个已存在队伍的右侧操作区增加 **"复制邀请码"** 按钮（owner 可见），点击后把邀请码写入剪贴板并 toast 提示
  - 在加入队伍表单中增加"不知道邀请码？"提示文案，引导用户向队伍 owner 索取
- **导出 HTML 模板**：移除头部多余的 `slogan` / `team` 段落，避免与 UI 改动后样式漂移

> **BREAKING**：无 API 字段变动；纯 UI / 文案 / 交互层变更。

## Impact
- Affected specs: 顶栏导航、首页 Hero、记录列表、Settings（队伍管理）、导出 HTML
- Affected code:
  - `src/App.tsx`（Navigation 组件：左侧文案 + Tab 文案 + 移动端汉堡菜单）
  - `src/pages/Home.tsx`（Hero 标题、统计卡片、记录卡片、搜索筛选在窄屏下的样式）
  - `src/pages/Settings.tsx`（队伍管理：等权重创建/加入按钮、复制邀请码、提示文案）
  - `src/api/supabase.ts`（新增 `getTeamInviteCode(teamId)`：仅 owner 可读邀请码）
  - `src/store-supabase.ts`（暴露 `getTeamInviteCode` action）
  - `src/pages/ExportPage.tsx`（导出 HTML 模板：移除 slogan 段落）
  - `src/index.css`（新增 `body { overflow-x: hidden }` 兜底；可选）

## ADDED Requirements

### Requirement: 顶栏左侧文案统一
系统 SHALL 在登录态的顶栏左侧展示单一文案 "工程进度管理!"，不再保留 "让每一次的发生都有迹可循。" / "Make every 'happening' traceable." / "—— TEAM 8009." 等旧文案。
- 字号保持与原 `text-sm font-medium` 一致或略大（`text-base`）
- 移动端下隐藏（顶栏只剩 Logo / 标题图标 + 汉堡按钮）

#### Scenario: 桌面端访问
- **WHEN** 屏幕宽度 ≥ 640px
- **THEN** 顶栏左侧显示 "工程进度管理!"，右侧显示所有 Tab 链接

#### Scenario: 移动端访问
- **WHEN** 屏幕宽度 < 640px
- **THEN** 顶栏左侧仅显示 "工程进度管理!"，所有 Tab 链接隐藏并收纳到汉堡菜单

### Requirement: 顶栏 Tab 去除英文副标题
系统 SHALL 在顶栏每个 Tab / 操作按钮内部仅展示一行中文标签，不再展示 `Home` / `New` / `Export` / `Export Data` / `Import Data` / `Settings` / `Chinese` / `EN` 等英文小字。
- 移除 `min-w-[72px]` / `min-w-[88px]`，让按钮宽度自然收缩
- 仍保留 `px-4 py-3 rounded-full` 等基础样式
- 语言切换按钮文案保留为 "中文" / "English"（视当前语言而定）

#### Scenario: 中文环境下访问
- **WHEN** `language === 'zh'`
- **THEN** 各 Tab 仅显示 "首页 / 新建 / 导出 / 导出数据 / 导入数据 / 设置" 等中文

#### Scenario: 英文环境下访问
- **WHEN** `language === 'en'`
- **THEN** 各 Tab 仅显示 "Home / New / Export / Export Data / Import Data / Settings" 等英文（仍是单行）

### Requirement: 顶栏移动端汉堡菜单
系统 SHALL 在屏幕宽度 < 640px 时，把顶栏所有 Tab 与 "导出数据 / 导入数据 / 退出" 等操作收纳到汉堡菜单浮层中。
- 顶栏右侧出现一个 `Menu` / `X` 图标按钮，点击切换浮层显隐
- 浮层从顶部下拉，覆盖在主内容上方（`fixed top-16 inset-x-0 z-50`）
- 浮层内每个项目垂直排列：图标 + 标签；当前激活项加背景色
- 浮层底部固定展示用户邮箱 + 退出按钮
- 点击浮层外部或任一链接后自动关闭浮层
- 桌面端（≥ 640px）行为不变

#### Scenario: 移动端打开菜单
- **WHEN** 用户在 < 640px 宽度下点击汉堡按钮
- **THEN** 浮层滑出，列出首页 / 新建 / 导出 / 导出数据 / 导入数据 / 设置 / 语言切换 + 底部用户邮箱与退出按钮

#### Scenario: 移动端点击 Tab
- **WHEN** 用户在浮层中点击 "首页"
- **THEN** 路由跳转到 `/`，浮层自动关闭

### Requirement: 首页 Hero 移动端样式
系统 SHALL 在 < 640px 宽度下调整首页 Hero 标题与卡片尺寸。
- `LEVEL UP🏆` 标题从 `text-6xl` 降为 `text-3xl`
- Hero 卡片内边距从 `p-10` 降为 `p-6`
- "2026-2027 VIQRC" 与 "工程进度管理!" 副标题保持原样

#### Scenario: 移动端访问首页
- **WHEN** 屏幕宽度 < 640px
- **THEN** Hero 标题正常显示，不会撑出横向滚动条，副标题保持可读

### Requirement: 首页列表与统计移动端栅格
系统 SHALL 在 < 640px 宽度下让首页的统计卡片、快速信息卡片、记录列表卡片均退化为单列布局。
- 4 列统计卡（`lg:grid-cols-4`）→ `grid-cols-1`
- 2 列快速信息卡（`md:grid-cols-2`）→ `grid-cols-1`
- 记录列表卡片内的 24×24 缩略图降为 16×16（`w-16 h-16`）
- 记录卡片内边距从 `p-6` 降为 `p-4`

#### Scenario: 移动端浏览统计
- **WHEN** 屏幕宽度 < 640px
- **THEN** 4 个统计卡纵向堆叠，无横向滚动

### Requirement: 首页搜索与筛选移动端
系统 SHALL 在 < 640px 宽度下紧凑化搜索与筛选区。
- "筛选" 按钮在 < 640px 下只显示图标 + 数字徽标，文字 "筛选" 隐藏（使用 `hidden sm:inline`）
- "新建记录" 按钮在 < 640px 下允许换行（容器改为 `flex-wrap`）

#### Scenario: 移动端打开筛选
- **WHEN** 屏幕宽度 < 640px 且用户点击筛选图标按钮
- **THEN** 筛选面板在搜索框下方展开，不与搜索框重叠

### Requirement: Settings 队伍管理 - 等权重入口
系统 SHALL 在 Settings（队伍管理）页面顶部把 "添加新队伍" 与 "加入现有队伍" 改为两个等权重的主操作按钮。
- 两个按钮并排显示（`grid grid-cols-2 gap-3`），移动端下也保持并排
- "添加新队伍" 使用 `bg-gray-900 text-white`（黑色实心）
- "加入现有队伍" 使用 `bg-blue-600 text-white`（蓝色实心）
- 移除原本虚线 + 次要样式的旧设计
- 文案下方各加一行小字提示：
  - "添加新队伍"：例如 "你是队长？创建一个新队伍并邀请成员"
  - "加入现有队伍"：例如 "已有邀请码？输入 8 位邀请码加入"

#### Scenario: 新用户首次进入 Settings
- **WHEN** 用户打开 /settings 页面
- **THEN** 看到两个等权重的按钮，"添加新队伍" 与 "加入现有队伍" 视觉上同等重要

### Requirement: Settings 复制邀请码
系统 SHALL 在 Settings 队伍列表中，为每个已存在队伍提供 "复制邀请码" 入口（owner 可见）。
- 入口位置：每个队伍的右侧操作区，与编辑 / 删除按钮并列
- 图标：`Copy`（lucide-react），点击后调用 `navigator.clipboard.writeText(inviteCode)`
- 复制成功后展示 toast："邀请码已复制到剪贴板"
- 复制失败时回退到 `prompt()` 弹出邀请码让用户手动复制，并展示警告 toast

#### Scenario: Owner 复制邀请码
- **WHEN** 队伍 owner 点击 "复制邀请码" 图标
- **THEN** 系统读取该队伍的 `invite_code` 字段并写入剪贴板，UI 展示 "已复制" 提示

#### Scenario: 非 owner 访问
- **WHEN** 当前用户不是该队伍的 owner
- **THEN** "复制邀请码" 按钮不渲染

### Requirement: Settings 加入表单引导
系统 SHALL 在 "加入现有队伍" 展开的输入框下增加一行小字提示：
- "不知道邀请码？向你的队长索取 8 位邀请码"
- 邀请码输入框 `placeholder` 从 "邀请码" 改为 "8 位邀请码"

#### Scenario: 用户不知道邀请码
- **WHEN** 用户展开 "加入现有队伍" 表单
- **THEN** 输入框下方看到提示文案，知道需要向队长索取 8 位邀请码

### Requirement: 移动端 Settings 表单
系统 SHALL 在 < 640px 宽度下让 Settings 页面的输入行可堆叠、可点击区域足够大。
- "添加新队伍" / "加入现有队伍" 表单中的 `input + 2 个按钮` 在 < 640px 下改为上下结构（input 在上，按钮在下）
- 列表项中的 `编辑 / 删除 / 复制邀请码` 按钮点击区域保持 ≥ 44×44px（`p-2.5`）

#### Scenario: 移动端操作队伍
- **WHEN** 屏幕宽度 < 640px 且用户点击编辑 / 删除 / 复制按钮
- **THEN** 按钮可正常触发，且不会误触相邻按钮

## MODIFIED Requirements

### Requirement: 顶栏整体
将原本 "左侧激励语 + 右侧 Tab 平铺" 的桌面端布局，改为：
- 桌面端：左侧 "工程进度管理!"，右侧 Tab 平铺（每个 Tab 仅一行中文 / 英文）
- 移动端：左侧 "工程进度管理!"，右侧汉堡按钮；浮层内含全部 Tab 与用户操作

## REMOVED Requirements

### Requirement: 顶栏左侧激励语块
**Reason**: 与首页 Hero 中的 "工程进度管理!" 副标题语义重复；移除以减少视觉噪声

**Migration**: 不需要迁移，直接删除 `App.tsx` 中 Navigation 顶部的 "让每一次的发生都有迹可循。" / "Make every 'happening' traceable." / "—— TEAM 8009." 文案块

### Requirement: 顶栏 Tab 双语副标题
**Reason**: 占用横向空间且在移动端会导致溢出；移除以提升窄屏可读性

**Migration**: 不需要迁移；用户仍可通过语言切换按钮在中文 / 英文之间切换

### Requirement: 导出 HTML 头部 slogan
**Reason**: 与新顶栏文案不一致；UI 改动后 slogan 段落成为遗留样式
**Migration**: 移除 `ExportPage.tsx` 中 `htmlContent` 模板里的 `<div class="header">` 块
