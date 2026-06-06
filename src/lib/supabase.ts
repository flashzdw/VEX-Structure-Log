import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // 使用 console.error 以红色样式输出，便于在浏览器控制台与 Vercel 构建日志中识别
  // eslint-disable-next-line no-console
  console.error(
    '%c[Supabase] 环境变量未配置，请在 Vercel 或 .env.local 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY',
    'color:#dc2626;font-weight:bold;'
  );
}

/**
 * Supabase 客户端单例。
 *
 * 凭证完全通过 Vite 环境变量注入（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY），
 * 仓库中不存在任何硬编码。
 *
 * 即便环境变量缺失，也导出一个占位客户端（指向 supabase.co 的占位 URL），
 * 避免在 Vercel Preview 构建阶段因为环境变量未注入而抛错导致页面崩溃。
 * 真正运行时的调用会因为 URL/Key 无效而返回明确错误。
 */
export const supabase: SupabaseClient = createClient(
  url || 'https://invalid.supabase.co',
  anonKey || 'invalid-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
