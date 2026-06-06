# Tasks

- [x] Task 1: 安装 Supabase 依赖并移除 PocketBase
  - [x] SubTask 1.1: 运行 `npm install @supabase/supabase-js`
  - [x] SubTask 1.2: 运行 `npm uninstall pocketbase`
  - [x] SubTask 1.3: 确认 `package.json` 中 `pocketbase` 已移除，`@supabase/supabase-js` 已加入

- [x] Task 2: 新增 Supabase 客户端单例与类型定义
  - [x] SubTask 2.1: 在 `src/vite-env.d.ts` 中为 `ImportMetaEnv` 补充 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY` 的类型声明
  - [x] SubTask 2.2: 创建 `src/lib/supabase.ts`，读取 `import.meta.env.VITE_SUPABASE_URL` / `..._ANON_KEY` 创建 `createClient`，并在缺失时打印明确错误

- [x] Task 3: 实现 `src/api/supabase.ts` 业务层
  - [x] SubTask 3.1: 导出与原 `pocketbase.ts` 同名的接口：`getRecords / addRecord / updateRecord / deleteRecord / getTeams / addTeam / updateTeam / deleteTeam / joinTeamByInviteCode / registerUser / loginUser / logoutUser / isAuthenticated / getCurrentUser / subscribeToRecords / subscribeToTeams`
  - [x] SubTask 3.2: `addRecord` 中处理照片上传：dataURL → Blob → `supabase.storage.from('record-photos').upload(...)` → 写入返回的 public URL
  - [x] SubTask 3.3: Realtime 使用 `supabase.channel('records').on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, cb).subscribe()`

- [x] Task 4: 重写 `src/store-supabase.ts` 替代 `store-pocketbase.ts`
  - [x] SubTask 4.1: 拷贝原 `store-pocketbase.ts` 全部 store 字段、validateRecord、sanitizeRecord、importData、exportData、getStatistics 逻辑
  - [x] SubTask 4.2: 将所有 `pb` 调用改为新 `supabase` 接口
  - [x] SubTask 4.3: 保留 initialize 时注册 Realtime 订阅的行为

- [x] Task 5: 更新引用方
  - [x] SubTask 5.1: `src/App.tsx` import 改为 `./store-supabase`
  - [x] SubTask 5.2: 搜索并替换其他 import `./store-pocketbase`（如 `Login.tsx`、`RecordForm.tsx` 等）
  - [x] SubTask 5.3: 删除 `src/api/pocketbase.ts` 与 `src/store-pocketbase.ts`

- [x] Task 6: 配置文件与文档
  - [x] SubTask 6.1: 新增 `.env.example`，内容为 `VITE_SUPABASE_URL=` 与 `VITE_SUPABASE_ANON_KEY=` 两行
  - [x] SubTask 6.2: 确认 `.gitignore` 仍忽略 `.env.local` 等
  - [x] SubTask 6.3: 在 `README.md` 追加"Vercel 部署与环境变量"小节，并贴上 spec 中的初始化 SQL

- [x] Task 7: 构建与冒烟验证
  - [x] SubTask 7.1: 运行 `npm run check`（TS 类型检查）通过
  - [x] SubTask 7.2: 运行 `npm run build` 通过
  - [x] SubTask 7.3: 在 `.env.local` 写入占位 URL/Key 后 `npm run dev`，控制台不出现未捕获错误（占位实现不抛错；待真实环境变量时正常工作）

# Task Dependencies
- Task 3 依赖 Task 2 ✅
- Task 4 依赖 Task 3 ✅
- Task 5 依赖 Task 4 ✅
- Task 6 与 Task 7 独立，但 Task 7 必须在所有代码改动后执行 ✅
