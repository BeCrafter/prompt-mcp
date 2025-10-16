import { z } from 'zod';
import { logger } from './logger.js';

/**
 * 参数验证工具类
 */
export class ArgumentValidator {
  /**
   * 根据prompt定义创建参数验证schema
   */
  static createSchema(prompt) {
    const schemaObj = {};
    
    if (prompt.arguments && Array.isArray(prompt.arguments)) {
      prompt.arguments.forEach(arg => {
        let schema;
        
        switch (arg.type) {
          case 'number':
            schema = z.number();
            break;
          case 'boolean':
            schema = z.boolean();
            break;
          case 'string':
          default:
            schema = z.string();
            break;
        }
        
        // 如果参数不是必需的，则设为可选
        if (!arg.required) {
          schema = schema.optional();
        }
        
        schemaObj[arg.name] = schema.describe(arg.description || `参数: ${arg.name}`);
      });
    }
    
    return z.object(schemaObj);
  }

  /**
   * 验证参数
   */
  static validateArguments(prompt, args) {
    try {
      const schema = this.createSchema(prompt);
      return schema.parse(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => 
          `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        throw new Error(`参数验证失败: ${errorMessages}`);
      }
      throw error;
    }
  }
}

/**
 * Prompt处理器类
 */
export class PromptProcessor {
  /**
   * 处理prompt内容，替换参数占位符
   */
  static processPrompt(prompt, args) {
    try {
      // 验证参数
      const validatedArgs = ArgumentValidator.validateArguments(prompt, args);
      
      let promptText = '';
      
      if (prompt.messages && Array.isArray(prompt.messages)) {
        // 只处理用户消息
        const userMessages = prompt.messages.filter(msg => msg.role === 'user');
        
        for (const message of userMessages) {
          if (message.content && typeof message.content.text === 'string') {
            let text = message.content.text;
            
            // 替换所有 {{arg}} 格式的参数
            for (const [key, value] of Object.entries(validatedArgs)) {
              const placeholder = new RegExp(`{{${key}}}`, 'g');
              text = text.replace(placeholder, String(value));
            }
            
            promptText += text + '\n\n';
          }
        }
      }
      
      return promptText.trim();
    } catch (error) {
      logger.error(`处理prompt ${prompt.name} 时发生错误:`, error);
      throw error;
    }
  }

  /**
   * 检查prompt是否包含必需的参数
   */
  static checkRequiredArguments(prompt, args) {
    if (!prompt.arguments) return true;
    
    const missingArgs = prompt.arguments
      .filter(arg => arg.required && !(arg.name in args))
      .map(arg => arg.name);
    
    if (missingArgs.length > 0) {
      throw new Error(`缺少必需参数: ${missingArgs.join(', ')}`);
    }
    
    return true;
  }
}
