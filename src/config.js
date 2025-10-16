import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 解析命令行参数
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--prompts-dir' || arg === '-p') {
      options.promptsDir = args[i + 1];
      i++; // 跳过下一个参数
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg.startsWith('--')) {
      // 处理 --key=value 格式
      const [key, value] = arg.slice(2).split('=');
      options[key] = value;
    }
  }
  
  return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
MCP Prompt Server - 智能 Prompt 管理服务器

用法:
  node src/index.js [选项]

选项:
  -p, --prompts-dir <目录>    指定 prompts 文件所在目录
  -h, --help                 显示此帮助信息
  -v, --version              显示版本信息

环境变量:
  MCP_SERVER_NAME            服务器名称 (默认: prompt-mcp-server)
  MCP_SERVER_VERSION         服务器版本 (默认: 1.0.0)
  LOG_LEVEL                  日志级别 (默认: info)
  MAX_PROMPTS                最大prompt数量限制 (默认: 100)

示例:
  node src/index.js --prompts-dir /path/to/prompts
  node src/index.js -p ./my-prompts
  LOG_LEVEL=debug node src/index.js -p /custom/prompts
`);
}

/**
 * 配置管理类
 */
export class Config {
  constructor() {
    const cliArgs = parseCommandLineArgs();
    
    // 处理帮助和版本信息
    if (cliArgs.help) {
      showHelp();
      process.exit(0);
    }
    
    if (cliArgs.version) {
      console.log('1.0.0');
      process.exit(0);
    }
    
    // 确定prompts目录
    this.promptsDir = cliArgs.promptsDir || 
                     process.env.PROMPTS_DIR || 
                     path.join(__dirname, 'prompts');
    
    // 其他配置
    this.serverName = process.env.MCP_SERVER_NAME || 'prompt-mcp-server';
    this.serverVersion = process.env.MCP_SERVER_VERSION || '1.0.0';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.maxPrompts = parseInt(process.env.MAX_PROMPTS) || 100;
    
    // 存储CLI参数
    this.cliArgs = cliArgs;
  }

  /**
   * 确保prompts目录存在
   */
  async ensurePromptsDir() {
    try {
      await fs.ensureDir(this.promptsDir);
      return true;
    } catch (error) {
      console.error('Failed to create prompts directory:', error);
      return false;
    }
  }

  /**
   * 获取prompts目录路径
   */
  getPromptsDir() {
    return this.promptsDir;
  }

  /**
   * 验证配置
   */
  async validate() {
    try {
      // 检查prompts目录是否存在
      const exists = await fs.pathExists(this.promptsDir);
      if (!exists) {
        throw new Error(`Prompts目录不存在: ${this.promptsDir}`);
      }
      
      // 检查目录是否可读
      await fs.access(this.promptsDir, fs.constants.R_OK);
      
      return true;
    } catch (error) {
      throw new Error(`配置验证失败: ${error.message}`);
    }
  }

  /**
   * 显示当前配置
   */
  showConfig() {
    console.log('当前配置:');
    console.log(`  Prompts目录: ${this.promptsDir}`);
    console.log(`  服务器名称: ${this.serverName}`);
    console.log(`  服务器版本: ${this.serverVersion}`);
    console.log(`  日志级别: ${this.logLevel}`);
    console.log(`  最大Prompts: ${this.maxPrompts}`);
  }
}

export const config = new Config();
