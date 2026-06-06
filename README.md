# 医疗器械不良事件上报系统

基于 React + TypeScript + Vite + Express 的全栈 Web 应用，用于医疗器械不良事件的上报、审核、整改跟踪和归档管理。

## 功能特性

- 不良事件登记与上报
- 事件审核（通过/驳回）
- 整改任务分配与跟踪
- 患者信息脱敏展示
- 严重程度预警（24小时上报时限）
- 状态流转日志
- 归档管理（整改未关闭不可归档）

## 状态流转说明

### 事件状态
- **已登记**：事件刚创建，待提交上报
- **已上报**：已提交上报，待审核
- **审核通过**：审核通过，可分配整改任务
- **审核驳回**：审核被驳回，需修改后重新提交
- **整改中**：已分配整改任务，正在整改
- **已归档**：所有整改完成，事件已归档

### 整改任务状态
- **待执行**：整改任务刚创建
- **执行中**：整改进行中
- **已关闭**：整改完成

## 新增场景说明

### 场景一：整改任务关闭后自动回写主单状态

**业务逻辑**：
1. 当事件状态为"整改中"时，系统会分配整改任务
2. 每个整改任务完成后，点击"关闭"按钮将其标记为"已关闭"
3. 系统自动检查该事件下的所有整改任务
4. 当**所有**整改任务都变为"已关闭"时，主单状态自动从"整改中"流转为"审核通过"
5. 状态变更会自动记录到状态流转日志中，操作人为"系统"，备注为"所有整改任务已关闭，自动流转至审核通过"

**代码实现**：
- 后端：[eventService.ts](file:///Users/mingyuan/workspace/sihuo/wangxtw3/765/api/services/eventService.ts#L252-L270) 中的 `closeRectification` 函数
- 前端：关闭整改任务后自动刷新事件详情，展示最新状态

### 场景二：归档校验不可绕过

**业务逻辑**：
1. 归档操作必须满足"所有整改任务已关闭"的前置条件
2. 系统提供双重校验机制，确保无法绕过：
   - **归档专用接口**：`PUT /api/events/:id/archive` 接口在执行归档前先调用 `checkArchiveEligibility` 进行校验
   - **通用状态更新接口**：`PUT /api/events/:id/status` 接口在更新状态为"已归档"时，同样会触发归档校验
3. 校验不通过时，返回明确的错误信息，提示未关闭的整改任务数量
4. 前端展示归档警告弹窗，引导用户先处理整改任务

**代码实现**：
- 后端归档校验：[eventService.ts](file:///Users/mingyuan/workspace/sihuo/wangxtw3/765/api/services/eventService.ts#L38-L50) 中的 `checkArchiveEligibility` 函数
- 后端状态更新校验：[eventService.ts](file:///Users/mingyuan/workspace/sihuo/wangxtw3/765/api/services/eventService.ts#L162-L179) 中的 `updateEventStatus` 函数
- 前端警告弹窗：[ArchiveWarningModal.tsx](file:///Users/mingyuan/workspace/sihuo/wangxtw3/765/src/components/ArchiveWarningModal.tsx)

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- React Router 路由
- Zustand 状态管理
- Tailwind CSS 样式
- Lucide React 图标库

### 后端
- Express.js Web 框架
- SQL.js 嵌入式数据库
- TypeScript 类型支持
- UUID 主键生成

## 启动方式

### 开发模式（推荐）

同时启动前端和后端开发服务器：

```bash
npm run dev
```

### 分别启动

启动前端开发服务器：
```bash
npm run client:dev
```

启动后端开发服务器（带热重载）：
```bash
npm run server:dev
```

### 生产模式

```bash
npm start
```

### 其他命令

构建前端：
```bash
npm run build
```

代码检查：
```bash
npm run lint
```

类型检查：
```bash
npm run check
```

初始化种子数据：
```bash
npm run seed
```

## 项目结构

```
.
├── api/                    # 后端代码
│   ├── routes/            # API 路由
│   ├── services/          # 业务逻辑
│   ├── app.ts             # Express 应用配置
│   ├── bootstrap.ts       # 应用启动引导
│   ├── database.ts        # 数据库配置
│   └── server.ts          # 服务器入口
├── src/                   # 前端代码
│   ├── components/        # 公共组件
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具函数
│   ├── pages/             # 页面组件
│   ├── store/             # 状态管理
│   ├── App.tsx            # 应用根组件
│   └── main.tsx           # 前端入口
├── shared/                # 共享类型定义
├── data/                  # 数据库文件
├── public/                # 静态资源
└── scripts/               # 脚本文件
```

## API 接口

### 事件管理
- `GET /api/events` - 获取事件列表（支持分页、筛选）
- `GET /api/events/stats` - 获取统计数据
- `GET /api/events/:id` - 获取事件详情（含状态日志和整改任务）
- `POST /api/events` - 创建新事件
- `PUT /api/events/:id/status` - 更新事件状态
- `PUT /api/events/:id/archive` - 归档事件

### 整改管理
- `GET /api/rectifications` - 获取整改任务列表
- `GET /api/rectifications/:id` - 获取整改任务详情
- `POST /api/rectifications` - 创建整改任务
- `PUT /api/rectifications/:id` - 更新整改任务
- `PUT /api/rectifications/:id/close` - 关闭整改任务

## 数据模型

### AdverseEvent（不良事件）
- id, event_code, event_name, severity, status
- event_time, discover_time, description
- device_name, device_model, manufacturer, batch_no
- patient_name, patient_age, patient_gender, injury_level
- reporter_id, reporter_name, created_at, updated_at

### Rectification（整改任务）
- id, event_id, measure, responsible_person
- deadline, status, closed_at, created_at

### EventStatusLog（状态日志）
- id, event_id, from_status, to_status
- operator, operated_at, remark
