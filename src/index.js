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
 * 定义四个固定的MCP工具
 */
const MCP_TOOLS = [
  {
    name: "get_prompt_list",
    description: "获取所有可用的prompt列表，包括标题和描述。用于在获取特定prompt之前发现可用的prompts。",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_prompt", 
    description: "根据ID获取特定prompt的完整内容，包括所有消息、参数和元数据。",
    inputSchema: {
      type: "object",
      properties: {
        prompt_id: {
          type: "string",
          description: "要获取的prompt的唯一名称"
        }
      },
      required: ["prompt_id"]
    }
  },
  {
    name: "search_prompts",
    description: "搜索符合要求的prompts",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "搜索关键词，将在prompt的name和description中进行内容匹配"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "reload_prompts",
    description: "重新加载所有预设的prompts",
    inputSchema: {
      type: "object", 
      properties: {},
      required: []
    }
  }
];

/**
 * 注册工具处理器
 */
function registerToolHandlers() {
  // 注册工具列表处理器
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOLS
    };
  });
  
  // 注册工具调用处理器
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case "get_prompt_list":
          return await handleGetPromptList();
          
        case "get_prompt":
          return await handleGetPrompt(args);
          
        case "search_prompts":
          return await handleSearchPrompts(args);
          
        case "reload_prompts":
          return await handleReloadPrompts();
          
        default:
          throw new Error(`未知的工具: ${name}`);
      }
    } catch (error) {
      logger.error(`执行工具 ${name} 时发生错误:`, error);
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
 * 处理get_prompt_list工具调用
 */
async function handleGetPromptList() {
  const prompts = promptManager.getPrompts();
  
  const promptList = prompts.map(prompt => ({
    id: prompt.uniqueId,  // 使用基于文件路径的唯一ID
    name: prompt.name,     // 保留原始名称
    title: prompt.name,
    description: prompt.description || `Prompt: ${prompt.name}`,
    arguments: prompt.arguments || [],
    hasArguments: prompt.arguments && prompt.arguments.length > 0,
    filePath: prompt.relativePath,  // 添加文件路径信息
    metadata: {
      fileName: prompt.fileName,
      fullPath: prompt.filePath
    }
  }));
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          count: promptList.length,
          prompts: promptList,
          idPathMappings: promptManager.getIdPathMappings()  // 添加ID到路径的映射
        }, null, 2)
      }
    ]
  };
}

/**
 * 处理get_prompt工具调用
 */
async function handleGetPrompt(args) {
  const { prompt_id } = args;
  
  if (!prompt_id) {
    throw new Error("缺少必需参数: prompt_id");
  }
  
  const prompt = promptManager.getPrompt(prompt_id);
  if (!prompt) {
    throw new Error(`未找到ID为 "${prompt_id}" 的prompt`);
  }
  
  // 返回完整的prompt信息
  const promptInfo = {
    id: prompt.uniqueId,        // 使用基于文件路径的唯一ID
    name: prompt.name,          // 保留原始名称
    title: prompt.name,
    description: prompt.description || `Prompt: ${prompt.name}`,
    messages: prompt.messages || [],
    arguments: prompt.arguments || [],
    filePath: prompt.relativePath,  // 添加文件路径信息
    metadata: {
      fileName: prompt.fileName,
      fullPath: prompt.filePath,
      uniqueId: prompt.uniqueId
    }
  };
  
  return {
    content: [
      {
        type: "text", 
        text: JSON.stringify({
          success: true,
          prompt: promptInfo
        }, null, 2)
      }
    ]
  };
}

/**
 * 处理search_prompts工具调用
 */
async function handleSearchPrompts(args) {
  const { title } = args;
  
  if (!title) {
    throw new Error("缺少必需参数: title");
  }
  
  const allPrompts = promptManager.getPrompts();
  
  // 实现相似度匹配算法
  const searchResults = allPrompts.map(prompt => {
    const score = calculateSimilarityScore(title, prompt);
    return {
      prompt: {
        id: prompt.uniqueId,
        name: prompt.name,
        title: prompt.name,
        description: prompt.description || `Prompt: ${prompt.name}`,
        arguments: prompt.arguments || [],
        hasArguments: prompt.arguments && prompt.arguments.length > 0,
        filePath: prompt.relativePath,
        metadata: {
          fileName: prompt.fileName,
          fullPath: prompt.filePath
        }
      },
      score: score
    };
  })
  .filter(result => result.score > 0) // 只返回有匹配的结果
  .sort((a, b) => b.score - a.score); // 按相似度得分降序排列
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          query: title,
          count: searchResults.length,
          results: searchResults.map(result => result.prompt), // 只返回prompt信息，不包含score
          debug: {
            scores: searchResults.map(result => ({
              id: result.prompt.id,
              name: result.prompt.name,
              score: result.score
            }))
          }
        }, null, 2)
      }
    ]
  };
}

/**
 * 计算搜索关键词与prompt的相似度得分
 * @param {string} searchTerm - 搜索关键词
 * @param {Object} prompt - prompt对象
 * @returns {number} 相似度得分 (0-100)
 */
function calculateSimilarityScore(searchTerm, prompt) {
  const searchLower = searchTerm.toLowerCase();
  let totalScore = 0;
  
  // 搜索字段权重配置（专注于内容搜索，不包含ID检索）
  const fieldWeights = {
    name: 60,         // 名称权重高，是主要匹配字段
    description: 40   // 描述权重适中，是辅助匹配字段
  };
  
  // 计算name匹配得分
  if (prompt.name) {
    const nameScore = getStringMatchScore(searchLower, prompt.name.toLowerCase());
    totalScore += nameScore * fieldWeights.name;
  }
  
  // 计算description匹配得分
  if (prompt.description) {
    const descScore = getStringMatchScore(searchLower, prompt.description.toLowerCase());
    totalScore += descScore * fieldWeights.description;
  }
  
  // 标准化得分到0-100范围
  const maxPossibleScore = Object.values(fieldWeights).reduce((sum, weight) => sum + weight, 0);
  return Math.round((totalScore / maxPossibleScore) * 100);
}

/**
 * 计算两个字符串的匹配得分
 * @param {string} search - 搜索词 (已转小写)
 * @param {string} target - 目标字符串 (已转小写)
 * @returns {number} 匹配得分 (0-1)
 */
function getStringMatchScore(search, target) {
  if (!search || !target) return 0;
  
  // 完全匹配得分最高
  if (target === search) return 1.0;
  
  // 完全包含得分较高
  if (target.includes(search)) return 0.8;
  
  // 部分词匹配
  const searchWords = search.split(/\s+/).filter(word => word.length > 0);
  const targetWords = target.split(/\s+/).filter(word => word.length > 0);
  
  let matchedWords = 0;
  for (const searchWord of searchWords) {
    for (const targetWord of targetWords) {
      if (targetWord.includes(searchWord) || searchWord.includes(targetWord)) {
        matchedWords++;
        break;
      }
    }
  }
  
  if (searchWords.length > 0) {
    const wordMatchRatio = matchedWords / searchWords.length;
    return wordMatchRatio * 0.6; // 部分词匹配得分
  }
  
  return 0;
}

/**
 * 处理reload_prompts工具调用
 */
async function handleReloadPrompts() {
  logger.info('重新加载prompts...');
  
  const result = await promptManager.reloadPrompts();
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          message: `重新加载完成: 成功 ${result.success} 个, 失败 ${result.errorCount} 个`,
          result: result
        }, null, 2)
      }
    ]
  };
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
