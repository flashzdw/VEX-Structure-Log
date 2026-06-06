<<<<<<< HEAD
# vex-structure-log
vex-structure-log
=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```
>>>>>>> a2aee5e (feat: 初始化 VIQRC 工程进度管理应用)

---

## 后端：Supabase

本项目使用 [Supabase](https://supabase.com) 作为后端（PostgreSQL + Auth + Storage + Realtime），前端通过 `@supabase/supabase-js` SDK 接入。所有凭证**不硬编码**，统一通过 Vite 环境变量 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY` 注入。

### 1. 创建 Supabase 项目
1. 打开 https://supabase.com/dashboard ，新建一个项目（记住设置的数据库密码）。
2. 进入 `Project Settings → API`，复制：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 1.5 关闭邮箱确认（推荐）
为了本地开发与测试方便，建议在 Supabase 控制台关闭邮箱确认：
1. 左侧菜单 `Authentication` → `Providers` → `Email`
2. 找到 `Confirm email` 选项，**关闭**（Disable）
3. 点击 `Save` 保存

> 关闭后，注册时不再需要验证邮箱，可以直接登录。生产环境请根据需要重新开启。

### 2. 初始化数据库（一次性）
进入 Supabase 项目的 `SQL Editor`，执行以下 SQL：

```sql
-- 队伍表
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 队伍成员表
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  role text not null check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- 记录表
create table public.records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  author text not null,
  module text not null check (module in ('底盘','抓手','弹射','升降','其他')),
  team_id uuid references public.teams(id) on delete set null,
  reason text default '',
  content text default '',
  photos text[] default '{}',
  test_result text default '',
  problems text default '',
  next_steps text default '',
  rating int default 0,
  milestone boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.records enable row level security;

create policy "teams read" on public.teams for select using (auth.role() = 'authenticated');
create policy "teams write" on public.teams for insert with check (auth.uid() = owner_id);
create policy "teams update" on public.teams for update using (auth.uid() = owner_id);

create policy "team_members read" on public.team_members for select using (auth.role() = 'authenticated');
create policy "team_members write" on public.team_members for insert with check (auth.uid() = user_id);

create policy "records read" on public.records for select using (auth.role() = 'authenticated');
create policy "records write" on public.records for insert with check (auth.uid() = created_by);
create policy "records update" on public.records for update using (auth.uid() = created_by);
create policy "records delete" on public.records for delete using (auth.uid() = created_by);

-- Realtime
alter publication supabase_realtime add table public.records;
alter publication supabase_realtime add table public.teams;
```

### 3. 创建照片存储桶
1. 左侧菜单 `Storage` → `New bucket` → 名称 `record-photos` → 勾选 **Public bucket** → 创建。

### 4. 本地开发环境变量
在项目根目录新建 `.env.local`（**已被 `.gitignore` 忽略**，不会进入仓库）：

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key
```

然后：

```bash
npm install
npm run dev
```

### 5. Vercel 部署与环境变量
1. 把代码推送到 GitHub，然后在 https://vercel.com/new 导入仓库（Framework 选 Vite）。
2. 进入 Project → **Settings → Environment Variables**，为以下三种环境分别添加：
   - `VITE_SUPABASE_URL` = `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = 你的 anon public key
   - 可分别勾选 `Production` / `Preview` / `Development`，让 Preview 部署也能连接（推荐三个都勾上，使用同一个 Supabase 项目即可）。
3. 之后每次 `git push` 都会自动部署，无需再改任何源码。

> **小提示**：`VITE_` 前缀的变量在构建时会注入到前端 bundle，因此**必须**使用 anon public key（设计上是公开的，受 RLS 保护），绝不能把 `service_role` key 放到这里。

### 6. 重置本地凭据 / 切换 Supabase 项目
只需要修改 `.env.local` 或在 Vercel 更新环境变量，无需改任何代码。
