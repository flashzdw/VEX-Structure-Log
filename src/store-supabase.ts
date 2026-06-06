import { create } from 'zustand';
import { Record as RecordType, Language, Module, Team } from './types';
import {
  getRecords,
  addRecord as addRecordSB,
  updateRecord as updateRecordSB,
  deleteRecord as deleteRecordSB,
  getTeams,
  addTeam as addTeamSB,
  updateTeam as updateTeamSB,
  deleteTeam as deleteTeamSB,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUserAsync,
  subscribeToRecords,
  subscribeToTeams,
  joinTeamByInviteCode,
} from './api/supabase';

interface ImportError {
  row?: number;
  field?: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

interface Store {
  records: RecordType[];
  teams: Team[];
  language: Language;
  user: any;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  currentTeam: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, passwordConfirm: string) => Promise<boolean>;
  logout: () => void;
  loadData: () => Promise<void>;

  addRecord: (record: Omit<RecordType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (id: string, record: Partial<RecordType>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;

  addTeam: (name: string) => Promise<void>;
  joinTeam: (inviteCode: string) => Promise<void>;
  updateTeam: (id: string, name: string) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  selectTeam: (teamId: string | null) => void;

  setLanguage: (lang: Language) => void;
  exportData: () => string;
  importData: (jsonString: string) => Promise<ImportResult>;
  getStatistics: () => {
    total: number;
    byModule: Record<string, number>;
    byAuthor: Record<string, number>;
    byTeam: Record<string, number>;
    averageRating: string;
  };
}

const validateRecord = (record: any, index: number): { valid: boolean; errors: ImportError[] } => {
  const errors: ImportError[] = [];

  if (!record.id || typeof record.id !== 'string') {
    errors.push({ row: index, field: 'id', message: '缺少或无效的记录ID' });
  }

  if (!record.date || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    errors.push({ row: index, field: 'date', message: '日期格式不正确，应为 YYYY-MM-DD' });
  } else {
    const date = new Date(record.date);
    if (isNaN(date.getTime())) {
      errors.push({ row: index, field: 'date', message: '日期无效' });
    }
  }

  if (!record.author || typeof record.author !== 'string' || record.author.trim().length === 0) {
    errors.push({ row: index, field: 'author', message: '负责人姓名不能为空' });
  }

  const validModules: Module[] = ['底盘', '抓手', '弹射', '升降', '其他'];
  if (!record.module || !validModules.includes(record.module)) {
    errors.push({
      row: index,
      field: 'module',
      message: `模块无效，应为: ${validModules.join(', ')}`
    });
  }

  if (record.rating !== undefined && record.rating !== null) {
    if (typeof record.rating !== 'number' || record.rating < 0 || record.rating > 5) {
      errors.push({ row: index, field: 'rating', message: '评分必须在0-5之间' });
    }
  }

  if (record.team && typeof record.team !== 'string') {
    errors.push({ row: index, field: 'team', message: '队伍ID格式无效' });
  }

  if (record.photos && !Array.isArray(record.photos)) {
    errors.push({ row: index, field: 'photos', message: '照片必须是数组格式' });
  }

  if (record.milestone !== undefined && typeof record.milestone !== 'boolean') {
    errors.push({ row: index, field: 'milestone', message: '里程碑标记必须是布尔值' });
  }

  return { valid: errors.length === 0, errors };
};

const sanitizeRecord = (record: any): Partial<RecordType> => {
  return {
    date: record.date,
    author: String(record.author || '').trim(),
    module: record.module as Module,
    team: record.team || '',
    reason: record.reason || '',
    content: record.content || '',
    photos: Array.isArray(record.photos) ? record.photos.filter((p: any) => typeof p === 'string') : [],
    testResult: record.testResult || '',
    problems: record.problems || '',
    nextSteps: record.nextSteps || '',
    rating: typeof record.rating === 'number' && record.rating >= 0 && record.rating <= 5 ? record.rating : 0,
    milestone: typeof record.milestone === 'boolean' ? record.milestone : false,
  };
};

export const useStore = create<Store>((set, get) => ({
  records: [],
  teams: [],
  language: 'zh',
  user: null,
  isLoggedIn: false,
  loading: false,
  error: null,
  currentTeam: null,

  initialize: async () => {
    set({ loading: true, error: null });

    try {
      const user = await getCurrentUserAsync();
      if (user) {
        set({ user, isLoggedIn: true });
        await get().loadData();
        subscribeToRecords(() => get().loadData());
        subscribeToTeams(() => get().loadData());
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '初始化失败' });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });

    try {
      // 提前检查环境变量：缺失时给出最清晰的提示，而不是让 Supabase 返回含糊的 "Something went wrong"
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error(
          'Supabase 未配置：请在 Vercel Project Settings → Environment Variables 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，然后重新部署。'
        );
      }
      await loginUser(email, password);
      const user = await getCurrentUserAsync();
      set({ user, isLoggedIn: true });
      await get().loadData();

      subscribeToRecords(() => get().loadData());
      subscribeToTeams(() => get().loadData());

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase login] 详细错误:', error);
      const msg =
        error instanceof Error && error.message
          ? error.message
          : '登录失败，请稍后重试';
      set({ error: msg });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  register: async (email: string, password: string, passwordConfirm: string) => {
    set({ loading: true, error: null });

    try {
      // 同样在注册流程前置检查环境变量
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error(
          'Supabase 未配置：请在 Vercel Project Settings → Environment Variables 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，然后重新部署。'
        );
      }
      await registerUser(email, password, passwordConfirm);
      // 注册成功后立即尝试登录拿到 session
      // （Supabase 默认要求邮箱确认，signUp 不会返回 session，因此需要再 signIn 一次；
      // 如果 Supabase 项目关闭了"Confirm email"，signUp 已经返回 session，这里也会成功）
      try {
        await loginUser(email, password);
      } catch (loginErr) {
        // eslint-disable-next-line no-console
        console.error('[Supabase register auto-login] 详细错误:', loginErr);
        throw new Error(
          '注册成功，但自动登录失败：' +
            (loginErr instanceof Error ? loginErr.message : '未知错误') +
            '。如需注册后立即使用，请到 Supabase 控制台 → Authentication → Providers → Email 中关闭 "Confirm email"。'
        );
      }
      const user = await getCurrentUserAsync();
      set({ user, isLoggedIn: !!user });

      if (user) {
        subscribeToRecords(() => get().loadData());
        subscribeToTeams(() => get().loadData());
      }

      return !!user;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase register] 详细错误:', error);
      const msg =
        error instanceof Error && error.message
          ? error.message
          : '注册失败，请稍后重试';
      set({ error: msg });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    logoutUser();
    set({
      user: null,
      isLoggedIn: false,
      records: [],
      teams: [],
      currentTeam: null
    });
  },

  loadData: async () => {
    set({ loading: true, error: null });

    try {
      const teams = await getTeams();
      const records = await getRecords();

      set({
        records,
        teams,
        currentTeam: teams.length > 0 ? teams[0].id : null
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载数据失败' });
    } finally {
      set({ loading: false });
    }
  },

  addRecord: async (record) => {
    set({ loading: true, error: null });

    try {
      await addRecordSB(record);
      await get().loadData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '添加记录失败' });
    } finally {
      set({ loading: false });
    }
  },

  updateRecord: async (id, record) => {
    set({ loading: true, error: null });

    try {
      await updateRecordSB(id, record);
      await get().loadData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新记录失败' });
    } finally {
      set({ loading: false });
    }
  },

  deleteRecord: async (id) => {
    set({ loading: true, error: null });

    try {
      await deleteRecordSB(id);
      await get().loadData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除记录失败' });
    } finally {
      set({ loading: false });
    }
  },

  addTeam: async (name) => {
    set({ loading: true, error: null });

    try {
      await addTeamSB(name);
      await get().loadData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '添加队伍失败' });
    } finally {
      set({ loading: false });
    }
  },

  joinTeam: async (inviteCode) => {
    set({ loading: true, error: null });

    try {
      await joinTeamByInviteCode(inviteCode);
      await get().loadData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加入队伍失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTeam: async (id, name) => {
    set({ loading: true, error: null });

    try {
      await updateTeamSB(id, name);
      await get().loadData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新队伍失败' });
    } finally {
      set({ loading: false });
    }
  },

  deleteTeam: async (id) => {
    set({ loading: true, error: null });

    try {
      await deleteTeamSB(id);
      await get().loadData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除队伍失败' });
    } finally {
      set({ loading: false });
    }
  },

  selectTeam: (teamId) => {
    set({ currentTeam: teamId });
  },

  setLanguage: (language) => {
    localStorage.setItem('language', language);
    set({ language });
  },

  exportData: () => {
    const data = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      records: get().records,
      teams: get().teams,
    };
    return JSON.stringify(data, null, 2);
  },

  importData: async (jsonString: string): Promise<ImportResult> => {
    const errors: ImportError[] = [];

    try {
      const data = JSON.parse(jsonString);

      if (!data || typeof data !== 'object') {
        return {
          success: false,
          imported: 0,
          skipped: 0,
          errors: [{ message: 'JSON格式无效：顶层必须是对象' }],
        };
      }

      let validRecords: Omit<RecordType, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      let skippedRecords = 0;

      if (data.records) {
        if (!Array.isArray(data.records)) {
          return {
            success: false,
            imported: 0,
            skipped: 0,
            errors: [{ field: 'records', message: 'records字段必须是数组' }],
          };
        }

        data.records.forEach((record: any, index: number) => {
          const { valid, errors: recordErrors } = validateRecord(record, index);

          if (valid) {
            try {
              const sanitized = sanitizeRecord(record);
              validRecords.push(sanitized as any);
            } catch (error) {
              errors.push({
                row: index,
                message: `记录 ${index + 1} 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
              });
              skippedRecords++;
            }
          } else {
            errors.push(...recordErrors);
            skippedRecords++;
          }
        });
      }

      for (const record of validRecords) {
        await addRecordSB(record);
      }

      await get().loadData();

      return {
        success: errors.filter(e => !e.message.includes('警告')).length === 0,
        imported: validRecords.length,
        skipped: skippedRecords,
        errors: errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          message: `JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`
        }],
      };
    }
  },

  getStatistics: () => {
    const records = get().records;
    const byModule: Record<string, number> = {};
    const byAuthor: Record<string, number> = {};
    const byTeam: Record<string, number> = {};
    let totalRating = 0;
    let ratingCount = 0;

    records.forEach((r) => {
      byModule[r.module] = (byModule[r.module] || 0) + 1;
      byAuthor[r.author] = (byAuthor[r.author] || 0) + 1;
      if (r.team) {
        byTeam[r.team] = (byTeam[r.team] || 0) + 1;
      }

      if (r.rating > 0) {
        totalRating += r.rating;
        ratingCount++;
      }
    });

    return {
      total: records.length,
      byModule,
      byAuthor,
      byTeam,
      averageRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0',
    };
  },
}));
