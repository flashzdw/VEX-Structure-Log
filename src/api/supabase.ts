import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Record as RecordType, Team } from '../types';

// ============================================================================
// 类型定义（与 Supabase 表结构对应）
// ============================================================================

export interface SBDatabase {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          user_email: string;
          role: 'owner' | 'member';
          created_at: string;
          updated_at: string;
        };
      };
      records: {
        Row: {
          id: string;
          date: string;
          author: string;
          module: string;
          team_id: string | null;
          reason: string;
          content: string;
          photos: string[];
          test_result: string;
          problems: string;
          next_steps: string;
          rating: number;
          milestone: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}

export interface SBRow {
  id: string;
  date: string;
  author: string;
  module: string;
  team_id: string | null;
  reason: string;
  content: string;
  photos: string[];
  test_result: string;
  problems: string;
  next_steps: string;
  rating: number;
  milestone: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SBTeam {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 工具函数
// ============================================================================

function ensureClient() {
  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      'Supabase 未配置：请在 Vercel 环境变量或 .env.local 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
    );
  }
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * dataURL → Blob（用于把前端压缩后的照片上传到 Supabase Storage）
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

function isAlreadyUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

// ============================================================================
// 类型转换
// ============================================================================

export function convertSBRow(row: SBRow): RecordType {
  return {
    id: row.id,
    date: row.date,
    author: row.author,
    module: row.module as RecordType['module'],
    team: row.team_id || '',
    reason: row.reason || '',
    content: row.content || '',
    photos: Array.isArray(row.photos) ? row.photos : [],
    testResult: row.test_result || '',
    problems: row.problems || '',
    nextSteps: row.next_steps || '',
    rating: row.rating || 0,
    milestone: row.milestone || false,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function convertSBTeam(team: SBTeam): Team {
  return {
    id: team.id,
    name: team.name,
    createdAt: new Date(team.created_at).getTime(),
  };
}

// ============================================================================
// Records CRUD
// ============================================================================

export async function getRecords(teamId?: string) {
  ensureClient();
  let query = supabase
    .from('records')
    .select('*')
    .order('created_at', { ascending: false });

  if (teamId) {
    query = query.eq('team_id', teamId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data as SBRow[]).map(convertSBRow);
}

async function uploadPhotosIfNeeded(
  photos: string[],
  userId: string
): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  const uploaded: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (isAlreadyUrl(p)) {
      uploaded.push(p);
      continue;
    }
    const blob = dataUrlToBlob(p);
    const ext = blob.type.split('/')[1] || 'jpg';
    const path = `${userId}/${Date.now()}-${i}.${ext}`;
    const { error } = await supabase.storage
      .from('record-photos')
      .upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) {
      throw new Error(`照片上传失败：${error.message}`);
    }
    const { data: pub } = supabase.storage
      .from('record-photos')
      .getPublicUrl(path);
    uploaded.push(pub.publicUrl);
  }
  return uploaded;
}

export async function addRecord(
  record: Omit<RecordType, 'id' | 'createdAt' | 'updatedAt'>
) {
  ensureClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error('未登录，无法创建记录');
  }

  const photoUrls = await uploadPhotosIfNeeded(record.photos || [], userId);

  const { data, error } = await supabase
    .from('records')
    .insert({
      date: record.date,
      author: record.author,
      module: record.module,
      team_id: record.team || null,
      reason: record.reason || '',
      content: record.content || '',
      photos: photoUrls,
      test_result: record.testResult || '',
      problems: record.problems || '',
      next_steps: record.nextSteps || '',
      rating: record.rating || 0,
      milestone: !!record.milestone,
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return convertSBRow(data as SBRow);
}

export async function updateRecord(id: string, updates: Partial<RecordType>) {
  ensureClient();
  const { data, error } = await supabase
    .from('records')
    .update({
      date: updates.date,
      author: updates.author,
      module: updates.module,
      team_id: updates.team || null,
      reason: updates.reason || '',
      content: updates.content || '',
      test_result: updates.testResult || '',
      problems: updates.problems || '',
      next_steps: updates.nextSteps || '',
      rating: updates.rating || 0,
      milestone: !!updates.milestone,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return convertSBRow(data as SBRow);
}

export async function deleteRecord(id: string) {
  ensureClient();
  const { error } = await supabase.from('records').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// Teams CRUD
// ============================================================================

export async function getTeams(_userId?: string) {
  ensureClient();
  // 通过当前用户的 team_members 反查他/她所在的队伍
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: memberships, error: mErr } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId);
  if (mErr) {
    throw new Error(mErr.message);
  }
  const teamIds = (memberships || []).map((m: any) => m.team_id);
  if (teamIds.length === 0) return [];

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .in('id', teamIds)
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data as SBTeam[]).map(convertSBTeam);
}

export async function addTeam(name: string, _ownerId?: string) {
  ensureClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('未登录');

  const inviteCode = generateInviteCode();
  const { data: team, error: tErr } = await supabase
    .from('teams')
    .insert({
      name,
      invite_code: inviteCode,
      owner_id: user.id,
    })
    .select('*')
    .single();
  if (tErr) {
    throw new Error(tErr.message);
  }

  // 把 owner 加入 team_members
  const { error: mErr } = await supabase.from('team_members').insert({
    team_id: (team as SBTeam).id,
    user_id: user.id,
    user_email: user.email || '',
    role: 'owner',
  });
  if (mErr) {
    throw new Error(mErr.message);
  }

  return convertSBTeam(team as SBTeam);
}

export async function updateTeam(id: string, name: string) {
  ensureClient();
  const { data, error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return convertSBTeam(data as SBTeam);
}

export async function deleteTeam(id: string) {
  ensureClient();
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 读取指定队伍的邀请码（仅队长可读）
 */
export async function getTeamInviteCode(teamId: string): Promise<string> {
  ensureClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    throw new Error('请先登录');
  }

  const { data, error } = await supabase
    .from('teams')
    .select('invite_code, owner_id')
    .eq('id', teamId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('队伍不存在');
  }
  if ((data as SBTeam).owner_id !== user.id) {
    throw new Error('仅队长可查看邀请码');
  }
  return (data as SBTeam).invite_code;
}

// ============================================================================
// Auth
// ============================================================================

export async function registerUser(
  email: string,
  password: string,
  _passwordConfirm: string
) {
  ensureClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    throw new Error(error.message);
  }
  // 不再因为 "未返回 session" 而抛错：是否启用邮箱确认由 Supabase 控制台决定。
  // 若 Supabase 项目开启了"Confirm email"，signUp 不会返回 session，
  // 此时由 store 兜底调用 signInWithPassword 完成自动登录（也会因为邮箱未确认而失败，
  // 由 UI 给出明确提示；用户在 Supabase 中关闭确认后即可正常注册即用）。
  return data;
}

export async function loginUser(email: string, password: string) {
  ensureClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function logoutUser() {
  ensureClient();
  await supabase.auth.signOut();
}

export function isAuthenticated() {
  // 同步判断：基于客户端内存中的 session
  // 调用方（store）通常在 initialize 时主动 await getSession 以获得最终结果
  // @ts-expect-error - _session 是 Supabase 内部字段
  return !!supabase.auth._session?.access_token;
}

export function getCurrentUser() {
  // @ts-expect-error - _user 是 Supabase 内部字段
  return supabase.auth._user || null;
}

/** 异步获取当前 session 与 user（推荐使用） */
export async function getSession() {
  ensureClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

export async function getCurrentUserAsync() {
  const session = await getSession();
  return session?.user ?? null;
}

// ============================================================================
// 加入队伍（通过邀请码）
// ============================================================================

export async function joinTeamByInviteCode(inviteCode: string) {
  ensureClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    throw new Error('请先登录');
  }

  const { data: teams, error: tErr } = await supabase
    .from('teams')
    .select('*')
    .eq('invite_code', inviteCode)
    .limit(1);
  if (tErr) {
    throw new Error(tErr.message);
  }
  if (!teams || teams.length === 0) {
    throw new Error('邀请码无效');
  }
  const team = teams[0] as SBTeam;

  const { data: existing, error: eErr } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .limit(1);
  if (eErr) {
    throw new Error(eErr.message);
  }
  if (existing && existing.length > 0) {
    throw new Error('您已是该队伍成员');
  }

  const { error: iErr } = await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    user_email: user.email || '',
    role: 'member',
  });
  if (iErr) {
    throw new Error(iErr.message);
  }

  return convertSBTeam(team);
}

// ============================================================================
// Realtime
// ============================================================================

export function subscribeToRecords(callback: () => void): RealtimeChannel {
  return supabase
    .channel('records-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'records' },
      () => callback()
    )
    .subscribe();
}

export function subscribeToTeams(callback: () => void): RealtimeChannel {
  return supabase
    .channel('teams-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'teams' },
      () => callback()
    )
    .subscribe();
}
