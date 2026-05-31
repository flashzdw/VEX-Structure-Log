# 🌟 Cloudflare部署指南（简化版）

## 📋 准备工作

您需要：
1. ✅ 已安装 Wrangler（版本4.92.0）
2. ✅ 已注册 Cloudflare 账号
3. ✅ 终端已打开，当前目录是 `/Users/bbc/Desktop/TRAE-Solo-517`

---

## 🚀 第一步：登录Cloudflare

在终端中输入：
```bash
wrangler login
```

按回车后会自动打开浏览器，用您的Cloudflare账号登录。登录成功后回到终端。

---

## 🗄️ 第二步：创建数据库

在终端中输入：
```bash
wrangler d1 create vex-structure-db
```

执行后会显示类似这样的信息：
```
Successfully created DB 'vex-structure-db'
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**复制这个 Database ID！** 后面会用到！

---

## 🔧 第三步：配置数据库连接

编辑 `wrangler.toml` 文件：
```bash
nano wrangler.toml
```

把 `database_id = "需要替换为您的数据库ID"` 替换为您刚才复制的ID。

按 **Ctrl+X** 退出，按 **Y** 保存。

---

## 📝 第四步：创建数据表

在终端中输入：
```bash
wrangler d1 execute vex-structure-db --remote --command="
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  module TEXT NOT NULL,
  reason TEXT,
  content TEXT,
  images TEXT,
  test_result TEXT,
  problems TEXT,
  next_optimization TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
"
```

看到 "Executed 1 query" 就成功了！

---

## ⚙️ 第五步：部署API

在终端中输入：
```bash
wrangler deploy
```

等待部署完成。成功后会显示类似这样的地址：
```
https://vex-structure-api.your-subdomain.workers.dev
```

**复制这个地址！** 后面配置前端会用到！

---

## 🌐 第六步：配置前端连接API

创建环境变量文件：
```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://vex-structure-api.your-subdomain.workers.dev
EOF
```

**把地址替换为您在第五步获得的API地址！**

---

## 🔄 第七步：修改前端代码

修改 `src/store.ts` 使用API获取数据：
```bash
cat > src/store.ts << 'EOF'
import { create } from 'zustand';

export interface Record {
  id: string;
  date: string;
  module: '底盘' | '抓手' | '弹射' | '升降' | '其他';
  reason: string;
  content: string;
  images: string[];
  test_result: string;
  problems: string;
  next_optimization: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Store {
  records: Record[];
  language: 'zh' | 'en';
  loading: boolean;
  error: string | null;
  
  setLanguage: (lang: 'zh' | 'en') => void;
  fetchRecords: () => Promise<void>;
  addRecord: (record: Omit<Record, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRecord: (id: string, record: Partial<Record>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export const useStore = create<Store>((set, get) => ({
  records: [],
  language: 'zh',
  loading: false,
  error: null,

  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/records`);
      if (!response.ok) throw new Error('获取记录失败');
      const data = await response.json();
      set({ records: data.map((r: any) => ({
        ...r,
        images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images || []
      })), loading: false });
    } catch (error: any) {
      console.error('获取记录失败:', error);
      set({ error: error.message, loading: false });
    }
  },

  addRecord: async (record) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!response.ok) throw new Error('添加记录失败');
      await get().fetchRecords();
    } catch (error: any) {
      console.error('添加记录失败:', error);
      set({ error: error.message, loading: false });
    }
  },

  updateRecord: async (id, record) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!response.ok) throw new Error('更新记录失败');
      await get().fetchRecords();
    } catch (error: any) {
      console.error('更新记录失败:', error);
      set({ error: error.message, loading: false });
    }
  },

  deleteRecord: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/records/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除记录失败');
      await get().fetchRecords();
    } catch (error: any) {
      console.error('删除记录失败:', error);
      set({ error: error.message, loading: false });
    }
  },
}));
EOF
```

---

## 🏗️ 第八步：重新构建

在终端中输入：
```bash
npm run build
```

等待构建完成。

---

## 📦 第九步：上传到COS

1. 登录腾讯云COS控制台
2. 删除存储桶中的所有旧文件
3. 上传 `dist` 文件夹中的所有内容
4. 访问静态网站地址

---

## ✅ 部署完成！

现在所有学生都能通过同一个网址访问，数据会自动同步！
