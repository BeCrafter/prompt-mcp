# 开发文档

本文档包含 MCP Prompt Server 的开发相关信息，包括项目结构、开发环境设置、代码说明等。

## 📁 项目结构

```
prompt-mcp/
├── src/                    # 源代码目录
│   ├── index.js           # 主入口文件
│   ├── config.js          # 配置管理
│   ├── logger.js          # 日志工具
│   ├── promptManager.js   # Prompt 管理器
│   └── promptProcessor.js # Prompt 处理器
├── prompts/               # Prompt 文件目录
│   ├── code-review.yaml
│   ├── doc-generator.yaml
│   └── error-fixer.yaml
├── bin/                   # CLI 可执行文件
│   └── prompt-mcp
├── .github/               # GitHub Actions 配置
│   └── workflows/
│       └── npm-publish.yml
├── package.json
├── package-lock.json
├── env.example            # 环境变量示例
├── README.md              # 主文档
├── DEVELOPMENT.md         # 开发文档（本文件）
└── RELEASE.md             # 发布文档
```

## 🛠️ 开发环境设置

### 1. 克隆项目

```bash
git clone https://github.com/BeCrafter/prompt-mcp.git
cd prompt-mcp
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式运行

```bash
# 开发模式（自动重启）
npm run dev

# 或者手动启动
npm start
```

### 4. 运行测试

```bash
npm test
```

## 🏗️ 代码结构说明

### 核心模块

#### Config (`src/config.js`)
配置管理类，负责：
- 解析命令行参数
- 处理环境变量
- 管理prompts目录
- 验证配置有效性

**主要方法：**
- `parseCommandLineArgs()`: 解析命令行参数
- `validate()`: 验证配置
- `ensurePromptsDir()`: 确保prompts目录存在
- `showConfig()`: 显示当前配置

#### Logger (`src/logger.js`)
日志工具类，提供：
- 分级日志输出（error/warn/info/debug）
- 统一的日志格式
- 可配置的日志级别

**使用示例：**
```javascript
import { logger } from './logger.js';

logger.info('服务器启动成功');
logger.error('发生错误:', error);
logger.debug('调试信息:', data);
```

#### PromptManager (`src/promptManager.js`)
Prompt管理器，负责：
- 加载prompt文件
- 验证prompt格式
- 管理prompt状态
- 提供prompt查询接口

**主要方法：**
- `loadPrompts()`: 加载所有prompts
- `getPrompt(name)`: 获取指定prompt
- `getPrompts()`: 获取所有prompts
- `validatePrompt(prompt)`: 验证prompt格式

#### PromptProcessor (`src/promptProcessor.js`)
Prompt处理器，负责：
- 处理prompt内容
- 参数验证和替换
- 生成最终输出

**主要方法：**
- `processPrompt(prompt, args)`: 处理prompt
- `validateArguments(prompt, args)`: 验证参数
- `replaceVariables(content, args)`: 替换变量

### 参数验证

使用 Zod 进行严格的参数验证：

```javascript
import { z } from 'zod';

const ArgumentValidator = {
  string: z.string(),
  number: z.number(),
  boolean: z.boolean()
};
```

## 🐛 错误处理

### 错误处理策略

1. **配置错误**：
   - 验证prompts目录是否存在
   - 检查环境变量格式
   - 提供友好的错误信息

2. **文件加载错误**：
   - 跳过无效的prompt文件
   - 记录详细的错误日志
   - 继续加载其他文件

3. **运行时错误**：
   - 捕获所有异常
   - 返回标准化的错误响应
   - 记录错误日志

### 错误响应格式

```javascript
{
  content: [
    {
      type: "text",
      text: "错误: 错误描述"
    }
  ],
  isError: true
}
```

## ⚡ 性能优化

### 1. 并行加载
- 使用 `Promise.all()` 并行加载多个prompt文件
- 减少文件I/O等待时间

### 2. 缓存机制
- 使用 Map 数据结构存储prompts
- 避免重复的文件读取操作

### 3. 内存管理
- 及时释放不需要的资源
- 避免内存泄漏

### 4. 日志优化
- 根据日志级别过滤输出
- 避免不必要的字符串拼接

## 🤝 贡献指南

### 1. 代码规范

- 使用 ES6+ 语法
- 遵循 ESLint 配置
- 添加适当的注释
- 保持代码简洁

### 2. 提交规范

使用约定式提交格式：

```bash
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建过程或辅助工具的变动
```

### 3. 测试要求

- 为新功能添加测试用例
- 确保所有测试通过
- 保持测试覆盖率

### 4. 文档更新

- 更新相关文档
- 添加使用示例
- 更新API文档

## 🔧 调试技巧

### 1. 启用调试日志

```bash
LOG_LEVEL=debug npm run dev
```

### 2. 查看配置信息

```bash
npm run help
```

### 3. 验证prompt文件

```bash
# 检查prompt文件格式
node -e "
import { PromptManager } from './src/promptManager.js';
const manager = new PromptManager('./prompts');
manager.loadPrompts().then(result => console.log(result));
"
```

### 4. 测试MCP接口

使用MCP客户端工具测试服务器接口：

```bash
# 安装MCP客户端
npm install -g @modelcontextprotocol/cli

# 测试服务器
mcp-client --stdio npx @becrafter/prompt-mcp
```

## 📊 监控和日志

### 日志级别

- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息（默认）
- `debug`: 调试信息

### 日志格式

```
[时间戳] [级别] 消息内容
```

### 监控指标

- 启动时间
- 加载的prompt数量
- 错误率
- 内存使用情况

## 🚀 部署建议

### 1. 生产环境配置

```bash
# 设置生产环境变量
export LOG_LEVEL=info
export MAX_PROMPTS=1000
export MCP_SERVER_NAME=prompt-mcp-prod
```

### 2. 容器化部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY prompts/ ./prompts/
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. 监控和告警

- 设置健康检查端点
- 配置日志收集
- 设置性能监控
- 配置错误告警
