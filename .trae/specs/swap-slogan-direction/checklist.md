# Checklist

## App.tsx
- [ ] 顶栏左侧的 "工程进度管理!" `<div>` 文本块已删除
- [ ] 顶栏容器 `<div className="flex items-center justify-between h-20">` 结构不变
- [ ] 桌面端右侧 Tab 链接正常显示
- [ ] 移动端右侧汉堡按钮正常显示

## Home.tsx Hero
- [ ] Hero 副标题（`LEVEL UP🏆` 之下）已替换为 `让每一次的发生都有迹可循。` / `Make every "happening" traceable.`
- [ ] 紧接着显示 `—— TEAM 8009.` 小字
- [ ] 中英文切换正常
- [ ] 字号使用 `text-base text-gray-500`（主）+ `text-sm text-gray-400`（TEAM 行）

## ExportPage.tsx
- [ ] 导出的 HTML 文件顶部恢复 `<div class="header">` 段落
- [ ] header 内含 `.slogan` 与 `.team` 两个子 div
- [ ] 内联 `<style>` 中恢复 `.header` / `.slogan` / `.team` 三条 CSS 规则

## 构建 & 验证
- [ ] `npm run check` 通过
- [ ] `npm run build` 通过
- [ ] 代码审查确认 3 处文件改动正确
