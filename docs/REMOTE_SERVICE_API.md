# 远程提示词服务接口规范

## 📋 概述

本文档定义了与prompt-mcp服务兼容的远程提示词服务接口规范。远程服务需要支持固定长度唯一ID机制，确保与本地服务的一致性。

## 🔗 接口规范

### 1. 获取Prompt列表接口

**请求方式**: `GET {REMOTE_URL}`

**请求头**:
```http
Content-Type: application/json
Authorization: Bearer token  # 可选，通过REMOTE_HEADERS配置
```

**响应格式**:
```json
[
  {
    "name": "prompt-name",
    "description": "Prompt描述",
    "messages": [
      {
        "role": "user",
        "content": {
          "text": "Prompt内容，支持{{参数}}占位符"
        }
      }
    ],
    "arguments": [
      {
        "name": "参数名",
        "description": "参数描述",
        "type": "string|number|boolean",
        "required": true
      }
    ],
    "uniqueId": "a1b2c3d4"
  }
]
```

### 2. 处理Prompt接口

**请求方式**: `POST {REMOTE_URL}/process`

**请求头**:
```http
Content-Type: application/json
Authorization: Bearer token  # 可选，通过REMOTE_HEADERS配置
```

**请求体**:
```json
{
  "promptName": "prompt-name",
  "arguments": {
    "参数名": "参数值"
  }
}
```

**响应格式**:
```json
{
  "processedText": "处理后的prompt文本"
}
```

## 🔑 固定长度唯一ID机制

### ID生成规则

远程服务中的prompt会自动生成固定长度的唯一ID：

1. **虚拟路径**: 使用`{prompt.name}.yaml`作为虚拟路径
2. **哈希计算**: 使用SHA-256算法对虚拟路径进行哈希计算
3. **长度截取**: 取哈希值的前8位作为唯一ID
4. **固定长度**: 所有ID长度保持一致（8位十六进制字符）

### ID生成示例

```
Prompt名称                -> 虚拟路径           -> 固定长度ID (8位)
code-review             -> code-review.yaml   -> a1b2c3d4
api-documentation       -> api-documentation.yaml -> e5f6g7h8
user-authentication    -> user-authentication.yaml -> i9j0k1l2
```

### 元数据字段

远程服务**推荐**提供`uniqueId`字段，以确保与本地服务完全兼容：

```json
{
  "name": "prompt-name",
  "uniqueId": "a1b2c3d4"  // 固定长度唯一ID（推荐提供）
}
```

**兼容性说明**:
- ✅ **提供uniqueId**: 如果远程服务提供了uniqueId字段，将直接使用，确保ID的唯一性
- 🔄 **兼容模式**: 如果远程服务未提供uniqueId字段，将使用兼容模式自动生成
- 📦 **减少负担**: 远程服务只需要提供uniqueId，其他元数据字段（filePath、fileName、relativePath）是可选的

## 🚀 服务端实现示例

### Node.js + Express 示例

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// 生成固定长度唯一ID的函数
function generateUniqueId(relativePath) {
  const hash = crypto.createHash('sha256');
  hash.update(relativePath);
  const hashHex = hash.digest('hex');
  return hashHex.substring(0, 8);
}

// 获取prompt列表
app.get('/prompts', async (req, res) => {
  try {
    const prompts = await getPromptsFromDatabase();
    
    // 为每个prompt添加uniqueId
    const promptsWithUniqueId = prompts.map(prompt => ({
      ...prompt,
      uniqueId: generateUniqueId(`${prompt.name}.yaml`)
    }));
    
    res.json(promptsWithUniqueId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 处理prompt
app.post('/process', async (req, res) => {
  try {
    const { promptName, arguments } = req.body;
    
    // 验证prompt是否存在
    const prompt = await getPromptByName(promptName);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    // 处理prompt内容
    const processedText = await processPromptContent(prompt, arguments);
    
    res.json({ processedText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 处理prompt内容的函数
async function processPromptContent(prompt, args) {
  let content = '';
  
  if (prompt.messages && Array.isArray(prompt.messages)) {
    const userMessages = prompt.messages.filter(msg => msg.role === 'user');
    
    for (const message of userMessages) {
      if (message.content && typeof message.content.text === 'string') {
        let text = message.content.text;
        
        // 替换参数占位符
        for (const [key, value] of Object.entries(args)) {
          const placeholder = new RegExp(`{{${key}}}`, 'g');
          text = text.replace(placeholder, String(value));
        }
        
        content += text + '\n\n';
      }
    }
  }
  
  return content.trim();
}

app.listen(3000, () => {
  console.log('远程Prompt服务启动在端口3000');
});
```

### Python + Flask 示例

```python
from flask import Flask, request, jsonify
import re
import hashlib

app = Flask(__name__)

# 生成固定长度唯一ID的函数
def generate_unique_id(relative_path):
    hash_obj = hashlib.sha256(relative_path.encode())
    return hash_obj.hexdigest()[:8]

# 模拟prompt数据
prompts_data = [
    {
        "name": "code-review",
        "description": "代码审查助手",
        "messages": [
            {
                "role": "user",
                "content": {
                    "text": "请审查以下{{language}}代码：\n```\n{{code}}\n```"
                }
            }
        ],
        "arguments": [
            {
                "name": "language",
                "description": "编程语言",
                "type": "string",
                "required": True
            },
            {
                "name": "code",
                "description": "代码内容",
                "type": "string",
                "required": True
            }
        ]
    }
]

@app.route('/prompts', methods=['GET'])
def get_prompts():
    # 为每个prompt添加uniqueId
    prompts_with_unique_id = []
    for prompt in prompts_data:
        relative_path = f"{prompt['name']}.yaml"
        prompt_with_unique_id = {
            **prompt,
            "uniqueId": generate_unique_id(relative_path)
        }
        prompts_with_unique_id.append(prompt_with_unique_id)
    
    return jsonify(prompts_with_unique_id)

@app.route('/process', methods=['POST'])
def process_prompt():
    data = request.json
    prompt_name = data.get('promptName')
    arguments = data.get('arguments', {})
    
    # 查找prompt
    prompt = next((p for p in prompts_data if p['name'] == prompt_name), None)
    if not prompt:
        return jsonify({'error': 'Prompt not found'}), 404
    
    # 处理prompt内容
    processed_text = process_prompt_content(prompt, arguments)
    
    return jsonify({'processedText': processed_text})

def process_prompt_content(prompt, args):
    content = ''
    
    if 'messages' in prompt:
        user_messages = [msg for msg in prompt['messages'] if msg['role'] == 'user']
        
        for message in user_messages:
            if 'content' in message and 'text' in message['content']:
                text = message['content']['text']
                
                # 替换参数占位符
                for key, value in args.items():
                    text = re.sub(rf'{{{{{key}}}}}', str(value), text)
                
                content += text + '\n\n'
    
    return content.strip()

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

## 🔧 配置和使用

### 客户端配置

```bash
# 设置远程服务器地址
export REMOTE_URL="https://your-prompt-server.com"

# 设置请求头
export REMOTE_HEADERS='{"Authorization":"Bearer your-token"}'

# 启动服务
node src/index.js
```

### MCP工具使用

```bash
# 获取prompt列表（从远程服务器）
get_prompt_list

# 获取特定prompt（使用固定长度ID）
get_prompt({"prompt_id": "a1b2c3d4"})

# 重新加载prompts（从远程服务器）
reload_prompts
```

## ⚠️ 注意事项

1. **数据格式**: 远程服务返回的数据必须符合PromptSchema验证要求
2. **ID一致性**: 远程prompt会自动生成固定长度唯一ID
3. **认证支持**: 支持通过REMOTE_HEADERS配置认证信息
4. **错误处理**: 远程服务错误会被记录到日志中
5. **向后兼容**: 支持通过原始名称查找prompt

## 🐛 错误处理

### HTTP状态码

- `200`: 成功
- `400`: 请求参数错误
- `401`: 认证失败
- `404`: 资源不存在
- `500`: 服务器内部错误

### 错误响应格式

```json
{
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

通过这个规范，远程服务可以完全兼容prompt-mcp的固定长度唯一ID机制，确保本地和远程服务的一致性。
