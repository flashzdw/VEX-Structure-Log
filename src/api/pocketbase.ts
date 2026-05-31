import PocketBase from 'pocketbase';
import { Record as RecordType, Team } from '../types';

// 自动判断使用内网还是外网地址
function getPocketBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:8090';
  }
  
  const hostname = window.location.hostname;
  
  // 如果是内网访问（localhost/127.0.0.1），使用内网地址
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
  }
  
  // 如果是外网访问，使用外网地址
  return 'http://1247ug121tl26.vicp.fun:12340';
}

let pbInstance: PocketBase | null = null;

function initPocketBase(): PocketBase {
  if (pbInstance) {
    return pbInstance;
  }
  
  pbInstance = new PocketBase(getPocketBaseUrl());
  
  // 自动保存认证状态（仅在浏览器环境中）
  if (typeof document !== 'undefined') {
    try {
      pbInstance.authStore.loadFromCookie(document.cookie);
      pbInstance.authStore.onChange(() => {
        document.cookie = pbInstance.authStore.exportToCookie({ httpOnly: false });
      });
    } catch (e) {
      console.warn('Failed to initialize auth store:', e);
    }
  }
  
  return pbInstance;
}

export function getPb(): PocketBase {
  return initPocketBase();
}

export const pb = new Proxy({} as PocketBase, {
  get(target, prop) {
    const instance = initPocketBase();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

// Types for PocketBase records
export interface PBRecord {
  id: string;
  date: string;
  author: string;
  module: string;
  team: string;
  reason: string;
  content: string;
  photos: string[];
  testResult: string;
  problems: string;
  nextSteps: string;
  rating: number;
  milestone: boolean;
  created: string;
  updated: string;
}

export interface PBTeam {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  created: string;
  updated: string;
}

export interface PBTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  userEmail: string;
  created: string;
  updated: string;
}

// Convert PB types to app types
export function convertPBRecord(pbRecord: PBRecord): RecordType {
  // 安全处理 photos 字段
  let safePhotos: string[] = [];
  try {
    if (pbRecord.photos) {
      if (Array.isArray(pbRecord.photos)) {
        safePhotos = pbRecord.photos;
      } else if (typeof pbRecord.photos === 'string') {
        try {
          safePhotos = JSON.parse(pbRecord.photos);
          if (!Array.isArray(safePhotos)) {
            safePhotos = [];
          }
        } catch {
          safePhotos = [];
        }
      }
    }
  } catch {
    safePhotos = [];
  }

  return {
    id: pbRecord.id,
    date: pbRecord.date,
    author: pbRecord.author,
    module: pbRecord.module as any,
    team: pbRecord.team,
    reason: pbRecord.reason || '',
    content: pbRecord.content || '',
    photos: safePhotos,
    testResult: pbRecord.testResult || '',
    problems: pbRecord.problems || '',
    nextSteps: pbRecord.nextSteps || '',
    rating: pbRecord.rating || 0,
    milestone: pbRecord.milestone || false,
    createdAt: new Date(pbRecord.created).getTime(),
    updatedAt: new Date(pbRecord.updated).getTime(),
  };
}

export function convertPBTeam(pbTeam: PBTeam): Team {
  return {
    id: pbTeam.id,
    name: pbTeam.name,
    createdAt: new Date(pbTeam.created).getTime(),
  };
}

// API functions
export async function getRecords(teamId?: string) {
  let filter = '';
  if (teamId) {
    filter = `team="${teamId}"`;
  }
  
  const resultList = await pb.collection('records').getList<PBRecord>(1, 100, {
    filter: filter,
    sort: '-created',
  });
  
  return resultList.items.map(convertPBRecord);
}

export async function addRecord(record: Omit<RecordType, 'id' | 'createdAt' | 'updatedAt'>) {
  const data = {
    date: record.date,
    author: record.author,
    module: record.module,
    team: record.team,
    reason: record.reason || '',
    content: record.content || '',
    photos: record.photos || [],
    testResult: record.testResult || '',
    problems: record.problems || '',
    nextSteps: record.nextSteps || '',
    rating: record.rating || 0,
    milestone: record.milestone || false,
  };
  
  const recordResult = await pb.collection('records').create<PBRecord>(data);
  return convertPBRecord(recordResult);
}

export async function updateRecord(id: string, updates: Partial<RecordType>) {
  const data = {
    date: updates.date,
    author: updates.author,
    module: updates.module,
    team: updates.team,
    reason: updates.reason || '',
    content: updates.content || '',
    photos: updates.photos || [],
    testResult: updates.testResult || '',
    problems: updates.problems || '',
    nextSteps: updates.nextSteps || '',
    rating: updates.rating || 0,
    milestone: updates.milestone || false,
  };
  
  const recordResult = await pb.collection('records').update<PBRecord>(id, data);
  return convertPBRecord(recordResult);
}

export async function deleteRecord(id: string) {
  await pb.collection('records').delete(id);
}

export async function getTeams(userId?: string) {
  let filter = '';
  
  if (userId) {
    filter = `ownerId="${userId}"`;
  }
  
  const resultList = await pb.collection('teams').getList<PBTeam>(1, 100, {
    filter: filter,
    sort: '-created',
  });
  
  return resultList.items.map(convertPBTeam);
}

export async function addTeam(name: string, ownerId: string) {
  const inviteCode = Math.random().toString(36).substring(2, 10);
  const data = {
    name: name,
    inviteCode: inviteCode,
    ownerId: ownerId,
  };
  
  const teamResult = await pb.collection('teams').create<PBTeam>(data);
  
  // Also add owner as team member
  if (pb.authStore.model) {
    await pb.collection('team_members').create({
      teamId: teamResult.id,
      userId: ownerId,
      role: 'owner',
      userEmail: pb.authStore.model.email,
    });
  }
  
  return convertPBTeam(teamResult);
}

export async function updateTeam(id: string, name: string) {
  const data = { name };
  const teamResult = await pb.collection('teams').update<PBTeam>(id, data);
  return convertPBTeam(teamResult);
}

export async function deleteTeam(id: string) {
  await pb.collection('teams').delete(id);
}

// Auth functions
export async function registerUser(email: string, password: string, passwordConfirm: string) {
  return await pb.collection('users').create({
    email: email,
    password: password,
    passwordConfirm: passwordConfirm,
  });
}

export async function loginUser(email: string, password: string) {
  return await pb.collection('users').authWithPassword(email, password);
}

export async function logoutUser() {
  pb.authStore.clear();
}

export function isAuthenticated() {
  return pb.authStore.isValid;
}

export function getCurrentUser() {
  return pb.authStore.model;
}

// 加入队伍
export async function joinTeamByInviteCode(inviteCode: string) {
  if (!pb.authStore.model) {
    throw new Error('请先登录');
  }
  
  // 查找队伍
  const teamsResult = await pb.collection('teams').getList(1, 1, {
    filter: `inviteCode = "${inviteCode}"`
  });
  
  if (teamsResult.items.length === 0) {
    throw new Error('邀请码无效');
  }
  
  const team = teamsResult.items[0];
  
  // 检查是否已是成员
  const existing = await pb.collection('team_members').getList(1, 1, {
    filter: `teamId = "${team.id}" && userId = "${pb.authStore.model.id}"`
  });
  
  if (existing.items.length > 0) {
    throw new Error('您已是该队伍成员');
  }
  
  // 添加成员
  await pb.collection('team_members').create({
    teamId: team.id,
    userId: pb.authStore.model.id,
    role: 'member',
    userEmail: pb.authStore.model.email
  });
  
  return convertPBTeam(team);
}

// Real-time subscriptions
export function subscribeToRecords(callback: () => void) {
  return pb.collection('records').subscribe('*', () => {
    callback();
  });
}

export function subscribeToTeams(callback: () => void) {
  return pb.collection('teams').subscribe('*', () => {
    callback();
  });
}
