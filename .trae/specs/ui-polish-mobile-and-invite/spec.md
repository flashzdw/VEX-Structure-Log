# UI 优化：顶栏文案清理 + 移动端适配 + 邀请码入口改进

## Why
当前应用在桌面端运行良好，但存在三处体验问题：
- **顶栏信息冗余**：导航栏左侧的 "让每一次的发生都有迹可循。/Make every 'happening' traceable. —— TEAM 8009." 激励语与首页 Hero 中的 "工程进度管理!" 副标题语义重复；同时每个 Tab 按钮（中/英）都重复显示，浪费横向空间。
- **移动端无法正常使用**：顶栏在窄屏下所有 Tab 平铺并设置 `min-w-[72px]`，会撑出横向滚动；Hero 中的 `text-6xl` 标题、Hero 卡片、搜索/筛选、记录卡片、Settings 表单等也未针对 `sm` 以下断点做适配。
- **加入队伍入口不明显**：当前 Settings 页中 "加入现有队伍" 入口是次要虚线按钮，新用户第一眼只会看到 "添加新队伍"，体验上 "创建" 和 "加入" 是同等重要的两条路径，却把 "加入" 放到了边角位置。

## What Changes
- **顶栏左侧文案**：**删除** "让每一次的发生都有迹可循。/Make every 'happening' traceable. —— TEAM 8009." 三行激励语（顶栏左侧不再保留任何文字）
- **首页 Hero 副标题**：把 "工程进度管理!" / "Engineering Notes Management!" **替换** 为原激励语 "让每一次的发生都有迹可循。" / "Make every 'happening' traceable."，并在下方追加 "—— TEAM 8009." 署名行；Hero 标题 "LEVEL UP🏆" 与 "2026-2027 VIQRC" 保持不变
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
- **导出功能整合**：把"导出数据"（JSON 全部数据下载）按钮从顶栏移除，合并到导出页 `/export` 中作为顶部主操作之一；导出页同时保留"导出 PDF（HTML）"功能（通过"导出HTML文件"按钮）

> **BREAKING**：无 API 字段变动；纯 UI / 文案 / 交互层变更。

## Impact
- Affected specs: 顶栏导航、首页 Hero、记录列表、Settings（队伍管理）、导出 HTML
- Affected code:
  - `src/App.tsx`（Navigation 组件：左侧文案 + Tab 文案 + 移动端汉堡菜单 + 移除"导出数据"按钮）
  - `src/pages/Home.tsx`（Hero 标题、统计卡片、记录卡片、搜索筛选在窄屏下的样式）
  - `src/pages/Settings.tsx`（队伍管理：等权重创建/加入按钮、复制邀请码、提示文案）
  - `src/api/supabase.ts`（新增 `getTeamInviteCode(teamId)`：仅 owner 可读邀请码）
  - `src/store-supabase.ts`（暴露 `getTeamInviteCode` action）
  - `src/pages/ExportPage.tsx`（导出 HTML 模板：移除 slogan 段落 + 顶部新增"导出 JSON（全部数据）"主按钮）
  - `src/index.css`（新增 `body { overflow-x: hidden }` 兜底；可选）

## ADDED Requirements

### Requirement: 顶栏左侧文案清空
系统 SHALL 在登录态的顶栏左侧**不再保留**任何文字。
- 原 "让每一次的发生都有迹可循。/Make every 'happening' traceable. —— TEAM 8009." 三行文案被完全删除
- 顶栏左侧在桌面端 / 移动端下均为空，Tab 链接 / 汉堡按钮占据全部可用空间
- 顶栏高度从 `h-20` 适当收紧（保持与 `h-16` / `h-20` 原状一致即可；本次不再调整高度）

#### Scenario: 桌面端访问
- **WHEN** 屏幕宽度 ≥ 640px
- **THEN** 顶栏左侧无文字，右侧显示所有 Tab 链接

#### Scenario: 移动端访问
- **WHEN** 屏幕宽度 < 640px
- **THEN** 顶栏左侧无文字，右侧显示汉堡按钮

### Requirement: 首页 Hero 副标题改为原激励语
系统 SHALL 在 Home Hero 副标题位置展示原顶栏的激励语。
- 副标题文案（中文）："让每一次的发生都有迹可循。"
- 副标题文案（英文）："Make every 'happening' traceable."
- 副标题下方追加署名行："—— TEAM 8009."（中文 / 英文均显示）
- 原 "工程进度管理!" / "Engineering Notes Management!" 文本被删除
- Hero 标题 "LEVEL UP🏆" 与 "2026-2027 VIQRC" 保持不变

#### Scenario: 中文环境访问
- **WHEN** `language === 'zh'`
- **THEN** Hero 副标题显示 "让每一次的发生都有迹可循。" + "—— TEAM 8009."

#### Scenario: 英文环境访问
- **WHEN** `language === 'en'`
- **THEN** Hero 副标题显示 "Make every 'happening' traceable." + "—— TEAM 8009."

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

### Requirement: 顶栏"导出数据"按钮移除
系统 SHALL 从顶栏（桌面端 Tab 区 + 移动端汉堡浮层）移除"导出数据"按钮。
- 桌面端 Tab 区不再显示"导出数据 / Export Data"按钮
- 移动端汉堡浮层不再包含"导出数据 / Export Data"条目
- 顶栏仅保留：首页 / 新建 / 导出（→ /export 页面）/ 导入数据 / 设置 / 语言切换 + 用户邮箱 + 退出按钮
- JSON 数据导出能力由 `ExportPage` 接管（见下一条 Requirement）

#### Scenario: 桌面端访问
- **WHEN** 屏幕宽度 ≥ 640px 且用户查看顶栏
- **THEN** 顶栏无"导出数据"按钮

#### Scenario: 移动端访问
- **WHEN** 屏幕宽度 < 640px 且用户展开汉堡浮层
- **THEN** 浮层内无"导出数据"条目

### Requirement: ExportPage 顶部"导出 JSON"主按钮
系统 SHALL 在 `/export` 页面顶部新增"导出 JSON（全部数据）"主按钮，与原有的"导出HTML文件"按钮并排显示。
- 按钮位置：页面顶部 `flex items-center justify-between` 区，与"返回"按钮同行
- 按钮文案：中文 "导出 JSON"，英文 "Export JSON"
- 按钮样式：实心黑色 `bg-gray-900 text-white`（与原有"导出HTML文件"一致）
- 图标：`FileJson`（lucide-react）放在按钮内
- 点击行为：调用 store 的 `exportData()`，把返回的 JSON 字符串作为 `application/json` Blob 下载，文件名 `vex-records-${YYYY-MM-DD}.json`
- 禁用状态：当 `records.length === 0` 时按钮禁用
- "导出HTML文件"按钮保持原状（仍导出 PDF / HTML）

#### Scenario: 用户在 ExportPage 点击"导出 JSON"
- **WHEN** 用户访问 `/export` 且有记录
- **THEN** 浏览器下载 `vex-records-2026-06-06.json` 文件

#### Scenario: 用户在 ExportPage 无记录时点击
- **WHEN** 用户访问 `/export` 且 `records.length === 0`
- **THEN** "导出 JSON" 与 "导出HTML文件" 按钮均显示为 disabled

### Requirement: 顶栏用户下拉菜单
系统 SHALL 在桌面端顶栏把"退出 / Logout"按钮收纳到用户邮箱下拉菜单中，并仅展示邮箱 `@` 前面的前缀以节省横向空间。
- 桌面端顶栏右侧不再有独立的"退出 / Logout"按钮
- 取而代之的是一个可点击的"用户胶囊"（图标 + 邮箱前缀 + `ChevronDown` 下拉指示）
- 点击该胶囊切换 `showUserMenu` 状态，下拉浮层从胶囊下方出现
- **浮层定位方式：`position: fixed`**（基于触发按钮的 `getBoundingClientRect()` 计算 `top` / `right`），避免被 `nav` 的 `overflow-x-hidden` 裁剪
- 浮层内容：
  - 顶部一行小字：完整邮箱 `user?.email`（用于在 @ 前缀之外仍可见全地址）
  - 一条 1px 分隔线
  - "退出 / Logout" 按钮（点击后 `logout()` 并关闭浮层）
- 浮层样式：`fixed w-56 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden`
- 点击浮层外部或点击"退出"按钮后自动关闭
- 滚动页面 / 改变窗口尺寸时重新计算浮层位置
- 移动端汉堡浮层已有用户区域，按需同步显示邮箱前缀

#### Scenario: 桌面端打开用户菜单
- **WHEN** 屏幕宽度 ≥ 640px 且用户点击"用户胶囊"
- **THEN** 浮层在胶囊下方展开，顶部显示完整邮箱、底部显示"退出"按钮

#### Scenario: 桌面端点击外部关闭
- **WHEN** 浮层处于打开状态且用户点击页面其它位置
- **THEN** 浮层自动关闭

#### Scenario: 桌面端退出登录
- **WHEN** 浮层处于打开状态且用户点击"退出"按钮
- **THEN** 调用 `logout()` 跳转到登录页

### Requirement: 用户邮箱仅显示 @ 前部分
系统 SHALL 在桌面端顶栏"用户胶囊"与移动端汉堡浮层中均仅显示用户邮箱 `@` 前面的部分。
- 显示内容：`user?.email?.split('@')[0]`（无 `@` 时整段显示）
- 完整邮箱仍在桌面端下拉浮层顶部可见（用于核对）
- 移动端浮层也可选地只显示前缀以保持视觉一致

#### Scenario: 长邮箱访问
- **WHEN** 用户邮箱为 `verylongusername12345@gmail.com`
- **THEN** 顶栏仅显示 `verylongusername12345`，不再占用超过 ~120px 横向空间

#### Scenario: 极短邮箱访问
- **WHEN** 用户邮箱为 `a@b.com`
- **THEN** 顶栏显示 `a`（即 `a`），不显示 `@` 与后续字符

### Requirement: 顶栏桌面端布局：链接靠左、用户胶囊靠右
系统 SHALL 让桌面端顶栏（≥ 640px）的 Tab 链接在视觉上靠左对齐，仅用户胶囊在视觉上靠右对齐。
- 外层 flex 容器从 `justify-end` 改为 `justify-between`
- Tab 链接容器（首页 / 新建 / 导出 / 导入数据 / 设置 / 语言切换）保持左侧自然排列
- 用户胶囊容器 `ml-auto` 推到右侧
- 移动端（< 640px）下行为不变：只有汉堡按钮，整行由 `justify-end` 改为 `justify-between`（左空 + 右汉堡按钮）
- 顶栏高度、背景、边框保持不变

#### Scenario: 桌面端访问
- **WHEN** 屏幕宽度 ≥ 640px
- **THEN** 顶栏左侧为 Tab 链接（首页 / 新建 / 导出 / 导入数据 / 设置 / 中文 / English），右侧为用户胶囊

#### Scenario: 移动端访问
- **WHEN** 屏幕宽度 < 640px
- **THEN** 顶栏右侧为汉堡按钮，左侧留白

## MODIFIED Requirements

### Requirement: 顶栏整体
将原本 "左侧激励语 + 右侧 Tab 平铺" 的桌面端布局，改为：
- 桌面端：左侧无文字，右侧 Tab 平铺（每个 Tab 仅一行中文 / 英文）
- 移动端：左侧无文字，右侧汉堡按钮；浮层内含全部 Tab 与用户操作

## REMOVED Requirements

### Requirement: 顶栏左侧激励语块
**Reason**: 将激励语从顶栏转移到首页 Hero 副标题位置后，顶栏左侧不再需要文字

**Migration**: 不需要迁移，直接删除 `App.tsx` 中 Navigation 顶部的 "让每一次的发生都有迹可循。" / "Make every 'happening' traceable." / "—— TEAM 8009." 文案块

### Requirement: 首页 Hero 副标题 "工程进度管理!"
**Reason**: 与原顶栏激励语 "让每一次的发生都有迹可循。" 语义重复；改为更直观的品牌口号

**Migration**: 不需要迁移，直接在 `Home.tsx` 中把 `{language === 'zh' ? '工程进度管理!' : 'Engineering Notes Management!'}` 替换为原激励语 + "—— TEAM 8009."

### Requirement: 顶栏"导出数据"按钮
**Reason**: 顶栏已有"导出" Tab 跳转到 `/export` 页面，把 JSON 导出整合到该页面内可减少顶栏冗余操作
**Migration**: JSON 导出功能由 `ExportPage` 顶部新加的"导出 JSON"按钮承担；`App.tsx` 中 `handleExport` 函数被同步删除（如果其他地方无引用）

### Requirement: 顶栏独立"退出 / Logout"按钮
**Reason**: 退出登录是低频操作，与"用户胶囊"合并后可减少顶栏视觉噪声；用户胶囊自身作为点击区域更直观
**Migration**: 退出登录功能由"用户胶囊"下拉菜单承担；`App.tsx` 顶栏桌面端右侧的独立"退出"按钮被同步删除

## REMOVED Requirements

### Requirement: 顶栏 Tab 双语副标题
**Reason**: 占用横向空间且在移动端会导致溢出；移除以提升窄屏可读性

**Migration**: 不需要迁移；用户仍可通过语言切换按钮在中文 / 英文之间切换

### Requirement: 导出 HTML 头部 slogan
**Reason**: 与新顶栏文案不一致；UI 改动后 slogan 段落成为遗留样式
**Migration**: 移除 `ExportPage.tsx` 中 `htmlContent` 模板里的 `<div class="header">` 块
