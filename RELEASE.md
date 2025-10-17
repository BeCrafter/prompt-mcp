# 版本发布文档

本文档包含 MCP Prompt Server 的版本发布流程、GitHub Actions配置和NPM发布相关信息。

## 🚀 版本发布流程

### 1. 创建版本标签

要发布新版本，只需创建一个新的版本标签并推送到 GitHub：

```bash
# 创建新的版本标签（例如：v0.1.2）
git tag v0.1.2

# 推送标签到远程仓库
git push origin v0.1.2
```

### 2. 自动发布流程

推送标签后，GitHub Actions 会自动执行以下步骤：

1. **检出代码**：从main分支检出最新代码
2. **安装依赖**：使用 `npm ci` 安装依赖
3. **提取版本号**：从标签中提取版本号
4. **更新文件**：
   - 更新 `package.json` 中的版本号
   - 更新 `package-lock.json` 中的版本号
   - 更新 `env.example` 中的版本号
   - 更新 `README.md` 中的版本信息
5. **提交更改**：将版本更新提交到main分支
6. **发布到NPM**：使用NPM_TOKEN发布到npm仓库

## ⚙️ GitHub Actions 配置

### 工作流文件：`.github/workflows/npm-publish.yml`

```yaml
name: NPM Publish

on:
  push:
    tags:
      - 'v*' # 触发条件：推送以 v 开头的标签

permissions:
  contents: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          ref: main
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Extract version from tag
        id: get_version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      
      - name: Update version in files
        run: |
          # 更新 package.json 版本
          npm version ${{ steps.get_version.outputs.VERSION }} --no-git-tag-version
          
          # 更新 package-lock.json 中 @becrafter/prompt-mcp 包的版本
          sed -i "s/\"name\": \"@becrafter\/prompt-mcp\",[[:space:]]*\"version\": \"[^\"]*\"/\"name\": \"@becrafter\/prompt-mcp\",\n      \"version\": \"${{ steps.get_version.outputs.VERSION }}\"/g" package-lock.json
          
          # 更新 env.example 中的版本
          sed -i "s/MCP_SERVER_VERSION=.*/MCP_SERVER_VERSION=${{ steps.get_version.outputs.VERSION }}/" env.example
          
          # 更新 README.md 中的版本信息
          sed -i "s/MCP_SERVER_VERSION.*默认: .*/MCP_SERVER_VERSION': 服务器版本（默认: ${{ steps.get_version.outputs.VERSION }}）/" README.md
      
      - name: Commit version updates
        run: |
          git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          git add package.json package-lock.json env.example README.md
          git commit -m "chore: update version to ${{ steps.get_version.outputs.VERSION }}" || echo "No changes to commit"
          git push origin HEAD:main
      
      - name: Cleanup temporary files
        run: |
          rm -f *.bak *.tmp
      
      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 工作流说明

1. **触发条件**：当推送以 `v` 开头的标签时触发
2. **运行环境**：Ubuntu Latest + Node.js 18.x
3. **权限设置**：需要 `contents: write` 权限来提交版本更新
4. **版本提取**：从标签中提取版本号（如 `v0.1.2` → `0.1.2`）
5. **文件更新**：自动更新相关文件中的版本信息
6. **NPM发布**：使用NPM_TOKEN发布到npm仓库

## 🔧 配置要求

### 1. 启用 GitHub Actions 权限

在使用自动发布功能之前，需要配置以下内容：

1. **启用 GitHub Actions 权限**：
   - 访问仓库的 Settings -> Actions -> General
   - 在 "Workflow permissions" 部分
   - 选择 "Read and write permissions"
   - 点击 "Save" 保存设置

### 2. 配置 NPM 令牌

1. **创建NPM令牌**：
   - 访问 [npmjs.com](https://www.npmjs.com) -> Access Tokens
   - 创建新的令牌（类型选择 Publish）
   - 复制生成的令牌

2. **添加仓库Secrets**：
   - 访问仓库的 Settings -> Secrets and variables -> Actions
   - 点击 "New repository secret"
   - 名称：`NPM_TOKEN`
   - 值：粘贴复制的NPM令牌
   - 点击 "Add secret"

## 📦 NPM 发布配置

### package.json 配置

```json
{
  "name": "@becrafter/prompt-mcp",
  "version": "0.1.1",
  "description": "MCP Server for managing and executing prompts",
  "publishConfig": {
    "access": "public"
  },
  "main": "src/index.js",
  "bin": {
    "prompt-mcp": "bin/prompt-mcp"
  },
  "files": [
    "src/",
    "prompts/",
    "bin/",
    "package.json",
    "README.md",
    "env.example"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 发布文件配置

通过 `files` 字段控制发布到NPM的文件：

- `src/`: 源代码目录
- `prompts/`: Prompt文件目录
- `bin/`: CLI可执行文件
- `package.json`: 包配置文件
- `README.md`: 主文档
- `env.example`: 环境变量示例

## 🏷️ 版本管理策略

### 语义化版本控制

遵循 [Semantic Versioning](https://semver.org/) 规范：

- **主版本号**：不兼容的API修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 版本标签格式

- 标签格式：`v{major}.{minor}.{patch}`
- 示例：`v0.1.2`、`v1.0.0`、`v2.1.3`

### 发布检查清单

发布新版本前，请检查：

- [ ] 更新 `CHANGELOG.md`（如果存在）
- [ ] 更新 `README.md` 中的版本信息
- [ ] 更新 `env.example` 中的版本信息
- [ ] 运行测试确保所有功能正常
- [ ] 检查依赖版本是否需要更新
- [ ] 确认NPM_TOKEN配置正确

## 🔄 回滚策略

### 如果发布出现问题

1. **NPM版本回滚**：
   ```bash
   # 撤销NPM发布（24小时内）
   npm unpublish @becrafter/prompt-mcp@版本号
   ```

2. **Git标签删除**：
   ```bash
   # 删除本地标签
   git tag -d v版本号
   
   # 删除远程标签
   git push origin :refs/tags/v版本号
   ```

3. **代码回滚**：
   ```bash
   # 回滚到上一个版本
   git reset --hard HEAD~1
   git push origin main --force
   ```

## 📊 发布监控

### 发布状态检查

1. **GitHub Actions**：
   - 查看 Actions 页面确认工作流执行状态
   - 检查是否有错误或警告

2. **NPM包页面**：
   - 访问 [npmjs.com/package/@becrafter/prompt-mcp](https://www.npmjs.com/package/@becrafter/prompt-mcp)
   - 确认新版本已发布
   - 检查下载统计

3. **功能验证**：
   ```bash
   # 安装最新版本测试
   npm install @becrafter/prompt-mcp@latest
   
   # 测试功能
   npx @becrafter/prompt-mcp --version
   ```

## 🚨 故障排除

### 常见问题

1. **NPM_TOKEN权限不足**：
   - 检查令牌是否有发布权限
   - 确认令牌未过期

2. **版本号冲突**：
   - 检查NPM上是否已存在相同版本
   - 使用新的版本号

3. **文件更新失败**：
   - 检查Git权限配置
   - 确认文件路径正确

4. **依赖安装失败**：
   - 检查 `package-lock.json` 是否最新
   - 运行 `npm ci` 重新安装依赖

### 调试技巧

1. **查看工作流日志**：
   - 在GitHub Actions页面查看详细日志
   - 检查每个步骤的执行结果

2. **本地测试**：
   ```bash
   # 本地测试版本更新
   npm version patch --no-git-tag-version
   
   # 测试发布（dry-run）
   npm publish --dry-run
   ```

3. **检查配置**：
   ```bash
   # 检查NPM配置
   npm config list
   
   # 检查登录状态
   npm whoami
   ```
