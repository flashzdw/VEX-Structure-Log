# VEX 结构记录系统 - Cloudflare 部署指南

## 📋 准备工作

您需要先注册一个 Cloudflare 账号（免费）。

---

## 🚀 部署步骤

### 第一步：安装 Wrangler CLI（如果还没安装）

打开终端，运行以下命令：

```bash
npm install -g wrangler
```

如果遇到权限问题，请先运行：

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

然后再运行：

```bash
npm install -g wrangler
```

### 第二步：登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，让您登录 Cloudflare 账号。

### 第三步：创建 D1 数据库

```bash
wrangler d1 create vex-structure-db
```

创建成功后，会显示数据库信息，包括 `database_id`。

### 第四步：更新 wrangler.toml

打开项目中的 [wrangler.toml](file:///Users/bbc/Desktop/TRAE-Solo-517/wrangler.toml) 文件，把 `database_id` 替换为第三步中得到的数据库 ID。

### 第五步：创建数据库表

```bash
wrangler d1 execute vex-structure-db --file=api/schema.sql
```

### 第六步：部署 Workers API

```bash
wrangler deploy
```

部署成功后，会显示您的 Workers URL，类似：`https://vex-structure-api.your-subdomain.workers.dev`

### 第七步：配置前端 API 地址

打开 [src/config.ts](file:///Users/bbc/Desktop/TRAE-Solo-517/src/config.ts) 文件，把 `baseUrl` 替换为第六步中得到的 Workers URL。

例如：

```typescript
export const API_CONFIG = {
  baseUrl: 'https://vex-structure-api.your-subdomain.workers.dev',
};
```

### 第八步：重新构建前端

```bash
npm run build
```

### 第九步：部署到腾讯云 COS

1. 登录腾讯云 COS 控制台
2. 进入您的存储桶
3. 删除所有旧文件
4. 上传 `dist` 文件夹中的所有文件
5. 访问您的静态网站地址

---

## ✅ 完成！

现在您的系统已经部署完成，具有以下功能：

- ✅ 数据保存在 Cloudflare D1 数据库中
- ✅ 团队成员可以通过同一个网址访问和编辑数据
- ✅ 数据实时同步
- ✅ 免费额度足够日常使用

---

## 🔧 常用命令

| 命令 | 说明 |
|------|------|
| `wrangler login` | 登录 Cloudflare |
| `wrangler deploy` | 部署 Workers |
| `wrangler d1 execute <db-name> --file=<sql-file>` | 执行 SQL 脚本 |
| `wrangler d1 execute <db-name> --command="SELECT * FROM records"` | 执行 SQL 查询 |

---

## 🆘 常见问题

### Q: 部署后数据没有同步？
A: 请检查 [src/config.ts](file:///Users/bbc/Desktop/TRAE-Solo-517/src/config.ts) 中的 URL 是否正确配置。

### Q: 如何查看数据库中的数据？
A: 运行：`wrangler d1 execute vex-structure-db --command="SELECT * FROM records"`

### Q: 如何重新部署 API？
A: 运行：`wrangler deploy`
