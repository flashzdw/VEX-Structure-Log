# RecordForm 手机端字段重叠 & 大小不一问题根治方案

## 摘要
网站 `/new`（新建记录）页面在真机（iPhone Safari / Android Chrome / 微信 / PWA standalone）上，"日期 / 负责人 / 模块 / 队伍" 4 个输入框出现**水平重叠**与**宽度不一致**的视觉错位，但在桌面浏览器开发者模式下复现不到。本方案在不替换 2 列布局的前提下，通过 CSS 兜底 + 组件样式微调，从根因层解决该问题。

## 当前状态分析

### 关键代码位置
- [RecordForm.tsx#L266-L314](file:///workspace/src/pages/RecordForm.tsx#L266-L314)：日期 + 负责人 行的 grid
- [RecordForm.tsx#L315-L348](file:///workspace/src/pages/RecordForm.tsx#L315-L348)：模块 + 队伍 行的 grid
- [index.css](file:///workspace/src/index.css)：全局样式（无 form input 相关兜底规则）
- [index.html#L6](file:///workspace/index.html#L6)：viewport meta 正确（`width=device-width, initial-scale=1.0`）
- [vite.config.ts#L26-L61](file:///workspace/vite.config.ts#L26-L61)：PWA `display: standalone`，iOS 添加到主屏后**不再走 Safari 引擎布局**，viewport 计算走 standalone 路径

### 现有结构
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
  <div className="min-w-0">
    <input type="date" className="block w-full min-w-0 max-w-full box-border ... truncate" />
  </div>
  <div className="min-w-0">
    <input type="text" className="block w-full min-w-0 max-w-full box-border ... truncate" />
  </div>
</div>
```

## 根本原因（Why 真机复现、桌面复现不到）

iOS Safari / WKWebView（含 PWA standalone 模式、微信 X5 内核）对 `<input type="date">` 在 user-agent stylesheet 里**硬编码了 `min-content` size ≈ 138px**。这个尺寸：
1. **不能用 `min-w-0` 覆盖**——`min-w-0` 控制的是 `min-width` 属性，而 iOS 的 138px 是通过 `intrinsic min-content` 强制的，需要把容器本身也设为 `min-w-0` 才生效。
2. **桌面 Chrome 不存在这个 138px 限制**——所以 devtools 模拟手机时（即使 iPhone preset）也复现不到。必须用真机 Safari、PWA standalone、微信 X5 才会触发。
3. **后果**：date 单元格被撑到 138px+，导致 grid 容器总宽超过父级，相邻 select 被推到右边溢出，进而两列输入框水平重叠；同时 date input 的"年/月/日"分段与 select 的 native chrome 高度不同，所以"大小不一"。

Android 上次要原因：原生 `<select>` 在不同 ROM 的 padding/字号差异 + 同样受 `min-content` 限制。

## 拟修改内容

### 1. `src/index.css` — 追加 form input 全局兜底（治本）

在文件末尾追加：

```css
/* ==== 修复 form input 在 iOS / Android 上的强制最小宽度 ==== */
@layer base {
  /* 关键：min-w-0 必须在容器 + 输入框都设置 */
  input,
  select,
  textarea {
    min-width: 0;
    max-width: 100%;
  }

  /* iOS Safari date / datetime input 的 138px min-content 兜底 */
  input[type="date"],
  input[type="datetime-local"],
  input[type="time"],
  input[type="month"] {
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }

  /* iOS focus 时字号必须 ≥ 16px，否则浏览器自动放大导致布局抖动 */
  @supports (-webkit-touch-callout: none) {
    input,
    select,
    textarea {
      font-size: 16px;
    }
  }
}
```

### 2. `src/pages/RecordForm.tsx` — 4 处输入框的样式微调

针对 4 个 form 控件（日期 input、负责人 input、模块 select、队伍 select）：

**a. 输入框字号 `text-sm` → `text-base`（避免 iOS focus 缩放）**
- 第 277 行
- 第 301 行
- 第 324 行
- 第 340 行

把 `rounded-full text-sm focus:outline-none` 改为 `rounded-full text-base focus:outline-none`。

**b. 移除 `truncate` 类（与 iOS date input 内部 layout 冲突）**
- 第 277 行（date input）
- 第 301 行（author input）
- 第 324 行（module select）
- 第 340 行（team select）

把 `... truncate"` 末尾的 ` truncate` 去掉。改为 `..." />`。

**c. 容器 div 增加 `w-full`（让 min-w-0 真正生效的关键）**
- 第 267 行 `<div className="min-w-0">` → `<div className="min-w-0 w-full">`
- 第 290 行 同上
- 第 316 行 同上
- 第 333 行 同上

**d. Grid 容器保持 `grid-cols-1 sm:grid-cols-2` 不动**（用户截图显示的就是 sm 触发后的 2 列状态，保留响应式行为）

### 3. 涉及文件汇总

| 文件 | 改动量 | 性质 |
|------|--------|------|
| [src/index.css](file:///workspace/src/index.css) | 末尾追加 1 个 `@layer base` 块 | CSS 兜底 |
| [src/pages/RecordForm.tsx](file:///workspace/src/pages/RecordForm.tsx) | 4 个输入框 × 3 处微调 + 4 个容器 | 组件样式 |

## 假设与决策

| # | 决策 | 理由 |
|---|------|------|
| 1 | **保留 2 列布局**（`sm:grid-cols-2`） | 用户明确选择"保留 2 列 + 严格宽度约束" |
| 2 | **不替换 `<input type="date">` 为自定义控件** | 保留原生 iOS / Android 滚轮式日期选择器 UX，是该项目的核心体验 |
| 3 | **字号从 `text-sm`(14px) 升到 `text-base`(16px)** | 兜底 iOS focus 自动放大；输入框会略高 ~2px，是可接受代价 |
| 4 | **移除 `truncate`** | placeholder 是中文短句，值最长就是日期"Jun 9, 2026"，不需要截断；`truncate` 在 iOS date input 上会与内部日历按钮的 hit area 冲突 |
| 5 | **在 `index.css` 写全局兜底而非 RecordForm 局部** | 后续 Settings、RecordDetail、Login 表单都受益，避免再踩一次坑 |
| 6 | **不引入新依赖** | 纯 CSS 修复，零 bundle 增量 |

## 验证步骤

按以下顺序逐项验证，全部通过才算修复完成：

1. **桌面 Chrome devtools（基线回归）**
   - 打开 http://localhost:5174/new
   - iPhone 12/14 Pro preset 切换宽度 390/414px，确认**单一列**布局（grid-cols-1），4 个输入框等宽无重叠
   - 切到 ≥ 640px，确认**两列**布局，输入框等高

2. **iPhone Safari 真机**（问题设备，**关键**）
   - 加入主屏后用 PWA standalone 模式打开
   - 进入"新建记录"，确认 4 个输入框整齐 2×2 排列
   - 点击日期输入框，弹出原生日期选择器，确认输入框不缩放
   - 选择一个日期后返回，确认输入框宽度稳定无抖动

3. **Android Chrome 真机**（次关键）
   - 重复上述操作
   - 特别注意模块 / 队伍下拉框，弹出的 native picker 不应导致外层错位

4. **微信内嵌浏览器**
   - 分享页面到微信，从聊天里点开
   - 验证布局正确

5. **构建产物验证**
   - `pnpm build` 通过，无 TS / lint 报错
   - 产出 CSS 中包含新增的 `min-width: 0` / `font-size: 16px` 规则

## 风险与回退

| 风险 | 概率 | 影响 | 回退方案 |
|------|------|------|----------|
| 字号 14→16px 导致输入框略高，与其他 UI 不协调 | 低 | 视觉 | 单独把 date input 字号调回 14px，验证不影响布局 |
| 移除 `truncate` 后超长内容溢出 | 极低 | 视觉 | 加 `text-ellipsis` 单类替代（不带 `white-space:nowrap`） |
| 全局 CSS 影响其他页面（Settings / Login） | 低 | 视觉 | 截屏对比 4 个页面 |

如回退：仅需还原 [src/pages/RecordForm.tsx](file:///workspace/src/pages/RecordForm.tsx) 4 处微调，并清空 [src/index.css](file:///workspace/src/index.css) 末尾追加的块即可。
