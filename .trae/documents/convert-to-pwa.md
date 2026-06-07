# 把网站改为 PWA 应用

## 摘要

把当前 VEX Structure Log（React 18 + Vite + Supabase 单页应用）改造为符合标准的 PWA：可"添加到主屏幕"、离线时仍可访问最近浏览过的页面与缓存的资源。核心做法是引入社区事实标准的 `vite-plugin-pwa`（基于 Workbox），移除与 Service Worker 冲突的 `vite-plugin-singlefile`，并基于现有 `favicon.svg` 自动生成全套应用图标。

## 当前状态分析

通过 Phase 1 探索得到的实际情况：

- **项目类型**：[package.json](file:///workspace/package.json) — React 18.3 + Vite 6.3 + TypeScript 5.8 + Tailwind 3.4 + Supabase + HashRouter。
- **入口与 HTML**：[index.html](file:///workspace/index.html) — 极简模板，没有 manifest / theme-color / apple-touch-icon 等 PWA 所需的 meta。
- **关键冲突**：[vite.config.ts](file:///workspace/vite.config.ts#L26-L28) 启用了 `vite-plugin-singlefile`，把全部 JS / CSS / 资源内联到一个 HTML 文件中。Service Worker 只能通过真实的网络 URL 缓存资源，因此必须移除该插件。
- **图标**：[public/favicon.svg](file:///workspace/public/favicon.svg) 是 512×512 的 SVG，可直接作为 PWA 图标源。
- **路由**：[src/App.tsx](file:///workspace/src/App.tsx#L2) 使用 `HashRouter`，Service Worker 只需缓存一个 HTML 入口即可覆盖所有路由，离线场景天然友好。
- **后端**：[src/lib/supabase.ts](file:///workspace/src/lib/supabase.ts) + [src/api/supabase.ts](file:///workspace/src/api/supabase.ts) — Supabase Auth / Database / Storage。离线写操作（创建 / 编辑记录）不在本次范围。
- **部署**：[vercel.json](file:///workspace/vercel.json) — Vercel 自动 HTTPS，rewrites 把所有路径回退到 `/index.html`，完美适配 SPA + PWA。
- **i18n**：[src/i18n.ts](file:///workspace/src/i18n.ts) — 中英双语，PWA manifest 的 `lang` / `name` 也需要同步处理。
- **现状**：仓库内无 `manifest`、无 `service worker`、无应用图标，Grep `manifest|serviceWorker|workbox|pwa` 零命中。

## 提出的变更

### 1. 依赖调整

**文件**：[package.json](file:///workspace/package.json)

- 新增 `vite-plugin-pwa` (^0.21.x) 作为运行时 / 构建期依赖。
- 移除 `vite-plugin-singlefile`（devDependencies），它与 Service Worker 不兼容。
- 不新增图标生成 CLI 依赖；图标生成通过内联 `sharp` 在 `prebuild` / 构建时按需触发，或在 CI 阶段一次性跑出静态 PNG 提交进 `public/`。**推荐后者**，避免每个开发者在本地多装一个 ~30 MB 的 `sharp`。

### 2. Vite 配置接入 PWA 插件

**文件**：[vite.config.ts](file:///workspace/vite.config.ts)

移除 `viteSingleFile()` 引入与 `plugins` 数组里的调用，新增 `VitePWA` 配置，关键项：

- `registerType: 'autoUpdate'` — 新版本部署后自动激活，零运维。
- `includeAssets`: `['favicon.svg', 'robots.txt', 'apple-touch-icon.png']` — 一起 precache。
- `manifest`:
  - `name: 'VEX Structure Log'` / `short_name: 'VEX Log'`
  - `description: 'VEX 机器人工程进度记录与团队协作'`
  - `lang: 'zh-CN'` / `dir: 'ltr'`
  - `theme_color: '#1F2937'`（来自 favicon 中 `iconBody` 渐变起始色，与网站 `text-gray-900` 一致）
  - `background_color: '#FFFFFF'`
  - `display: 'standalone'` / `orientation: 'portrait'`
  - `start_url: '/'` / `scope: '/'`
  - `icons`: 192×192、512×512 两张 PNG + 一张 512×512 的 `purpose: 'maskable'` 图标
- `workbox`:
  - `globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}']`
  - `cleanupOutdatedCaches: true`
  - `clientsClaim: true` / `skipWaiting: true`
  - **runtime caching rules**：
    1. Supabase REST (`https://*.supabase.co/rest/v1/**`)：`NetworkFirst`，超时 5 s，最多 50 条，缓存名 `supabase-api`。
    2. Supabase Storage 图像 (`https://*.supabase.co/storage/v1/object/**` 与 `https://*.supabase.co/storage/v1/render/**`)：`CacheFirst`，30 天过期，最多 200 条，缓存名 `supabase-images`。
    3. Google Fonts（如有引入 woff2）：`CacheFirst`，1 年。

为什么这样设计：工程笔记页面的列表 / 详情属于已认证用户的数据，离线命中可显著降低等待；写操作（新建 / 编辑）走 NetworkFirst，失败时由应用层 `src/store-supabase.ts` 已有错误处理暴露给用户，后续若要补"离线写队列"是另一个独立任务。

### 3. 生成 PWA 应用图标

**新增文件**：[public/pwa-192x192.png](file:///workspace/public/pwa-192x192.png)、[public/pwa-512x512.png](file:///workspace/public/pwa-512x512.png)、[public/pwa-maskable-512x512.png](file:///workspace/public/pwa-maskable-512x512.png)、[public/apple-touch-icon.png](file:///workspace/public/apple-touch-icon.png)。

**做法**（执行阶段一次性生成，提交进仓库）：

- 使用 `sharp` 把 [favicon.svg](file:///workspace/public/favicon.svg) 渲染为 192 / 512 两张 PNG。
- maskable 版本：把 512 PNG 缩放到 410×410，居中嵌入 512×512 透明画布（保留 20% 安全区，遵循 maskable.app 规范）。
- apple-touch-icon 直接复用 180×180 缩放（iOS 自动圆角，无需额外处理）。
- 执行命令草案：
  ```bash
  npx --yes sharp-cli -i public/favicon.svg -o public/pwa-192x192.png resize 192 192
  npx --yes sharp-cli -i public/favicon.svg -o public/pwa-512x512.png resize 512 512
  # maskable 与 apple-touch-icon 用一个简短的 Node 脚本 + sharp 完成
  ```
- 后续维护：`favicon.svg` 改变时，开发者只需重新跑一次图标生成脚本（可在 README 里写一句说明，不新增构建期依赖）。

### 4. HTML 模板补 PWA Meta

**文件**：[index.html](file:///workspace/index.html)

新增以下 `<link>` / `<meta>`（按 PWA 最佳实践顺序）：

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#1F2937" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#1F2937" media="(prefers-color-scheme: dark)" />
<meta name="description" content="VEX 机器人工程进度记录与团队协作" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="VEX Log" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="format-detection" content="telephone=no" />
<meta name="mobile-web-app-capable" content="yes" />
```

- `<title>` 保留 `VEX Structure Log`。
- 注意：`manifest.webmanifest` 由 `vite-plugin-pwa` 在构建期生成，运行时由插件把对应 `<link rel="manifest">` 注入；这里保留显式声明可以保证 dev 模式也能正常显示。

### 5. 注册 Service Worker

**新增文件**：[src/registerSW.ts](file:///workspace/src/registerSW.ts) — 30 行左右的封装：

- 监听 `onNeedRefresh` / `onOfflineReady` 事件。
- 现阶段**不**做自定义 UI 提示（用户没要求），仅在控制台打 log；如果后续要做"有新版本可更新"的 toast 横幅，扩展点已经预留。
- 在 [src/main.tsx](file:///workspace/src/main.tsx#L1) 顶部 `import './registerSW'` 即可（dev 模式下插件默认不注册，仅在 `npm run build && npm run preview` 或 Vercel 部署时生效，符合 Vite 标准做法）。

### 6. 部署 / 缓存头

**文件**：[vercel.json](file:///workspace/vercel.json)

在现有 `headers` 数组中追加：

- `/sw.js`、`/registerSW.js`、`/workbox-*.js` → `Cache-Control: public, max-age=0, must-revalidate`（避免旧 SW 被长期缓存）。
- `/manifest.webmanifest` → `Content-Type: application/manifest+json`（Vercel 默认会按扩展名猜，可能不准确，显式声明更稳）。
- 保留现有 `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` 不动。

### 7. 不在范围内（明确排除）

- 离线写操作队列 / 冲突合并（属于 Supabase offline-sync 独立任务）。
- `beforeinstallprompt` 自定义安装按钮（用户没要求，浏览器原生提示已足够）。
- Push Notifications（VAPID + Edge Function 链路较重，且对核心使用场景价值有限）。
- 多语言 manifest 字段切换（`i18n.ts` 已存在，但 PWA `name` 是 OS 级静态字符串，按 zh-CN 固定即可）。

## 假设与决策

1. **移除 `vite-plugin-singlefile` 不影响功能** — 该插件只影响"打包成单文件"的部署方式，对运行时无影响；Vercel 上正常托管多文件资源没有额外成本。
2. **离线仅服务"读"，写操作失败由应用层报错** — 与现有 `src/store-supabase.ts` 错误处理一致，避免引入新同步状态机。
3. **图标自动生成走"一次性脚本 + 提交产物"路线** — 避免把 `sharp`（~30 MB）纳入 devDependencies / install 流程。
4. **SW 使用 `autoUpdate` 策略** — 工程笔记应用不需要"用户手动确认更新"；新版本下次访问自动生效。
5. **不再引入 `react-router` 的 PWA 路由监听** — HashRouter 下任何路径都对应同一个 HTML 入口，SW 一次缓存即覆盖所有路由。

## 验证步骤

按以下顺序逐项验证，任意一步失败都需要回到对应章节修复：

1. **本地构建**：`npm run build` 成功，控制台出现 `PWA v... generated sw.js ...` 与 `manifest.webmanifest` 输出。
2. **产物检查**：`dist/manifest.webmanifest`、`dist/sw.js`、`dist/pwa-192x192.png`、`dist/pwa-512x512.png`、`dist/pwa-maskable-512x512.png`、`dist/apple-touch-icon.png` 均存在且非 0 字节。
3. **本地预览**：`npm run preview`（必须 preview，dev 模式 SW 不会注册），浏览器打开后 DevTools → Application → Service Workers 显示 SW 已激活。
4. **Manifest 校验**：DevTools → Application → Manifest 显示名称、图标、start_url 正确，主题色与 favicon 主色一致；用 [https://manifest-validator.appspot.com/](https://manifest-validator.appspot.com/) 跑一次零 warning。
5. **离线场景**：
   - 登录 → 进入首页加载若干条记录（让 API 进缓存）。
   - DevTools → Network 切到 Offline。
   - 刷新页面：HTML / JS / CSS 仍能加载（precache 命中），已访问过的列表 / 详情仍可看到。
   - 点击"新建"并提交：看到应用层 `supabase.ts` 抛出的网络错误（验证"写不在离线范围"假设）。
6. **可安装性**：
   - Chrome 桌面 / Android Chrome：地址栏出现"安装"图标，点击后能完成安装。
   - iOS Safari：分享菜单出现"添加到主屏幕"，主屏图标显示 `apple-touch-icon`，启动后无 Safari UI 顶栏（`apple-mobile-web-app-capable=yes` 生效）。
7. **类型与 lint**：`npm run check`（已存在的 `tsc -b --noEmit`）与 `npm run lint` 均通过。
8. **部署冒烟**：推送到 GitHub → Vercel 自动部署 → 真实域名下重复步骤 3–6。

## 涉及文件清单

- 改：[package.json](file:///workspace/package.json)
- 改：[vite.config.ts](file:///workspace/vite.config.ts)
- 改：[index.html](file:///workspace/index.html)
- 改：[src/main.tsx](file:///workspace/src/main.tsx)
- 改：[vercel.json](file:///workspace/vercel.json)
- 增：[src/registerSW.ts](file:///workspace/src/registerSW.ts)
- 增：[public/pwa-192x192.png](file:///workspace/public/pwa-192x192.png)
- 增：[public/pwa-512x512.png](file:///workspace/public/pwa-512x512.png)
- 增：[public/pwa-maskable-512x512.png](file:///workspace/public/pwa-maskable-512x512.png)
- 增：[public/apple-touch-icon.png](file:///workspace/public/apple-touch-icon.png)
- 增：图标生成脚本（一次性，提交后即可删除；或保留在 `scripts/` 下供后续维护）
