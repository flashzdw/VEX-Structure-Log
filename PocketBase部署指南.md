# VEX 机器人结构改动日志 - PocketBase 部署指南

## 为什么选择 PocketBase？

- 🌐 **完全免费** - 开源、无付费限制
- 🚀 **部署简单** - 单文件运行，无需复杂配置
- 🔒 **数据安全** - 所有数据存放在本地，完全掌控
- 📱 **局域网访问** - 同网络下其他设备可直接访问
- 🔄 **实时同步** - 数据变更实时同步到所有用户

## 第一步：下载并运行 PocketBase

### 1. 下载 PocketBase

访问官网下载页面：https://pocketbase.io/

根据您的操作系统下载对应的版本：
- Windows: `pocketbase_x.x.x_windows_amd64.zip`
- Mac (Intel): `pocketbase_x.x.x_darwin_amd64.zip`
- Mac (Apple Silicon): `pocketbase_x.x.x_darwin_arm64.zip`
- Linux: 根据发行版选择对应的包

### 2. 解压并运行

将下载的文件解压到一个您想存放数据的文件夹，然后：

**Windows：**
- 双击 `pocketbase.exe` 即可运行
- 或者在命令行中：`./pocketbase.exe serve`

**Mac/Linux：**
- 打开终端，进入解压后的文件夹
- 运行：`chmod +x pocketbase` （添加执行权限）
- 运行：`./pocketbase serve`

### 3. 看到这样的提示就成功了！

```
➜ PocketBase starting on http://127.0.0.1:8090
➜ REST API: http://127.0.0.1:8090/api/
➜ Admin UI: http://127.0.0.1:8090/_/
```

## 第二步：配置数据库（通过 Admin UI）

### 1. 打开 Admin 页面

在浏览器中打开：`http://127.0.0.1:8090/_/`

### 2. 创建管理员账号

第一次打开会让您创建一个管理员账号：
- 输入邮箱
- 输入密码（至少8位）
- 点击"Create"

### 3. 创建数据库表 (Collections)

按顺序创建以下3个集合：

---

### 集合1：records（工程记录）

1. 点击 "Create Collection"
2. 选择 "Base collection"
3. Collection Name 输入：`records`
4. 点击 "Create"
5. 点击 "New Field" 添加以下字段：

| 字段名 | 字段类型 | 可选设置 |
|--------|----------|----------|
| `date` | Plain text | Required |
| `author` | Plain text | Required |
| `module` | Plain text | Required |
| `team` | Plain text | - |
| `reason` | Plain text | - |
| `content` | Plain text | - |
| `photos` | File | Multiple files, Max size: 10MB |
| `testResult` | Plain text | - |
| `problems` | Plain text | - |
| `nextSteps` | Plain text | - |
| `rating` | Number | Min: 0, Max: 5 |
| `milestone` | Bool | Default: false |

---

### 集合2：teams（队伍管理）

1. 点击 "Create Collection"
2. 选择 "Base collection"
3. Collection Name 输入：`teams`
4. 点击 "Create"
5. 添加以下字段：

| 字段名 | 字段类型 | 可选设置 |
|--------|----------|----------|
| `name` | Plain text | Required |
| `inviteCode` | Plain text | Required |
| `ownerId` | Plain text | Required |

---

### 集合3：team_members（队伍成员）

1. 点击 "Create Collection"
2. 选择 "Base collection"
3. Collection Name 输入：`team_members`
4. 点击 "Create"
5. 添加以下字段：

| 字段名 | 字段类型 | 可选设置 |
|--------|----------|----------|
| `teamId` | Plain text | Required |
| `userId` | Plain text | Required |
| `role` | Plain text | Default: member |
| `userEmail` | Plain text | - |

---

### 配置访问权限 (Important!)

为了安全起见，需要配置权限，让用户只能访问自己的数据：

**对于 `records` 和 `teams` 集合：**
1. 点击集合名称
2. 点击 "API Rules" 标签
3. 把以下所有规则都改为：`@request.auth.id != ""`
   - List/Search
   - View
   - Create
   - Update
   - Delete

## 第三步：配置前端应用

### 1. 创建 .env 文件

在项目根目录下创建一个 `.env.local` 文件（已创建好），内容如下：

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

**局域网访问配置：**
如果您想让同网络下的其他设备访问，先查看您的本机IP：
- Windows: `ipconfig` 查找 IPv4 地址（通常是 192.168.1.x）
- Mac: `ifconfig` 或在设置->网络中查看
- Linux: `ifconfig` 或 `ip addr`

然后修改为：
```
VITE_POCKETBASE_URL=http://您的本机IP:8090
```

**启动PocketBase时也要绑定局域网IP：**
```
./pocketbase serve --http=0.0.0.0:8090
```

### 2. 启动前端应用

在项目目录下运行：
```bash
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`

## 第四步：注册账号并开始使用

### 1. 注册账号

1. 打开应用
2. 点击"没有账号？立即注册"
3. 输入邮箱、密码
4. 点击注册

### 2. 创建队伍

1. 登录后，点击导航栏的"设置"
2. 点击"添加新队伍"
3. 输入队伍名称（例如：8009A）
4. 队伍会自动生成一个邀请码

### 3. 邀请其他成员

1. 把您的访问地址发给其他成员（局域网IP）
2. 告诉他们邀请码
3. 他们注册账号后，可以在设置中通过邀请码加入队伍

### 4. 创建第一条记录

1. 点击首页的"新建"
2. 填写日期、负责人、模块等信息
3. 保存记录！

## 数据备份与恢复

### 备份数据

PocketBase 所有数据存放在 `pb_data` 文件夹中：
1. 关闭 PocketBase 服务
2. 复制整个 `pb_data` 文件夹备份即可

### 恢复数据

1. 把备份的 `pb_data` 文件夹替换掉当前的
2. 重启 PocketBase 服务即可

## 常见问题

### Q: 手机能访问吗？
A: 可以！只要手机和电脑在同一WiFi下，访问电脑的局域网IP即可。

### Q: PocketBase 需要一直开着吗？
A: 是的，如果要多人协作，需要一台电脑一直运行 PocketBase 作为服务器。

### Q: 数据安全吗？
A: 非常安全！所有数据都在本地，完全由您自己掌控。定期备份 `pb_data` 文件夹就没问题。

### Q: 后期能升级到云端吗？
A: 可以！等您需要时，可以很容易地迁移到 Supabase 或其他云服务。

## 下一步

当您需要：
- 外网访问（团队成员不在同一个地方）
- 更高的可靠性和自动备份
- 更大规模的团队协作

您可以考虑升级到 Supabase 或其他云服务，代码改动非常小！
