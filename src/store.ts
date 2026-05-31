import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Record as RecordType, Language, Module, Team } from './types';

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
  addRecord: (record: Omit<RecordType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecord: (id: string, record: Partial<RecordType>) => void;
  deleteRecord: (id: string) => void;
  addTeam: (name: string) => void;
  updateTeam: (id: string, name: string) => void;
  deleteTeam: (id: string) => void;
  setLanguage: (lang: Language) => void;
  exportData: () => string;
  importData: (jsonString: string) => ImportResult;
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

const validateTeam = (team: any, index: number): { valid: boolean; errors: ImportError[] } => {
  const errors: ImportError[] = [];
  
  if (!team.id || typeof team.id !== 'string') {
    errors.push({ row: index, field: 'id', message: '缺少或无效的队伍ID' });
  }
  
  if (!team.name || typeof team.name !== 'string' || team.name.trim().length === 0) {
    errors.push({ row: index, field: 'name', message: '队伍名称不能为空' });
  }
  
  if (team.name && team.name.length > 50) {
    errors.push({ row: index, field: 'name', message: '队伍名称不能超过50个字符' });
  }
  
  return { valid: errors.length === 0, errors };
};

const sanitizeRecord = (record: any): Partial<RecordType> => {
  return {
    id: record.id,
    date: record.date,
    author: String(record.author || '').trim(),
    module: record.module as Module,
    team: record.team || '',
    reason: record.reason || '',
    content: record.content || '',
    photos: Array.isArray(record.photos) ? record.photos.filter(p => typeof p === 'string') : [],
    testResult: record.testResult || '',
    problems: record.problems || '',
    nextSteps: record.nextSteps || '',
    rating: typeof record.rating === 'number' && record.rating >= 0 && record.rating <= 5 ? record.rating : 0,
    milestone: typeof record.milestone === 'boolean' ? record.milestone : false,
    createdAt: record.createdAt || Date.now(),
    updatedAt: record.updatedAt || Date.now(),
  };
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      records: [],
      teams: [],
      language: 'zh',
      
      addRecord: (record) =>
        set((state) => ({
          records: [
            {
              ...record,
              id: Date.now().toString(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...state.records,
          ],
        })),
      
      updateRecord: (id, record) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...record, updatedAt: Date.now() } : r
          ),
        })),
      
      deleteRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),
      
      addTeam: (name) =>
        set((state) => ({
          teams: [
            ...state.teams,
            {
              id: Date.now().toString(),
              name,
              createdAt: Date.now(),
            },
          ],
        })),
      
      updateTeam: (id, name) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, name } : t
          ),
        })),
      
      deleteTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== id),
          records: state.records.map((r) =>
            r.team === id ? { ...r, team: '' } : r
          ),
        })),
      
      setLanguage: (language) => set({ language }),

      exportData: () => {
        const data = {
          version: '2.0',
          exportDate: new Date().toISOString(),
          records: get().records,
          teams: get().teams,
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (jsonString: string): ImportResult => {
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
          
          if (!data.version) {
            errors.push({ message: '警告：缺少版本号，可能导致兼容性问题' });
          }
          
          let validRecords: RecordType[] = [];
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
                  validRecords.push(sanitized as RecordType);
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
          
          let validTeams: Team[] = [];
          let skippedTeams = 0;
          
          if (data.teams) {
            if (!Array.isArray(data.teams)) {
              errors.push({ field: 'teams', message: 'teams字段必须是数组' });
            } else {
              data.teams.forEach((team: any, index: number) => {
                const { valid, errors: teamErrors } = validateTeam(team, index);
                
                if (valid) {
                  try {
                    validTeams.push({
                      id: team.id,
                      name: String(team.name || '').trim(),
                      createdAt: team.createdAt || Date.now(),
                    });
                  } catch (error) {
                    errors.push({ 
                      row: index, 
                      message: `队伍 ${index + 1} 解析失败: ${error instanceof Error ? error.message : '未知错误'}` 
                    });
                    skippedTeams++;
                  }
                } else {
                  errors.push(...teamErrors);
                  skippedTeams++;
                }
              });
            }
          }
          
          if (validRecords.length > 0 || validTeams.length > 0) {
            set((state) => {
              const existingRecordIds = new Set(state.records.map(r => r.id));
              const existingTeamIds = new Set(state.teams.map(t => t.id));
              
              const newRecords = validRecords.filter(r => !existingRecordIds.has(r.id));
              const newTeams = validTeams.filter(t => !existingTeamIds.has(t.id));
              
              return {
                records: [...newRecords, ...state.records],
                teams: [...newTeams, ...state.teams],
              };
            });
          }
          
          if (validRecords.length > 0) {
            console.log(`导入成功: ${validRecords.length} 条记录`);
          }
          
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
    }),
    {
      name: 'vex-structure-log-storage',
    }
  )
);
