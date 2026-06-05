# 医疗器械不良事件上报系统 - 交付说明

## 一、项目概述

本系统是医疗器械不良事件上报全栈 Web 应用，实现了从事件登记到整改跟踪的完整业务流程，包含三大异常分支处理机制。

### 核心功能

- **主流程贯通**：事件登记 → 事件上报 → 审核通过/驳回 → 整改跟踪 → 事件归档
- **三大异常分支**：
  1. 严重事件 24 小时内上报拦截
  2. 患者信息脱敏展示与提示
  3. 整改未关闭不能归档拦截

---

## 二、技术架构

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| 前端 | React 18 + TypeScript + Vite + Zustand + TailwindCSS 3 | 响应式 UI，状态管理 |
| 后端 | Express 4 + TypeScript ESM | RESTful API 服务 |
| 数据库 | sql.js (WASM SQLite) | 纯 JS 实现，无需原生编译，数据持久化到文件 |
| 容器化 | Docker + docker-compose | 一键部署 |

### 目录结构

```
765/
├── api/                    # 后端代码
│   ├── services/          # 业务逻辑层
│   ├── routes/            # API 路由层
│   ├── database.ts        # 数据库初始化
│   ├── server.ts          # 服务入口（仅用于本地开发）
│   ├── bootstrap.ts       # 容器启动入口（含数据初始化）
│   └── seed.ts            # 种子数据脚本
├── shared/                # 前后端共享类型
│   └── types.ts
├── src/                   # 前端代码
│   ├── components/        # 通用组件
│   ├── pages/             # 页面组件
│   ├── store/             # Zustand 状态管理
│   └── App.tsx            # 路由配置
├── dist/                  # 前端构建产物（build 后生成）
├── data/                  # 数据库文件目录（自动创建）
├── Dockerfile             # 多阶段容器镜像构建
├── docker-compose.yml     # 容器编排（含健康检查+数据卷）
└── package.json           # 项目依赖
```

---

## 三、容器启动

### 方式一：docker-compose（推荐）

```bash
# 1. 构建并启动容器
docker-compose up -d --build

# 2. 查看服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

### 方式二：Docker 单独运行

```bash
# 构建镜像
docker build -t meddevice-adverse-event .

# 运行容器（端口映射 + 数据卷持久化）
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  --name meddevice-app \
  meddevice-adverse-event
```

### 访问地址

- 前端应用（静态文件由后端服务提供）：http://localhost:3001
- 后端 API：http://localhost:3001/api
- 健康检查：http://localhost:3001/api/health

**说明**：前端构建产物位于 `/app/dist` 目录，由 Express 通过 `express.static()` 中间件提供静态文件服务，所有非 `/api/*` 路径均返回 SPA 单页应用的 `index.html`，支持前端路由。

---

## 四、数据初始化

### 4.1 数据库自动初始化

容器启动时通过 `api/bootstrap.ts` 自动执行以下操作：

1. 检测 `/app/data/meddevice.db` 是否存在
2. 如不存在则创建数据库文件
3. 自动创建三张核心表：
   - `adverse_events` - 不良事件主表
   - `rectifications` - 整改任务表
   - `event_status_log` - 状态流转日志表
4. 创建必要的索引优化查询性能
5. **自动执行种子数据初始化**（通过环境变量 `SEED_ON_STARTUP=true` 控制）

### 4.2 种子数据

容器首次启动时会自动初始化演示数据：
- 5 条不良事件记录（2 条严重、1 条特别严重、2 条一般）
- 3 条整改任务（覆盖待执行、已关闭等状态）

**手动重新执行种子数据**：
```bash
# 进入容器
docker exec -it meddevice-app bash

# 执行种子数据脚本
node --import tsx api/seed.ts
```

### 4.3 数据持久化

数据库文件存储于容器内 `/app/data/meddevice.db`，通过 docker-compose 的数据卷映射到宿主机 `./data/` 目录，保证容器重建数据不丢失。

### 4.4 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | 3001 | 服务监听端口 |
| `NODE_ENV` | production | 运行环境 |
| `SEED_ON_STARTUP` | true | 启动时是否自动执行种子数据 |

---

## 五、健康检查

### 5.1 API 健康检查

**接口**：`GET /api/health`

**响应示例**：
```json
{
  "success": true,
  "message": "ok",
  "timestamp": "2026-06-05T12:00:00.000Z"
}
```

**验证方式**：
```bash
curl http://localhost:3001/api/health
```

### 5.2 Docker 容器健康检查

`docker-compose.yml` 已内置健康检查配置（使用 Node.js 内置 fetch，无需 curl）：

```yaml
healthcheck:
  test: ["CMD", "node", "--input-type=module", "-e", "const r = await fetch('http://localhost:3001/api/health'); process.exit(r.ok ? 0 : 1)"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 20s
```

查看健康状态：
```bash
docker inspect --format='{{.State.Health.Status}}' meddevice-app
```

---

## 六、核心功能验证指南

### 6.1 登记严重事件并验证上报时限提示出现

**前置条件**：系统已启动，可正常访问

**操作步骤**：

1. 访问首页 → 点击左侧导航「事件登记」
2. 填写事件基本信息：
   - 事件名称：测试严重不良事件
   - **严重等级：选择「严重」或「特别严重」**
   - 事件时间：选择当前时间（确保 24 小时内）
   - 发现时间：选择当前时间
3. 填写设备信息和患者信息
4. 点击「提交登记」按钮

**预期结果**：
- ✅ 提交后立即弹出「严重事件上报时限提醒」模态框
- ✅ 模态框显示红色警告图标
- ✅ 显示内容包含：
  - 事件等级（严重/特别严重）
  - 法规提醒文字（"根据《医疗器械不良事件监测和再评价管理办法》..."）
  - 上报截止时间（精确到分）
  - 剩余小时数（倒计时）
- ✅ 点击「确认并继续」后事件保存成功，状态为「已登记」

**API 级验证**：
```bash
# 创建严重事件，观察返回的 severity_check 字段
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "API测试严重事件",
    "severity": "严重",
    "event_time": "2026-06-05T12:00",
    "discover_time": "2026-06-05T12:30",
    "description": "测试",
    "device_name": "测试设备",
    "device_model": "TEST-001",
    "manufacturer": "测试厂商",
    "patient_name": "测试患者",
    "patient_age": 50,
    "patient_gender": "男",
    "injury_level": "中度"
  }'
```

### 6.2 患者信息脱敏展示验证

**操作步骤**：
1. 进入「事件列表」页面
2. 查看任意事件的患者姓名字段

**预期结果**：
- ✅ 列表中患者姓名显示为脱敏格式（如：张**丰、李*光）
- ✅ 列表顶部显示黄色提示条：「患者信息已脱敏展示，保护患者隐私」
- ✅ 进入事件详情页，患者信息区域同样脱敏展示
- ✅ 脱敏字段旁有 👁️‍🗨️ 图标，hover 显示「已脱敏」提示

**脱敏规则**：
- 姓名长度 1：`*`
- 姓名长度 2：`张*`
- 姓名长度 ≥3：`张**丰`（首尾保留，中间用 * 替换）

### 6.3 整改未关闭归档拦截验证

**操作步骤**：
1. 选择一个「审核通过」且关联了未关闭整改任务的事件
2. 进入事件详情页
3. 点击「归档」按钮

**预期结果**：
- ✅ 弹出橙色警告模态框
- ✅ 显示：「该事件还有 N 项未关闭的整改任务，请先完成所有整改后再进行归档操作」
- ✅ 归档操作被拦截，事件状态保持不变
- ✅ 关闭所有关联整改任务后，再次点击归档可成功执行

---

## 七、状态流转说明

```
已登记 → 已上报 → 审核通过 → 整改中 → 已归档
                ↓
            审核驳回（可重新上报）
```

| 状态 | 说明 | 可执行操作 |
|------|------|------------|
| 已登记 | 事件刚创建，尚未上报 | 提交上报、编辑、删除 |
| 已上报 | 已提交上报，等待审核 | 查看 |
| 审核通过 | 审核通过，进入整改阶段 | 分配整改任务、归档 |
| 审核驳回 | 审核不通过 | 修改后重新上报 |
| 整改中 | 有未完成的整改任务 | 关闭整改、查看 |
| 已归档 | 所有整改完成，已结案 | 查看 |

---

## 八、常见问题

### Q: 数据库文件在哪里？
A: 宿主机 `./data/meddevice.db`，sql.js 格式，可用 SQLite 工具打开。

### Q: 如何重置数据？
A: 停止容器 → 删除 `data/meddevice.db` → 重启容器 → 执行 `npm run seed`。

### Q: 端口冲突怎么办？
A: 修改 `docker-compose.yml` 中的端口映射，或设置环境变量 `APP_PORT=3002`。

---

*文档版本：v1.0 | 更新时间：2026-06-05*
