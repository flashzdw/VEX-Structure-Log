# Checklist

- [x] `package.json` 中 `pocketbase` 已移除，`@supabase/supabase-js` 已加入
- [x] `src/lib/supabase.ts` 存在并导出 `supabase` 单例
- [x] `src/lib/supabase.ts` 在环境变量缺失时输出明确控制台错误
- [x] `src/api/supabase.ts` 完整实现 Records / Teams / Auth / Realtime 接口
- [x] `src/store-supabase.ts` 完成，所有原 `store-pocketbase.ts` 的业务方法都已迁移
- [x] `src/api/pocketbase.ts` 与 `src/store-pocketbase.ts` 已删除
- [x] `App.tsx` 与所有页面文件 import 已指向 `store-supabase`
- [x] `.env.example` 列出 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`
- [x] `.gitignore` 仍忽略 `.env.local` / `.env.production`
- [x] `README.md` 包含"Vercel 部署与环境变量"小节 + Supabase 初始化 SQL
- [x] 仓库中**不存在**任何硬编码的 Supabase URL 或 anon key（已通过 `Grep` 验证）
- [x] `npm run check` 通过
- [x] `npm run build` 通过
