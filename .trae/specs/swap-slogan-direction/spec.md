# 调整：标语位置对调

## Why
上一轮 `ui-polish-mobile-and-invite` 实现的语义被反转了：用户原意是"**删除**左上角的标语（`让每一次的发生都有迹可循。/Make every 'happening' traceable.`），把 Hero 中间原 `工程进度管理!` 替换为**原左上角**那条激励语"。

也就是：激励语才是真正想保留并展示的文案，应该放到首页 Hero 中心位置（视觉重心）；左上角清空。

## What Changes
- **App.tsx 顶栏左侧**：删除当前显示的 "工程进度管理!" 文本块（整块 `<div className="flex items-center text-gray-900 font-semibold text-base sm:text-lg whitespace-nowrap">…</div>`）
- **Home.tsx Hero 副标题**：把 `{language === 'zh' ? '工程进度管理!' : 'Engineering Notes Management!'}` 替换回原来的激励语 `让每一次的发生都有迹可循。/Make every 'happening' traceable.`，并保留 `—— TEAM 8009.` 作为小字
- **ExportPage.tsx 导出 HTML 模板**：恢复 `<div class="header">` slogan 段落（与 Home Hero 文案保持一致），并恢复 `.header` / `.slogan` / `.team` 三条 CSS 规则

> **BREAKING**：无 API 字段变动；纯 UI 文案对调。

## Impact
- Affected specs: 顶栏导航、首页 Hero、导出 HTML
- Affected code:
  - `src/App.tsx`（删除顶栏左侧的 `工程进度管理!` 文本块）
  - `src/pages/Home.tsx`（Hero 副标题换为激励语 + TEAM 8009）
  - `src/pages/ExportPage.tsx`（HTML 模板恢复 slogan header）

## ADDED Requirements

### Requirement: 顶栏左侧不再显示任何标语
系统 SHALL 顶栏左侧**不**展示任何标语 / 应用名文本；只保留布局空位（汉堡按钮的左侧）。

#### Scenario: 桌面端访问
- **WHEN** 屏幕宽度 ≥ 640px
- **THEN** 顶栏左侧为空白区域，右侧显示所有 Tab 链接

#### Scenario: 移动端访问
- **WHEN** 屏幕宽度 < 640px
- **THEN** 顶栏左侧为空白区域，右侧显示汉堡按钮

### Requirement: Hero 中间显示激励语
系统 SHALL 首页 Hero 卡片的副标题（`LEVEL UP🏆` 与 `2026-2027 VIQRC` 之下）展示原来的激励语：
- 中文：`让每一次的发生都有迹可循。`
- 英文：`Make every 'happening' traceable.`
- 紧接着一行小字：`—— TEAM 8009.`
- 字号使用 `text-base text-gray-500`，与原 Hero 副标题一致

#### Scenario: 中文环境
- **WHEN** `language === 'zh'`
- **THEN** Hero 副标题显示 `让每一次的发生都有迹可循。` 与 `—— TEAM 8009.`

#### Scenario: 英文环境
- **WHEN** `language === 'en'`
- **THEN** Hero 副标题显示 `Make every 'happening' traceable.` 与 `—— TEAM 8009.`

### Requirement: 导出 HTML 恢复 slogan header
系统 SHALL 导出 HTML 文件的 `<body>` 顶部恢复 `<div class="header">` 段落，包含 slogan 与 `—— TEAM 8009.`，与 Home Hero 文案一致；同时恢复内联 `<style>` 中 `.header` / `.slogan` / `.team` 三条 CSS 规则。

#### Scenario: 导出 HTML
- **WHEN** 用户在 ExportPage 点击 "导出HTML文件"
- **THEN** 下载的 HTML 顶部包含 slogan 段落（带下划线分隔），CSS 规则完整

## MODIFIED Requirements
无（属于文案 / 视觉层微调）。

## REMOVED Requirements

### Requirement: 顶栏左侧 "工程进度管理!" 标题
**Reason**: 与本轮调整方向相反：用户希望顶栏保持干净，激励语放到 Hero 中心
**Migration**: 删除 `App.tsx` 中 Navigation 顶部的 `<div className="flex items-center text-gray-900 font-semibold text-base sm:text-lg whitespace-nowrap">工程进度管理!</div>` 整块

### Requirement: Hero 副标题 "工程进度管理!" / "Engineering Notes Management!"
**Reason**: 这条文案是占位文案，用户希望用真正的激励语替换
**Migration**: 替换为 `让每一次的发生都有迹可循。` / `Make every 'happening' traceable.` + `—— TEAM 8009.`
