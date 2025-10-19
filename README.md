# MCP Prompt Server

[![npm version](https://badge.fury.io/js/%40becrafter%2Fprompt-mcp.svg)](https://www.npmjs.com/package/@becrafter/prompt-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

基于 Model Context Protocol (MCP) 的 Prompt 管理服务器，将 AI 提示词封装为可复用的 MCP 工具。

## 核心特性

- 🛠️ 四个核心工具：列表、获取、搜索、重载
- 🔑 8位唯一ID：基于文件路径哈希，避免冲突
- 📁 递归扫描：自动发现子目录中的 prompt
- 🌐 远程支持：从远程服务器加载 prompts
- 🔄 热重载：运行时重新加载

## 快速开始

### 1. 安装

```bash
npm install @becrafter/prompt-mcp
```

### 2. 配置 MCP 客户端

编辑配置文件（macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "prompt-mcp": {
      "command": "npx",
      "args": ["-y", "@becrafter/prompt-mcp"]
    }
  }
}
```

**自定义 prompts 目录**：
```json
{
  "mcpServers": {
    "prompt-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@becrafter/prompt-mcp",
        "--prompts-dir",
        "/path/to/your/prompts"
      ]
    }
  }
}
```

> ⚠️ **重要**：不要使用 `npm start`，会导致 JSON 解析错误。使用 `npx` 或 `node` 命令。

### 3. 创建 Prompt

```yaml
# prompts/code-review.yaml
name: "代码审查助手"
description: "帮助进行代码审查"
messages:
  - role: "user"
    content:
      text: "请审查以下{{language}}代码：\n```\n{{code}}\n```"
arguments:
  - name: "language"
    description: "编程语言"
    required: true
  - name: "code"
    description: "代码内容"
    required: true
```

### 4. 使用工具

在 Claude Desktop 中直接调用：
- `get_prompt_list` - 查看所有可用 prompts
- `get_prompt` - 获取特定 prompt（使用 8 位 ID）
- `search_prompts` - 搜索 prompts
- `reload_prompts` - 重新加载

## MCP 工具

### get_prompt_list
获取所有可用的 prompt 列表。

**返回示例**：
```json
{
  "success": true,
  "count": 3,
  "prompts": [
    {
      "id": "a1b2c3d4",
      "name": "code-review",
      "description": "代码审查助手",
      "hasArguments": true
    }
  ]
}
```

### get_prompt
根据 ID 获取特定 prompt 的完整内容。

**参数**：
- `prompt_id` (string, 必需): 8位唯一ID

### search_prompts
搜索 prompts，支持模糊匹配。

**参数**：
- `title` (string, 必需): 搜索关键词

**特性**：
- 在 `name` 和 `description` 字段中搜索
- 按相关性排序
- 支持完全匹配、包含匹配、部分词匹配

### reload_prompts
重新加载所有 prompts。

## 配置

### 命令行参数

```bash
# 指定 prompts 目录
npx @becrafter/prompt-mcp --prompts-dir /path/to/prompts

# 使用远程服务器
npx @becrafter/prompt-mcp --remote-url https://api.example.com/prompts

# 设置请求头
npx @becrafter/prompt-mcp -r https://api.example.com -H '{"Authorization":"Bearer token"}'
```

### 环境变量

```bash
PROMPTS_DIR=/path/to/prompts          # prompts 目录
REMOTE_URL=https://api.example.com    # 远程服务器
LOG_LEVEL=info                        # 日志级别 (error/warn/info/debug)
RECURSIVE_SCAN=true                   # 递归扫描子目录
```

完整配置参考 [env.example](./env.example)

## 远程服务

### 配置

```bash
export REMOTE_URL="https://your-server.com"
export REMOTE_HEADERS='{"Authorization":"Bearer token"}'
```

### API 接口

**获取列表**：`GET {REMOTE_URL}`
```json
[
  {
    "name": "prompt-name",
    "description": "描述",
    "messages": [...],
    "arguments": [...],
    "uniqueId": "a1b2c3d4"
  }
]
```

详细规范：[REMOTE_SERVICE_API.md](./docs/REMOTE_SERVICE_API.md)

## Prompt 文件格式

```yaml
name: "prompt名称"              # 必需
description: "prompt描述"       # 可选
messages:                      # 可选
  - role: "user"
    content:
      text: "内容，支持{{参数}}占位符"
arguments:                     # 可选
  - name: "参数名"
    description: "参数描述"
    type: "string"             # string, number, boolean
    required: true             # true, false
```

## 故障排除

### 常见问题

**找不到 prompt？**
- 使用 `get_prompt_list` 查看所有可用 ID
- 确保使用 8 位 ID，不是 name

**服务器无法启动？**
- 检查 Node.js 版本 (>= 18.0.0)
- 检查 prompts 目录是否存在

**需要调试？**
```bash
LOG_LEVEL=debug npx @becrafter/prompt-mcp
```

## 文档

- [开发文档](./docs/DEVELOPMENT.md) - 项目结构、开发指南
- [远程服务API](./docs/REMOTE_SERVICE_API.md) - 接口规范
- [NPM发布](./docs/NPM_RELEASE.md) - 发布流程

## 许可证

MIT License
