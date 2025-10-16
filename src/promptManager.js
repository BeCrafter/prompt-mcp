import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import { z } from 'zod';
import { logger } from './logger.js';
import { config } from './config.js';

/**
 * Prompt数据结构验证schema
 */
const PromptSchema = z.object({
  name: z.string().min(1, 'Prompt名称不能为空'),
  description: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.object({
      text: z.string()
    })
  })).optional(),
  arguments: z.array(z.object({
    name: z.string().min(1, '参数名不能为空'),
    description: z.string().optional(),
    type: z.enum(['string', 'number', 'boolean']).optional().default('string'),
    required: z.boolean().optional().default(true)
  })).optional().default([])
});

/**
 * Prompt管理器类
 */
export class PromptManager {
  constructor(promptsDir) {
    this.promptsDir = promptsDir;
    this.loadedPrompts = new Map();
    this.loadErrors = new Map();
  }

  /**
   * 从远程服务器加载prompts
   */
  async loadRemotePrompts() {
    try {
      logger.info(`开始从远程服务器 ${config.remoteUrl} 加载prompts`);

      const headers = {
        'Content-Type': 'application/json',
        ...(config.remoteHeaders || {})
      };

      const response = await fetch(config.remoteUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`远程服务器返回错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 清空之前的加载结果
      this.loadedPrompts.clear();
      this.loadErrors.clear();

      let successCount = 0;
      let errorCount = 0;

      // 处理远程数据
      for (const promptData of data) {
        try {
          const validatedPrompt = PromptSchema.parse(promptData);
          this.loadedPrompts.set(validatedPrompt.name, validatedPrompt);
          successCount++;
        } catch (error) {
          errorCount++;
          this.loadErrors.set(promptData.name || 'unknown', error.message);
          logger.error(`验证远程prompt失败:`, error.message);
        }
      }

      logger.info(`远程Prompt加载完成: 成功 ${successCount} 个, 失败 ${errorCount} 个`);
      
      return {
        success: successCount,
        errorCount: errorCount,
        prompts: Array.from(this.loadedPrompts.values()),
        loadErrors: Object.fromEntries(this.loadErrors)
      };
    } catch (error) {
      logger.error('加载远程prompts时发生错误:', error);
      throw error;
    }
  }

  /**
   * 加载所有prompts
   */
  async loadPrompts() {
    // 如果配置了远程URL，则从远程加载
    if (config.remoteUrl) {
      return await this.loadRemotePrompts();
    }

    try {
      logger.info(`开始从 ${this.promptsDir} 加载prompts`);
      
      // 确保目录存在
      await fs.ensureDir(this.promptsDir);
      
      // 读取目录中的所有文件
      const files = await fs.readdir(this.promptsDir);
      
      // 过滤出支持的文件类型
      const promptFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.yaml', '.yml', '.json'].includes(ext);
      });

      logger.debug(`找到 ${promptFiles.length} 个prompt文件`);

      // 清空之前的加载结果
      this.loadedPrompts.clear();
      this.loadErrors.clear();

      // 并行加载所有文件
      const loadPromises = promptFiles.map(file => this.loadPromptFile(file));
      const results = await Promise.allSettled(loadPromises);

      // 统计加载结果
      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          const fileName = promptFiles[index];
          this.loadErrors.set(fileName, result.reason.message);
          logger.error(`加载prompt文件 ${fileName} 失败:`, result.reason.message);
        }
      });

      logger.info(`本地Prompt加载完成: 成功 ${successCount} 个, 失败 ${errorCount} 个`);
      
      return {
        success: successCount,
        errorCount: errorCount,
        prompts: Array.from(this.loadedPrompts.values()),
        loadErrors: Object.fromEntries(this.loadErrors)
      };
    } catch (error) {
      logger.error('加载prompts时发生错误:', error);
      throw error;
    }
  }

  /**
   * 加载单个prompt文件
   */
  async loadPromptFile(fileName) {
    const filePath = path.join(this.promptsDir, fileName);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const ext = path.extname(fileName).toLowerCase();
      
      let promptData;
      if (ext === '.json') {
        promptData = JSON.parse(content);
      } else {
        promptData = YAML.parse(content);
      }

      // 验证prompt数据结构
      const validatedPrompt = PromptSchema.parse(promptData);
      
      // 添加文件路径信息
      validatedPrompt.filePath = filePath;
      validatedPrompt.fileName = fileName;
      
      this.loadedPrompts.set(validatedPrompt.name, validatedPrompt);
      logger.debug(`成功加载prompt: ${validatedPrompt.name}`);
      
      return validatedPrompt;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = `数据验证失败: ${error.errors.map(e => e.message).join(', ')}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * 获取所有已加载的prompts
   */
  getPrompts() {
    return Array.from(this.loadedPrompts.values());
  }

  /**
   * 根据名称获取prompt
   */
  getPrompt(name) {
    return this.loadedPrompts.get(name);
  }

  /**
   * 获取prompt名称列表
   */
  getPromptNames() {
    return Array.from(this.loadedPrompts.keys());
  }

  /**
   * 检查prompt是否存在
   */
  hasPrompt(name) {
    return this.loadedPrompts.has(name);
  }

  /**
   * 获取加载错误信息
   */
  getLoadErrors() {
    return Object.fromEntries(this.loadErrors);
  }

  /**
   * 重新加载prompts
   */
  async reloadPrompts() {
    logger.info('重新加载prompts');
    return await this.loadPrompts();
  }
}
