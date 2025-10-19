# MCP Prompt Server

[![npm version](https://badge.fury.io/js/%40becrafter%2Fprompt-mcp.svg)](https://www.npmjs.com/package/@becrafter/prompt-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

一个基于 Model Context Protocol (MCP) 的智能 Prompt 管理服务器，采用"Prompt 即工具"的设计理念，将复杂的AI提示词封装成可复用的MCP工具。

## ✨ 核心特性

- 🛠️ **四个核心工具**: `get_prompt_list`、`get_prompt`、`search_prompts`、`reload_prompts`
- 🔑 **固定长度唯一ID**: 基于文件路径哈希生成8位唯一ID，彻底解决同名文件冲突
- 📁 **递归目录扫描**: 自动发现子目录中的prompt文件
- 🌐 **远程服务支持**: 支持从远程服务器加载prompts，只需提供`uniqueId`字段
- ✅ **类型安全**: 使用Zod进行严格的参数验证
- 🔄 **热重载**: 支持运行时重新加载prompts

## 📦 安装

```bash
npm install @becrafter/prompt-mcp
```

## 🚀 快速开始

### 1. 启动服务器

```bash
# 使用默认配置
npx @becrafter/prompt-mcp

# 指定prompts目录
npx @becrafter/prompt-mcp --prompts-dir ./my-prompts

# 使用远程服务器
npx @becrafter/prompt-mcp --remote-url https://api.example.com/prompts
```

### 2. 创建Prompt文件

```yaml
# prompts/code-review.yaml
name: "代码审查助手"
description: "帮助进行代码审查的AI助手"
messages:
  - role: "user"
    content:
      text: "请审查以下{{language}}代码：\n```\n{{code}}\n```"
arguments:
  - name: "language"
    description: "编程语言"
    type: "string"
    required: true
  - name: "code"
    description: "代码内容"
    type: "string"
    required: true
```

## 🛠️ MCP工具

### get_prompt_list
获取所有可用的prompt列表。

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
    "e5f6g7h8": "subdir1/test.yaml"
  }
}
```

### get_prompt
根据ID获取特定prompt的完整内容。

**参数**:
- `prompt_id` (string, 必需): 固定长度ID

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

### search_prompts
搜索符合要求的prompts，支持模糊匹配。

**参数**:
- `title` (string, 必需): 搜索关键词

**返回**:
```json
{
  "success": true,
  "query": "html",
  "count": 5,
  "results": [
    {
      "id": "a15518de",
      "name": "gen_html_web_page",
      "title": "gen_html_web_page",
      "description": "帮助用户将任意中文内容可视化为美观、现代、易读的网页...",
      "arguments": [],
      "hasArguments": false,
      "filePath": "generator/gen_html_web_page.yaml",
      "metadata": {
        "fileName": "gen_html_web_page.yaml",
        "fullPath": "/path/to/prompts/generator/gen_html_web_page.yaml"
      }
    }
  ],
  "debug": {
    "scores": [
      {
        "id": "a15518de",
        "name": "gen_html_web_page",
        "score": 55
      }
    ]
  }
}
```

**搜索算法特性**:
- 🎯 **内容匹配**: 专注于 `name` 和 `description` 字段的内容搜索，不包含ID检索
- 📊 **相关性排序**: 按匹配得分降序排列结果
- 🔍 **多种匹配模式**: 
  - 完全匹配（得分最高）
  - 包含匹配（得分较高）  
  - 部分词匹配（得分适中）
- ⚖️ **加权算法**: name(60%) > description(40%)
- 🌐 **模式兼容**: 完全兼容本地和远程服务两种模式
- 🔑 **功能分离**: ID 精确查找请使用 `get_prompt` 工具

### reload_prompts
重新加载所有预设的prompts。

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

## 🔑 固定长度唯一ID机制

### ID生成规则
1. **哈希计算**: 使用SHA-256算法对文件路径进行哈希计算
2. **长度截取**: 取哈希值的前8位作为唯一ID
3. **固定长度**: 所有ID长度保持一致（8位十六进制字符）

### ID生成示例
```
文件路径                    -> 固定长度ID (8位)
code-review.yaml           -> a1b2c3d4
subdir1/test.yaml          -> e5f6g7h8
subdir2/nested/deep.yaml   -> i9j0k1l2
```

### ID查找机制
- **固定长度ID查找**（推荐）: 使用基于文件路径哈希生成的固定长度ID
- **原始名称查找**（向后兼容）: 使用prompt文件中的name字段
- **相对路径查找**（向后兼容）: 使用文件的相对路径

## 🌐 远程服务支持

### 配置
```bash
# 设置远程服务器地址
export REMOTE_URL="https://your-prompt-server.com"

# 设置请求头（可选）
export REMOTE_HEADERS='{"Authorization":"Bearer your-token"}'
```

### 接口要求

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

### ID机制
- **推荐方式**: 远程服务提供`uniqueId`字段，直接使用确保唯一性
- **兼容模式**: 未提供`uniqueId`时，自动生成固定长度唯一ID

详细接口规范请参考：[REMOTE_SERVICE_API.md](./REMOTE_SERVICE_API.md)

## ⚙️ 配置

### 命令行参数
```bash
# 指定prompts目录
npx @becrafter/prompt-mcp --prompts-dir /path/to/prompts

# 使用远程服务器
npx @becrafter/prompt-mcp --remote-url https://api.example.com/prompts

# 设置远程服务器请求头
npx @becrafter/prompt-mcp -r https://api.example.com/prompts -H '{"Authorization":"Bearer token"}'
```

### 环境变量
```bash
# 复制环境变量示例
cp env.example .env
```

可配置的环境变量：
- `PROMPTS_DIR`: prompts文件所在目录
- `REMOTE_URL`: 远程服务器地址
- `REMOTE_HEADERS`: 远程服务器请求头（JSON格式）
- `MCP_SERVER_NAME`: 服务器名称（默认: prompt-mcp）
- `MCP_SERVER_VERSION': 服务器版本（默认: 0.1.5）
- `LOG_LEVEL`: 日志级别（error/warn/info/debug，默认: info）
- `MAX_PROMPTS`: 最大prompt数量限制（默认: 100）
- `RECURSIVE_SCAN`: 是否启用递归扫描子目录（true/false，默认: true）

### 配置优先级
1. **命令行参数** (最高优先级)
2. **环境变量**
3. **默认值** (最低优先级)

## 📝 使用方法

### 目录结构
```
prompts/
├── developer/                             # 开发者工具类prompts
│   ├── code-review.yaml                   # 代码审查助手
│   ├── doc-generator.yaml                 # 文档生成器
│   └── error-code-fixer.yaml              # 错误代码修复助手
├── generator/                             # 内容生成类prompts
│   ├── gen_3d_edu_webpage_html.yaml       # 3D教育网页生成器
│   ├── gen_3d_webpage_html.yaml           # 3D网页生成器
│   ├── gen_bento_grid_html.yaml           # Bento网格布局生成器
│   ├── gen_html_web_page.yaml             # HTML网页生成器
│   ├── gen_knowledge_card_html.yaml       # 知识卡片生成器
│   ├── gen_magazine_card_html.yaml        # 杂志卡片生成器
│   ├── gen_mimeng_headline_title.yaml     # 咪蒙风格标题生成器
│   ├── gen_podcast_script.yaml            # 播客脚本生成器
│   ├── gen_prd_prototype_html.yaml        # PRD原型生成器
│   ├── gen_summarize.yaml                 # 内容总结生成器
│   ├── gen_title.yaml                     # 标题生成器
│   └── others/                            # 其他生成工具
│       ├── api_documentation.yaml         # API文档生成器
│       ├── build_mcp_server.yaml          # MCP服务器构建助手
│       ├── code_refactoring.yaml          # 代码重构助手
│       ├── code_review.yaml               # 代码审查助手
│       ├── project_architecture.yaml      # 项目架构设计助手
│       ├── prompt_template_generator.yaml # Prompt模板生成器
│       ├── test_case_generator.yaml       # 测试用例生成器
│       └── writing_assistant.yaml         # 写作助手
└── operation/                             # 运维操作类prompts
    └── relay-server-prompt.yaml           # 中继服务器prompt
```

### Prompt文件格式
```yaml
name: "prompt名称"              # 必需
description: "prompt描述"       # 可选
messages:                      # 可选
  - role: "user"
    content:
      text: "Prompt内容，支持{{参数}}占位符"
arguments:                     # 可选
  - name: "参数名"
    description: "参数描述"
    type: "string"             # string, number, boolean
    required: true
```

## 🎯 使用示例

### 启动服务器
```bash
# 使用默认prompts目录
npx @becrafter/prompt-mcp

# 指定自定义prompts目录
npx @becrafter/prompt-mcp --prompts-dir /path/to/my/prompts

# 使用远程服务器
npx @becrafter/prompt-mcp -r https://api.example.com/prompts

# 调试模式
LOG_LEVEL=debug npx @becrafter/prompt-mcp -p ./prompts
```

### 使用MCP工具
```javascript
// 获取所有prompt列表
const result = await mcpClient.callTool('get_prompt_list', {});

// 根据ID获取特定prompt
const prompt = await mcpClient.callTool('get_prompt', {
  prompt_id: 'a1b2c3d4'
});

// 搜索相关prompts
const searchResult = await mcpClient.callTool('search_prompts', {
  title: 'html'
});

// 重新加载prompts
const reload = await mcpClient.callTool('reload_prompts', {});
```

## 📖 相关文档

- [开发文档](./DEVELOPMENT.md) - 项目结构、开发环境设置、调试指南
- [远程服务API](./REMOTE_SERVICE_API.md) - 远程服务接口规范
- [环境配置示例](./env.example) - 环境变量配置示例

## 📄 许可证

MIT License