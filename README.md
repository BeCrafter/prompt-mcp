# MCP Prompt Server

[![npm version](https://badge.fury.io/js/%40becrafter%2Fprompt-mcp.svg)](https://www.npmjs.com/package/@becrafter/prompt-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

一个基于 Model Context Protocol (MCP) 的智能 Prompt 管理服务器，采用"Prompt 即工具"的设计理念，将复杂的AI提示词封装成可复用的MCP工具，让用户可以通过标准化的接口调用各种预设的AI能力。

## 📖 目录

- [特性](#-特性)
- [安装](#-安装)
- [快速开始](#-快速开始)
- [配置](#-配置)
- [使用方法](#-使用方法)
- [API文档](#-api文档)
- [使用示例](#-使用示例)
- [相关文档](#-相关文档)
- [许可证](#-许可证)

## ✨ 特性

- 🛠️ **Prompt 即工具**: 将AI提示词封装成标准化的MCP工具，提供统一的调用接口
- 📋 **三个核心工具**: 
  - `get_prompt_list`: 获取所有可用的prompt列表
  - `get_prompt`: 根据ID获取特定prompt的完整内容
  - `reload_prompts`: 重新加载所有预设的prompts
- 📁 **递归目录扫描**: 支持扫描子目录下的prompt文件，自动发现嵌套结构中的提示词
- 🔑 **固定长度唯一ID**: 基于文件路径使用哈希算法生成固定长度的唯一ID，彻底解决同名文件冲突问题，支持ID到路径的反向映射
- 🚀 **模块化架构**: 代码结构清晰，易于维护和扩展
- 📝 **智能日志**: 分级日志系统，支持不同级别的日志输出
- 🔧 **配置管理**: 支持环境变量配置，灵活可定制
- ✅ **类型安全**: 使用 Zod 进行严格的参数验证
- 🔄 **热重载**: 支持运行时重新加载 prompts
- 📊 **状态监控**: 提供详细的加载状态和错误信息
- 🎯 **多类型参数**: 支持 string、number、boolean 等参数类型
- 🌐 **远程服务**: 支持从远程服务器加载和处理 prompts，完全兼容固定长度唯一ID机制
- 🔑 **自定义请求头**: 支持配置远程服务器的请求头信息

## 📦 安装

```bash
# 通过 npm 安装
npm install @becrafter/prompt-mcp

# 或者通过 yarn 安装
yarn add @becrafter/prompt-mcp

# 或者通过 pnpm 安装
pnpm add @becrafter/prompt-mcp
```

## 🛠️ MCP工具说明

本服务器提供三个标准化的MCP工具，遵循"Prompt 即工具"的设计理念：

### 1. get_prompt_list
获取所有可用的prompt列表，包括标题和描述。

**参数**: 无

**返回**: 
```json
{
  "success": true,
  "count": 3,
  "prompts": [
    {
      "id": "a1b2c3d4",
      "name": "code-review",
      "title": "code-review", 
      "description": "帮助进行代码审查的AI助手",
      "arguments": [...],
      "hasArguments": true,
      "filePath": "code-review.yaml",
      "metadata": {
        "fileName": "code-review.yaml",
        "fullPath": "/path/to/prompts/code-review.yaml"
      }
    }
  ],
  "idPathMappings": {
    "a1b2c3d4": "code-review.yaml",
    "e5f6g7h8": "subdir1/test.yaml",
    "i9j0k1l2": "subdir2/nested/deep-test.yaml"
  }
}
```

### 2. get_prompt
根据ID获取特定prompt的完整内容，包括所有消息、参数和元数据。

**参数**:
- `prompt_id` (string, 必需): 要获取的prompt的固定长度ID（基于文件路径哈希生成）

**返回**:
```json
{
  "success": true,
  "prompt": {
    "id": "a1b2c3d4",
    "name": "code-review",
    "title": "code-review",
    "description": "帮助进行代码审查的AI助手", 
    "messages": [...],
    "arguments": [...],
    "filePath": "code-review.yaml",
    "metadata": {
      "fileName": "code-review.yaml",
      "fullPath": "/path/to/prompts/code-review.yaml",
      "uniqueId": "a1b2c3d4"
    }
  }
}
```

### 3. reload_prompts
重新加载所有预设的prompts。

**参数**: 无

**返回**:
```json
{
  "success": true,
  "message": "重新加载完成: 成功 3 个, 失败 0 个",
  "result": {
    "success": 3,
    "errorCount": 0,
    "prompts": [...],
    "loadErrors": {}
  }
}
```

## 🔑 固定长度唯一ID机制说明

### ID生成规则

系统基于文件路径使用SHA-256哈希算法生成固定长度的唯一ID，彻底解决同名文件冲突问题：

1. **哈希计算**: 使用SHA-256算法对文件路径进行哈希计算
2. **长度截取**: 取哈希值的前8位作为唯一ID
3. **固定长度**: 所有ID长度保持一致（8位十六进制字符）
4. **唯一性保证**: 每个文件路径对应一个唯一的固定长度ID

### ID生成示例

```
文件路径                    -> 固定长度ID (8位)
code-review.yaml           -> a1b2c3d4
subdir1/test.yaml          -> e5f6g7h8
subdir2/nested/deep.yaml   -> i9j0k1l2
category/frontend/react.yml -> m3n4o5p6
```

### ID长度说明

- **默认长度**: 8位十六进制字符
- **唯一性**: 8位十六进制可以表示 16^8 = 4,294,967,296 种不同的值
- **一致性**: 所有ID长度完全相同，便于管理和显示
- **可配置**: 支持自定义ID长度（4-16位）

### ID查找机制

系统支持多种方式查找prompt：

1. **固定长度ID查找**（推荐）: 使用基于文件路径哈希生成的固定长度ID
2. **原始名称查找**（向后兼容）: 使用prompt文件中的name字段
3. **相对路径查找**（向后兼容）: 使用文件的相对路径

### ID到路径映射

系统维护ID到文件路径的双向映射，支持：
- 通过ID查找对应的文件路径
- 通过文件路径生成对应的ID
- 在API响应中提供完整的映射关系

## 🌐 远程服务支持

### 远程服务配置

系统支持从远程服务器加载和处理prompts，完全兼容固定长度唯一ID机制：

```bash
# 设置远程服务器地址
export REMOTE_URL="https://your-prompt-server.com"

# 设置请求头（可选）
export REMOTE_HEADERS='{"Authorization":"Bearer your-token"}'

# 启动服务
node src/index.js
```

### 远程服务接口要求

**获取Prompt列表**: `GET {REMOTE_URL}`
```json
[
  {
    "name": "prompt-name",
    "description": "Prompt描述",
    "messages": [...],
    "arguments": [...],
    "uniqueId": "a1b2c3d4"
  }
]
```

**处理Prompt**: `POST {REMOTE_URL}/process`
```json
{
  "promptName": "prompt-name",
  "arguments": {"param": "value"}
}
```

### 远程服务ID机制

**推荐方式**（提供uniqueId）:
- 远程服务只需要提供`uniqueId`字段
- 直接使用远程服务提供的ID，确保唯一性
- 大大减少数据传输负担

**兼容模式**（自动生成）:
- 如果远程服务未提供`uniqueId`，自动生成固定长度唯一ID
- 使用`{prompt.name}.yaml`作为虚拟路径
- 通过SHA-256哈希生成8位唯一ID

详细接口规范请参考：[REMOTE_SERVICE_API.md](./REMOTE_SERVICE_API.md)

## 🚀 快速开始

### 1. 启动服务器

```bash
# 使用默认配置启动（使用内置prompts）
npx @becrafter/prompt-mcp

# 或者全局安装后使用
npm install -g @becrafter/prompt-mcp
prompt-mcp --prompts-dir ./my-prompts
```

### 2. 准备Prompt文件

如果你要使用自定义prompts，需要先创建prompt文件：

```bash
# 创建prompts目录
mkdir my-prompts

# 创建示例prompt文件
cat > my-prompts/example.yaml << 'EOF'
name: "示例助手"
description: "一个简单的示例prompt"
messages:
  - role: "user"
    content:
      text: "你好，{{name}}！请帮我{{task}}。"
arguments:
  - name: "name"
    description: "用户姓名"
    type: "string"
    required: true
  - name: "task"
    description: "要执行的任务"
    type: "string"
    required: true
EOF
```

### 3. 查看帮助信息

```bash
npx @becrafter/prompt-mcp --help
```

### 3. 查看版本信息

```bash
npx @becrafter/prompt-mcp --version
```

## ⚙️ 配置

### 命令行参数

```bash
# 指定prompts目录
npx @becrafter/prompt-mcp --prompts-dir /path/to/prompts
npx @becrafter/prompt-mcp -p ./my-prompts

# 使用远程服务器
npx @becrafter/prompt-mcp --remote-url https://api.example.com/prompts
npx @becrafter/prompt-mcp -r https://api.example.com/prompts

# 设置远程服务器请求头
npx @becrafter/prompt-mcp -r https://api.example.com/prompts -H '{"Authorization":"Bearer token"}'
```

### 环境变量

复制 `env.example` 文件为 `.env` 并根据需要修改：

```bash
cp env.example .env
```

可配置的环境变量：

- `PROMPTS_DIR`: prompts文件所在目录（优先级低于命令行参数）
- `REMOTE_URL`: 远程服务器地址（优先级低于命令行参数）
- `REMOTE_HEADERS`: 远程服务器请求头（JSON格式，优先级低于命令行参数）
- `MCP_SERVER_NAME`: 服务器名称（默认: prompt-mcp）
- `MCP_SERVER_VERSION`: 服务器版本（默认: 0.1.1）
- `LOG_LEVEL`: 日志级别（error/warn/info/debug，默认: info）
- `MAX_PROMPTS`: 最大prompt数量限制（默认: 100）
- `RECURSIVE_SCAN`: 是否启用递归扫描子目录（true/false，默认: true）

### 配置优先级

1. **命令行参数** (最高优先级)
2. **环境变量**
3. **默认值** (最低优先级)

## 📝 使用方法

### 1. 创建 Prompt 文件

在 `prompts/` 目录下创建 YAML 或 JSON 格式的 prompt 文件。支持子目录结构，系统会自动递归扫描所有子目录：

```
prompts/
├── code-review.yaml          # 根目录下的prompt
├── doc-generator.yaml
├── subdir1/                  # 子目录
│   └── test-prompt.yaml
└── subdir2/
    └── nested/               # 嵌套子目录
        └── deep-prompt.yaml
```

```yaml
name: "代码审查助手"
description: "帮助进行代码审查的AI助手"
messages:
  - role: "user"
    content:
      text: |
        你是一个专业的代码审查助手。请审查以下代码：
        
        代码语言: {{language}}
        代码内容:
        ```
        {{code}}
        ```
        
        请从以下几个方面进行审查：
        1. 代码质量和可读性
        2. 潜在的安全问题
        3. 性能优化建议
        4. 最佳实践建议
        5. 潜在的bug
        
        请提供具体的改进建议和示例代码。
arguments:
  - name: "language"
    description: "编程语言"
    type: "string"
    required: true
  - name: "code"
    description: "要审查的代码"
    type: "string"
    required: true
```

### 2. Prompt 文件格式

每个 prompt 文件必须包含以下字段：

- `name`: prompt 名称（必需）
- `description`: prompt 描述（可选）
- `messages`: 消息数组（可选）
- `arguments`: 参数定义数组（可选）

#### 参数定义

```yaml
arguments:
  - name: "参数名"
    description: "参数描述"
    type: "string"  # string, number, boolean
    required: true   # true/false
```

### 3. 可用工具

服务器启动后，会自动为每个 prompt 创建一个工具，同时提供以下管理工具：

- `reload_prompts`: 重新加载所有 prompts
- `get_prompt_names`: 获取所有可用的 prompt 名称
- `get_prompt_info`: 获取指定 prompt 的详细信息

## 📚 API文档

### MCP工具接口

服务器实现了标准的 MCP (Model Context Protocol) 接口：

#### ListTools
获取所有可用的工具列表

#### CallTool
调用指定的工具执行 prompt

**参数：**
- `name`: 工具名称
- `arguments`: 工具参数（JSON对象）

**返回：**
- `content`: 执行结果内容数组
- `isError`: 是否发生错误（可选）

## 🎯 使用示例

### 启动服务器

```bash
# 使用默认prompts目录
npx @becrafter/prompt-mcp

# 指定自定义prompts目录
npx @becrafter/prompt-mcp --prompts-dir /path/to/my/prompts

# 使用远程服务器
npx @becrafter/prompt-mcp -r https://api.example.com/prompts

# 使用远程服务器和自定义请求头
npx @becrafter/prompt-mcp -r https://api.example.com/prompts -H '{"Authorization":"Bearer token"}'

# 使用环境变量
PROMPTS_DIR=/custom/prompts npx @becrafter/prompt-mcp
REMOTE_URL=https://api.example.com/prompts REMOTE_HEADERS='{"key":"value"}' npx @becrafter/prompt-mcp

# 调试模式
LOG_LEVEL=debug npx @becrafter/prompt-mcp -p ./prompts
```

### 使用代码审查助手

```javascript
// 调用代码审查助手
const result = await mcpClient.callTool('代码审查助手', {
  language: 'JavaScript',
  code: 'function add(a, b) { return a + b; }'
});
```

### 重新加载 Prompts

```javascript
// 重新加载所有 prompts
const result = await mcpClient.callTool('reload_prompts', {});
console.log(result.content[0].text);
```

### 获取Prompt信息

```javascript
// 获取所有可用的prompts
const result = await mcpClient.callTool('get_prompt_names', {});

// 获取特定prompt的详细信息
const info = await mcpClient.callTool('get_prompt_info', {
  name: '代码审查助手'
});
```

## 📖 相关文档

- [开发文档](./DEVELOPMENT.md) - 项目结构、开发环境设置、贡献指南
- [版本发布](./RELEASE.md) - 版本发布流程、GitHub Actions配置
- [环境配置示例](./env.example) - 环境变量配置示例

## 📄 许可证

MIT License