/**
 * File Access Control
 * 文件访问控制 - 限制文件系统访问范围，防止未授权访问
 * 
 * Requirements: 12.3
 */

const path = require('path');
const os = require('os');
const fs = require('fs').promises;

/**
 * 文件访问控制类
 */
class FileAccessControl {
  constructor() {
    // 定义允许访问的路径
    this.allowedPaths = [
      path.join(os.homedir(), 'NovelAnimeProjects'),  // 项目目录
      path.join(os.homedir(), 'Documents'),            // 文档目录
      path.join(os.homedir(), 'Downloads'),            // 下载目录
      path.join(os.homedir(), 'Desktop')               // 桌面目录
    ];

    // 禁止访问的路径模式
    this.forbiddenPatterns = [
      /^\/etc\//,                    // Linux系统配置
      /^\/sys\//,                    // Linux系统文件
      /^\/proc\//,                   // Linux进程信息
      /^C:\\Windows\\/i,             // Windows系统目录
      /^C:\\Program Files/i,         // Windows程序目录
      /^\/System\//,                 // macOS系统目录
      /^\/Library\/System/,          // macOS系统库
      /\.ssh/,                       // SSH密钥
      /\.aws/,                       // AWS凭证
      /\.env$/,                      // 环境变量文件
      /password/i,                   // 密码文件
      /credential/i                  // 凭证文件
    ];

    // 访问日志
    this.accessLog = [];
    this.maxLogSize = 1000;
  }

  /**
   * 验证路径是否允许访问
   * 
   * @param {string} filePath - 要验证的文件路径
   * @returns {boolean} 是否允许访问
   */
  validatePath(filePath) {
    try {
      // 规范化路径
      const normalizedPath = path.normalize(filePath);
      const resolvedPath = path.resolve(normalizedPath);

      // 检查是否在禁止访问的路径中
      for (const pattern of this.forbiddenPatterns) {
        if (pattern.test(resolvedPath)) {
          this.logAccess(resolvedPath, 'DENIED', 'Forbidden pattern matched');
          return false;
        }
      }

      // 检查是否在允许的路径中
      for (const allowedPath of this.allowedPaths) {
        if (resolvedPath.startsWith(allowedPath)) {
          this.logAccess(resolvedPath, 'ALLOWED', 'Within allowed path');
          return true;
        }
      }

      // 默认拒绝
      this.logAccess(resolvedPath, 'DENIED', 'Not in allowed paths');
      return false;
    } catch (error) {
      this.logAccess(filePath, 'ERROR', error.message);
      return false;
    }
  }

  /**
   * 安全的文件读取
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 文件内容
   */
  async safeReadFile(filePath) {
    if (!this.validatePath(filePath)) {
      throw new Error(`Access denied: ${filePath}`);
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      this.logAccess(filePath, 'READ', 'Success');
      return content;
    } catch (error) {
      this.logAccess(filePath, 'READ_ERROR', error.message);
      throw error;
    }
  }

  /**
   * 安全的文件写入
   * 
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   */
  async safeWriteFile(filePath, content) {
    if (!this.validatePath(filePath)) {
      throw new Error(`Access denied: ${filePath}`);
    }

    // 检查文件大小限制 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (Buffer.byteLength(content, 'utf8') > maxSize) {
      throw new Error('File size exceeds limit (100MB)');
    }

    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, content, 'utf8');
      this.logAccess(filePath, 'WRITE', 'Success');
    } catch (error) {
      this.logAccess(filePath, 'WRITE_ERROR', error.message);
      throw error;
    }
  }

  /**
   * 安全的文件删除
   * 
   * @param {string} filePath - 文件路径
   */
  async safeDeleteFile(filePath) {
    if (!this.validatePath(filePath)) {
      throw new Error(`Access denied: ${filePath}`);
    }

    try {
      await fs.unlink(filePath);
      this.logAccess(filePath, 'DELETE', 'Success');
    } catch (error) {
      this.logAccess(filePath, 'DELETE_ERROR', error.message);
      throw error;
    }
  }

  /**
   * 安全的目录读取
   * 
   * @param {string} dirPath - 目录路径
   * @returns {Promise<string[]>} 文件列表
   */
  async safeReadDir(dirPath) {
    if (!this.validatePath(dirPath)) {
      throw new Error(`Access denied: ${dirPath}`);
    }

    try {
      const files = await fs.readdir(dirPath);
      this.logAccess(dirPath, 'READDIR', 'Success');
      return files;
    } catch (error) {
      this.logAccess(dirPath, 'READDIR_ERROR', error.message);
      throw error;
    }
  }

  /**
   * 安全的目录创建
   * 
   * @param {string} dirPath - 目录路径
   */
  async safeCreateDir(dirPath) {
    if (!this.validatePath(dirPath)) {
      throw new Error(`Access denied: ${dirPath}`);
    }

    try {
      await fs.mkdir(dirPath, { recursive: true });
      this.logAccess(dirPath, 'MKDIR', 'Success');
    } catch (error) {
      this.logAccess(dirPath, 'MKDIR_ERROR', error.message);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否存在
   */
  async safeExists(filePath) {
    if (!this.validatePath(filePath)) {
      return false;
    }

    try {
      await fs.access(filePath);
      this.logAccess(filePath, 'EXISTS', 'True');
      return true;
    } catch {
      this.logAccess(filePath, 'EXISTS', 'False');
      return false;
    }
  }

  /**
   * 记录访问日志
   * 
   * @param {string} path - 访问路径
   * @param {string} action - 操作类型
   * @param {string} result - 操作结果
   */
  logAccess(path, action, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      path,
      action,
      result
    };

    this.accessLog.push(logEntry);

    // 限制日志大小
    if (this.accessLog.length > this.maxLogSize) {
      this.accessLog.shift();
    }

    // 记录到控制台（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FileAccess] ${action}: ${path} - ${result}`);
    }
  }

  /**
   * 获取访问日志
   * 
   * @param {number} limit - 返回的日志数量
   * @returns {Array} 访问日志
   */
  getAccessLog(limit = 100) {
    return this.accessLog.slice(-limit);
  }

  /**
   * 清除访问日志
   */
  clearAccessLog() {
    this.accessLog = [];
  }

  /**
   * 添加允许的路径
   * 
   * @param {string} allowedPath - 允许访问的路径
   */
  addAllowedPath(allowedPath) {
    const normalizedPath = path.normalize(allowedPath);
    if (!this.allowedPaths.includes(normalizedPath)) {
      this.allowedPaths.push(normalizedPath);
      console.log(`✅ Added allowed path: ${normalizedPath}`);
    }
  }

  /**
   * 移除允许的路径
   * 
   * @param {string} allowedPath - 要移除的路径
   */
  removeAllowedPath(allowedPath) {
    const normalizedPath = path.normalize(allowedPath);
    const index = this.allowedPaths.indexOf(normalizedPath);
    if (index > -1) {
      this.allowedPaths.splice(index, 1);
      console.log(`✅ Removed allowed path: ${normalizedPath}`);
    }
  }

  /**
   * 获取允许的路径列表
   * 
   * @returns {string[]} 允许的路径
   */
  getAllowedPaths() {
    return [...this.allowedPaths];
  }

  /**
   * 获取统计信息
   * 
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const stats = {
      totalAccesses: this.accessLog.length,
      allowed: 0,
      denied: 0,
      errors: 0,
      byAction: {}
    };

    this.accessLog.forEach(entry => {
      if (entry.action === 'ALLOWED') {
        stats.allowed++;
      } else if (entry.action === 'DENIED') {
        stats.denied++;
      } else if (entry.action.includes('ERROR')) {
        stats.errors++;
      }

      stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
    });

    return stats;
  }
}

// 导出单例实例
const fileAccessControl = new FileAccessControl();

module.exports = {
  FileAccessControl,
  fileAccessControl
};
