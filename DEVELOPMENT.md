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

### 4. 使用MCP Inspector进行可视化调试

MCP Inspector是最推荐的调试方式，提供直观的图形界面：

#### 本地代码调试

**使用本地源代码进行调试**:
```bash
# 在项目根目录启动Inspector，直接使用本地代码
npx @modelcontextprotocol/inspector node src/index.js

# 或者使用npm脚本
npx @modelcontextprotocol/inspector npm start

# 开发模式（自动重启）
npx @modelcontextprotocol/inspector npm run dev
```

**本地调试的优势**:
- 🔧 **实时修改**: 修改代码后Inspector会自动重新连接
- 🐛 **断点调试**: 可以在IDE中设置断点进行调试
- 📝 **日志查看**: 实时查看本地代码的日志输出
- ⚡ **快速迭代**: 无需发布包即可测试功能

#### 已发布包调试

**使用已发布的包进行调试**:
```bash
# 使用已发布的npm包
npx @modelcontextprotocol/inspector npx @becrafter/prompt-mcp
```

**Inspector调试优势**:
- 🎯 **直观界面**: 无需命令行操作，图形化界面更友好
- 🔍 **实时测试**: 可以实时测试所有MCP工具
- 📊 **结果可视化**: JSON结果格式化显示，易于阅读
- 🐛 **错误调试**: 详细的错误信息帮助快速定位问题
- 📝 **历史记录**: 保存测试历史，便于重复测试
- ⚡ **性能监控**: 显示工具执行时间，优化性能

### 4. 测试MCP接口

使用MCP客户端工具测试服务器接口：

```bash
# 安装MCP客户端
npm install -g @modelcontextprotocol/cli

# 测试服务器
mcp-client --stdio npx @becrafter/prompt-mcp
```

### 5. 使用MCP Inspector进行可视化调试

MCP Inspector是一个强大的可视化调试工具，可以直观地测试和调试MCP服务器：

#### 安装MCP Inspector

```bash
# 全局安装MCP Inspector
npm install -g @modelcontextprotocol/inspector
```

#### 启动Inspector

**本地代码调试**:
```bash
# 使用本地源代码启动Inspector
npx @modelcontextprotocol/inspector node src/index.js

# 或使用npm脚本
npx @modelcontextprotocol/inspector npm start
```

**已发布包调试**:
```bash
# 使用已发布的npm包启动Inspector
npx @modelcontextprotocol/inspector npx @becrafter/prompt-mcp
```

#### Inspector功能特性

1. **可视化界面**: 提供Web界面进行交互式调试
2. **工具列表**: 自动发现并显示所有可用的MCP工具
3. **参数输入**: 图形化界面输入工具参数
4. **结果展示**: 实时显示工具执行结果
5. **错误调试**: 详细的错误信息和调试信息

#### 使用步骤

**本地代码调试步骤**:

1. **启动Inspector（本地代码）**:
   ```bash
   # 在项目根目录执行
   npx @modelcontextprotocol/inspector node src/index.js
   ```

2. **打开浏览器**: Inspector会自动打开浏览器界面（通常是 `http://localhost:3000`）

3. **查看工具列表**: 在左侧面板可以看到所有可用的MCP工具：
   - `get_prompt_list`: 获取所有prompt列表
   - `get_prompt`: 根据ID获取特定prompt
   - `reload_prompts`: 重新加载prompts

4. **测试工具**:
   - 点击工具名称
   - 在参数输入框中填写参数（如需要）
   - 点击"Execute"按钮执行
   - 查看右侧的结果面板

5. **实时调试**:
   - 修改本地代码（如`src/index.js`或`src/promptManager.js`）
   - 保存文件后Inspector会自动重新连接
   - 重新测试工具验证修改效果

#### Inspector调试示例

**测试get_prompt_list工具**:
1. 选择`get_prompt_list`工具
2. 无需输入参数
3. 点击"Execute"
4. 查看返回的prompt列表和ID映射

**测试get_prompt工具**:
1. 选择`get_prompt`工具
2. 在`prompt_id`参数中输入固定长度ID（如`a1b2c3d4`）
3. 点击"Execute"
4. 查看返回的完整prompt信息

**测试reload_prompts工具**:
1. 选择`reload_prompts`工具
2. 无需输入参数
3. 点击"Execute"
4. 查看重新加载的结果

#### Inspector高级功能

1. **历史记录**: 查看之前的工具调用历史
2. **参数模板**: 保存常用的参数配置
3. **批量测试**: 支持批量执行多个工具调用
4. **性能监控**: 显示工具执行时间和性能指标
5. **日志查看**: 实时查看服务器日志输出

#### 调试技巧

**本地代码调试技巧**:

1. **实时调试**: 
   - 修改prompt文件后，使用`reload_prompts`工具重新加载
   - 修改源代码后，Inspector会自动重新连接
   - 在IDE中设置断点，结合Inspector进行调试

2. **ID验证**: 
   - 使用`get_prompt_list`查看所有可用的固定长度ID
   - 验证新生成的ID是否符合预期格式

3. **错误排查**: 
   - 通过Inspector的错误信息快速定位问题
   - 查看本地代码的日志输出
   - 使用IDE的调试功能单步执行

4. **性能测试**: 
   - 监控工具执行时间，优化性能瓶颈
   - 使用`LOG_LEVEL=debug`查看详细日志

5. **代码热重载**:
   - 使用`npm run dev`启动开发模式
   - 修改代码后自动重启服务器
   - Inspector会自动重新连接到新的服务器实例

#### 常见问题排查

**问题1: Inspector无法连接本地服务器**
```bash
# 检查本地服务器是否正常启动
npm start

# 检查端口是否被占用
lsof -i :3000

# 检查本地代码是否有语法错误
node --check src/index.js
```

**问题2: 本地代码修改后Inspector未重新连接**
- 确保使用`npm run dev`启动开发模式
- 检查文件保存是否正确
- 手动重启Inspector: `npx @modelcontextprotocol/inspector node src/index.js`

**问题3: 工具执行失败**
- 检查参数格式是否正确
- 查看错误信息面板
- 检查本地代码的日志输出
- 在IDE中设置断点进行调试

**问题4: 固定长度ID查找失败**
- 使用`get_prompt_list`确认ID是否存在
- 检查ID格式是否正确（8位十六进制）
- 尝试使用原始名称进行查找
- 检查`promptManager.js`中的ID生成逻辑

**问题5: 本地prompt文件加载失败**
- 检查prompt文件格式是否正确
- 使用`LOG_LEVEL=debug`查看详细加载日志
- 验证文件路径和权限

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

### 4. 生产环境调试

在生产环境中，可以使用MCP Inspector进行远程调试：

```bash
# 在生产服务器上启动Inspector
npx @modelcontextprotocol/inspector npx @becrafter/prompt-mcp

# 通过SSH隧道访问Inspector界面
ssh -L 3000:localhost:3000 user@production-server
```

**生产环境调试注意事项**:
- 🔒 **安全考虑**: 确保Inspector只在内部网络访问
- 📊 **性能影响**: Inspector会增加少量性能开销
- 🕐 **访问控制**: 限制Inspector的访问权限
- 📝 **日志记录**: 记录所有调试操作
