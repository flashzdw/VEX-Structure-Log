# 将后端从 PocketBase 迁移到 Supabase

## Why
当前 VEX 结构日志系统使用 PocketBase 作为后端，存在以下问题：
- 服务地址硬编码在 `src/api/pocketbase.ts` 中（生产 `http://1247ug121tl26.vicp.fun:12340`，本地 `127.0.0.1:8090`），迁移或更换服务器需要改源码重新部署
- PocketBase 自部署的可靠性、备份、扩展性较差
- 用户希望统一使用 Vercel 环境变量管理后端配置，方便在不同环境（本地 / Preview / Production）切换
- Supabase 提供托管的 PostgreSQL、Auth、Storage、Realtime，与 Vercel 部署的工作流天然契合

本次改造将后端整体替换为 Supabase，并通过 Vite 环境变量注入凭证，使任何敏感信息都不再硬编码到仓库中。

## What Changes
- 移除 `pocketbase` 依赖，新增 `@supabase/supabase-js` 依赖
- 新增 `src/lib/supabase.ts`：根据 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 创建单例 Supabase 客户端
- 新增 `src/api/supabase.ts`：完整替换 `src/api/pocketbase.ts` 的导出接口（记录 CRUD、队伍 CRUD、Auth、加入邀请码、Realtime 订阅）
- 替换 `src/store-pocketbase.ts` → `src/store-supabase.ts`：所有方法改为调用 Supabase API，逻辑保持兼容
- `App.tsx` 改为导入 `store-supabase`
- 新增 `.env.example`：列出所有需要的环境变量
- 更新 `package.json`：移除 `pocketbase`，添加 `@supabase/supabase-js`
- `vercel.json` 不变（仍为 SPA rewrites + 安全头）
- 文档：在 README 中追加"Vercel 环境变量配置"和"Supabase 表结构初始化 SQL"

> **BREAKING**：现有 `src/api/pocketbase.ts` 与 `src/store-pocketbase.ts` 文件被替换为 Supabase 版本；外部接口（`getRecords`、`addRecord`、`loginUser` 等）签名保持一致以最小化业务层改动。PocketBase 服务端不再被使用。

## Impact
- Affected specs: 数据持久化层、用户认证、Realtime 同步、文件存储
- Affected code:
  - `src/api/pocketbase.ts`（被替换为 `src/api/supabase.ts`）
  - `src/store-pocketbase.ts`（被替换为 `src/store-supabase.ts`）
  - `src/App.tsx`（更新 import）
  - `src/lib/`（新增 `supabase.ts` 客户端）
  - `package.json`（依赖切换）
  - `.env.example`（新增）
  - `README.md`（追加部署说明）

## ADDED Requirements

### Requirement: Supabase 客户端单例
系统 SHALL 提供一个 `src/lib/supabase.ts` 模块，导出 `supabase` 单例。
- 客户端使用 `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` 创建
- 当环境变量缺失时，必须在控制台输出明确的错误提示（不抛错阻塞启动，方便 Vercel Preview 构建通过）
- 浏览器内 `localStorage` 自动持久化登录态（Supabase JS SDK 默认行为，无需额外代码）

#### Scenario: 缺失环境变量
- **WHEN** `VITE_SUPABASE_URL` 或 `VITE_SUPABASE_ANON_KEY` 未设置
- **THEN** 控制台输出红色错误："[Supabase] 环境变量未配置，请在 Vercel 或 .env.local 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY"
- **AND** `supabase` 仍被导出（占位客户端），但所有调用都会返回明确错误

#### Scenario: 正常加载
- **WHEN** 环境变量完整
- **THEN** `supabase` 单例被正确初始化，业务模块可以直接 `import { supabase } from '../lib/supabase'`

### Requirement: 记录（Records）数据访问
系统 SHALL 通过 Supabase 客户端实现记录 CRUD。

#### Scenario: 查询当前队伍下的记录
- **WHEN** 调用 `getRecords(teamId)`
- **THEN** 查询 `records` 表，filter 为 `team_id = '${teamId}'`，按 `created_at` 降序，返回转换后的 `Record[]`

#### Scenario: 新建记录
- **WHEN** 调用 `addRecord(record)`
- **THEN** 插入 `records` 表，附带当前 `user.id` 到 `created_by` 字段

#### Scenario: 更新 / 删除记录
- **WHEN** 调用 `updateRecord(id, ...)` 或 `deleteRecord(id)`
- **THEN** 操作对应行；RLS 策略保证只有 owner 或同队成员可改

### Requirement: 队伍（Teams）与成员关系
系统 SHALL 用 `teams` 与 `team_members` 两张表维护多对多关系。

#### Scenario: 创建队伍
- **WHEN** 调用 `addTeam(name)`
- **THEN** 在 `teams` 插入一行（`owner_id = currentUser.id`，自动生成 8 位邀请码），并在 `team_members` 插入一行（role = `owner`）

#### Scenario: 通过邀请码加入
- **WHEN** 调用 `joinTeamByInviteCode(code)`
- **THEN** 在 `teams` 中查找匹配 `invite_code` 的行，若当前用户未在 `team_members` 中则插入（role = `member`），否则抛出"您已是该队伍成员"

### Requirement: 认证（Auth）
系统 SHALL 使用 Supabase Auth 完成注册与登录。

#### Scenario: 注册
- **WHEN** 调用 `registerUser(email, password, passwordConfirm)`
- **THEN** 调用 `supabase.auth.signUp({ email, password, options: { data: {} } })`；如 Supabase 要求 email 确认，则在 UI 给出提示

#### Scenario: 登录
- **WHEN** 调用 `loginUser(email, password)`
- **THEN** 调用 `supabase.auth.signInWithPassword({ email, password })`

#### Scenario: 登出
- **WHEN** 调用 `logoutUser()`
- **THEN** 调用 `supabase.auth.signOut()`

### Requirement: Realtime 订阅
系统 SHALL 订阅 `records` 与 `teams` 表的变更，并在收到事件后通过回调触发数据刷新。

#### Scenario: 数据库变更
- **WHEN** 任意客户端对 `records` / `teams` 表执行 INSERT/UPDATE/DELETE
- **THEN** 当前登录客户端在 < 2 秒内收到通知，`useStore.loadData` 被自动触发

### Requirement: 照片存储
系统 SHALL 将照片上传到 Supabase Storage 的 `record-photos` 桶，存储后返回公开 URL（建议使用 Signed URL，但 MVP 阶段可用 public bucket）。

#### Scenario: 上传照片
- **WHEN** `addRecord` 携带非空 `photos: string[]`（dataURL）
- **THEN** 把每张 dataURL 转 Blob，上传到 `record-photos/{userId}/{recordId}/{filename}.jpg`，把返回的 URL 列表写入 `records.photos` 字段

#### Scenario: 兼容旧数据
- **WHEN** `photos` 中已包含完整 URL（而非 dataURL）
- **THEN** 直接使用，不再二次上传

### Requirement: Vercel 环境变量配置
系统 SHALL 完全通过环境变量读取后端凭证，不在仓库中硬编码任何敏感信息。

#### Scenario: 必需的 Vercel 环境变量
- `VITE_SUPABASE_URL`：Supabase 项目的 Project URL（形如 `https://xxx.supabase.co`）
- `VITE_SUPABASE_ANON_KEY`：Supabase 项目的 anon public key

#### Scenario: 本地开发
- **WHEN** 开发者创建 `.env.local`（已被 `.gitignore` 忽略）并填入上述两个变量
- **THEN** `npm run dev` 启动后即可正常连接

#### Scenario: Vercel 部署
- **WHEN** 在 Vercel Project Settings → Environment Variables 中为 Production / Preview / Development 三种环境分别填入变量
- **THEN** 每次 `vercel deploy` 或 git push 都会注入正确配置，无需修改源码

### Requirement: Supabase 数据库表结构（README 提供 SQL）
项目 SHALL 在 Supabase 控制台 SQL Editor 中执行以下 SQL 来初始化 schema：

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

-- 启用 RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.records enable row level security;

-- 简化策略：登录用户可读所有；写操作仅限成员
create policy "teams read" on public.teams for select using (auth.role() = 'authenticated');
create policy "teams write" on public.teams for insert with check (auth.uid() = owner_id);
create policy "teams update" on public.teams for update using (auth.uid() = owner_id);
create policy "teams delete" on public.teams for delete using (auth.uid() = owner_id);

create policy "team_members read" on public.team_members for select using (auth.role() = 'authenticated');
create policy "team_members write" on public.team_members for insert with check (auth.uid() = user_id);
create policy "team_members delete" on public.team_members for delete using (
  auth.uid() = user_id
  or exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
      and t.owner_id = auth.uid()
  )
);

create policy "records read" on public.records for select using (auth.role() = 'authenticated');
create policy "records write" on public.records for insert with check (auth.uid() = created_by);
create policy "records update" on public.records for update using (auth.uid() = created_by);
create policy "records delete" on public.records for delete using (auth.uid() = created_by);

-- Realtime
alter publication supabase_realtime add table public.records;
alter publication supabase_realtime add table public.teams;
```

并在 Storage 中创建名为 `record-photos` 的 public bucket。

## MODIFIED Requirements
无（这是全新替换，没有对原 PocketBase 接口的向下兼容需求）。

## REMOVED Requirements
### Requirement: PocketBase 客户端
**Reason**: 替换为 Supabase 后，PB 客户端不再被前端代码使用
**Migration**: 删除 `src/api/pocketbase.ts`，从 `package.json` 移除 `pocketbase` 依赖；如有外部脚本访问 PB，需独立处理（本次不涉及）
