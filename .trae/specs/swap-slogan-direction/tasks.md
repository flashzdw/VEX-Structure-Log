# Tasks

- [ ] Task 1: 删除 `src/App.tsx` 顶栏左侧的 "工程进度管理!" 文本块
  - [ ] SubTask 1.1: 删除整块 `<div className="flex items-center text-gray-900 font-semibold text-base sm:text-lg whitespace-nowrap">工程进度管理!</div>`
  - [ ] SubTask 1.2: 保持 `<div className="flex items-center justify-between h-20">` 容器不变；右侧 Tab / 汉堡按钮不受影响

- [ ] Task 2: 替换 `src/pages/Home.tsx` Hero 副标题
  - [ ] SubTask 2.1: 把 `<p className="text-base text-gray-500">{language === 'zh' ? '工程进度管理!' : 'Engineering Notes Management!'}</p>` 替换为两行：
    - 第一行（主标语）：`<p className="text-base text-gray-500">{language === 'zh' ? '让每一次的发生都有迹可循。' : 'Make every "happening" traceable.'}</p>`
    - 第二行（TEAM 8009）：`<p className="text-sm text-gray-400 mt-1">—— TEAM 8009.</p>`

- [ ] Task 3: 恢复 `src/pages/ExportPage.tsx` 导出 HTML 模板的 slogan header
  - [ ] SubTask 3.1: 在 `<body>` 顶部（`<div class="title-section">` 之前）恢复：
    ```html
    <div class="header">
      <div class="slogan">让每一次的发生都有迹可循。</div>
      <div class="team">—— TEAM 8009.</div>
    </div>
    ```
  - [ ] SubTask 3.2: 在内联 `<style>` 中恢复 `.header` / `.slogan` / `.team` 三条 CSS 规则（与原版一致）

- [ ] Task 4: 构建与冒烟验证
  - [ ] SubTask 4.1: 运行 `npm run check` 通过
  - [ ] SubTask 4.2: 运行 `npm run build` 通过
  - [ ] SubTask 4.3: 代码审查确认：
    - App.tsx 顶栏左侧为空
    - Home.tsx Hero 副标题为激励语 + TEAM 8009
    - ExportPage.tsx 导出的 HTML 包含 header 段落

# Task Dependencies
- Task 1 / 2 / 3 互相独立，可并行
- Task 4 在所有改动后执行
