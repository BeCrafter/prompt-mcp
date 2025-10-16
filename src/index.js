import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema,
  ListToolsResultSchema,
  CallToolResultSchema 
} from '@modelcontextprotocol/sdk/types.js';

// 导入自定义模块
import { config } from './config.js';
import { logger } from './logger.js';
import { PromptManager } from './promptManager.js';
import { PromptProcessor, ArgumentValidator } from './promptProcessor.js';

// 全局变量
let promptManager;
let server;

/**
 * 注册工具处理器
 */
function registerToolHandlers() {
  // 注册工具列表处理器
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const prompts = promptManager.getPrompts();
    const tools = prompts.map(prompt => {
      const tool = {
        name: prompt.name,
        description: prompt.description || `Prompt: ${prompt.name}`
      };
      
      // 添加参数schema
      if (prompt.arguments && prompt.arguments.length > 0) {
        const properties = {};
        const required = [];
        
        prompt.arguments.forEach(arg => {
          let schema;
          switch (arg.type) {
            case 'number':
              schema = { type: 'number' };
              break;
            case 'boolean':
              schema = { type: 'boolean' };
              break;
            case 'string':
            default:
              schema = { type: 'string' };
              break;
          }
          
          properties[arg.name] = {
            ...schema,
            description: arg.description || `参数: ${arg.name}`
          };
          
          if (arg.required) {
            required.push(arg.name);
          }
        });
        
        tool.inputSchema = {
          type: 'object',
          properties,
          required
        };
      } else {
        tool.inputSchema = {
          type: 'object',
          properties: {},
          required: []
        };
      }
      
      return tool;
    });
    
    return {
      tools
    };
  });
  
  // 注册工具调用处理器
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      // 查找对应的prompt
      const prompt = promptManager.getPrompt(name);
      if (!prompt) {
        throw new Error(`未找到名为 "${name}" 的prompt`);
      }
      
      // 处理prompt内容
      const promptText = PromptProcessor.processPrompt(prompt, args || {});
      
      return {
        content: [
          {
            type: "text",
            text: promptText
          }
        ]
      };
    } catch (error) {
      logger.error(`执行prompt ${name} 时发生错误:`, error);
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error.message}`
          }
        ],
        isError: true
      };
    }
  });
}


/**
 * 启动MCP服务器
 */
async function startServer() {
  try {
    logger.info('正在启动MCP Prompt Server...');
    
    // 显示当前配置
    config.showConfig();
    
    // 验证配置
    try {
      await config.validate();
      logger.info('配置验证通过');
    } catch (error) {
      logger.error('配置验证失败:', error.message);
      
      // 如果目录不存在，尝试创建
      if (error.message.includes('不存在')) {
        logger.info('尝试创建prompts目录...');
        const dirExists = await config.ensurePromptsDir();
        if (!dirExists) {
          throw new Error('无法创建prompts目录');
        }
        logger.info('Prompts目录创建成功');
      } else {
        throw error;
      }
    }
    
    // 初始化prompt管理器
    promptManager = new PromptManager(config.getPromptsDir());
    
    // 加载所有prompts
    const loadResult = await promptManager.loadPrompts();
    logger.info(`加载完成: 成功 ${loadResult.success} 个, 失败 ${loadResult.errorCount} 个`);
    
    // 创建MCP服务器
    server = new Server(
      {
        name: config.serverName,
        version: config.serverVersion
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    // 注册工具处理器
    registerToolHandlers();
    
    // 创建stdio传输层
    const transport = new StdioServerTransport();
    
    // 连接服务器
    await server.connect(transport);
    logger.info('MCP Prompt Server 启动成功');
    
  } catch (error) {
    logger.error('启动服务器失败:', error);
    throw error;
  }
}

// 启动服务器
startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
