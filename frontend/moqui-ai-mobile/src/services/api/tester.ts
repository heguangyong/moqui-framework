// API连接测试工具
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

export class ApiTester {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  /**
   * 测试基础连接
   */
  async testBasicConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/Login`, {
        method: 'HEAD',
        mode: 'cors'
      })
      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Moqui后端连接正常' : '连接失败'
      }
    } catch (error: any) {
      return {
        success: false,
        status: 0,
        message: `连接错误: ${error.message}`
      }
    }
  }

  /**
   * 测试JWT登录
   */
  async testJwtLogin(username: string, password: string) {
    try {
      const response = await this.api.post('/rest/s1/moqui/auth/login', {
        username,
        password
      })

      if (response.data.success) {
        return {
          success: true,
          data: response.data,
          message: 'JWT认证成功'
        }
      } else {
        return {
          success: false,
          error: response.data.message || '认证失败'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '网络错误'
      }
    }
  }

  /**
   * 测试受保护的API（需要JWT token）
   */
  async testProtectedApi(token: string) {
    try {
      const response = await this.api.get('/rest/s1/moqui/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return {
        success: response.data.valid || false,
        data: response.data,
        message: response.data.valid ? 'Token验证成功' : 'Token无效'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '验证失败'
      }
    }
  }

  /**
   * 测试MCP AI端点
   */
  async testMcpEndpoints(token: string) {
    const results: Record<string, any> = {}

    const endpoints = [
      '/rest/s1/marketplace/stats',  // 修正后的端点
      '/rest/s1/mcp/system/status'
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await this.api.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        results[endpoint] = {
          success: true,
          status: response.status,
          data: response.data
        }
      } catch (error: any) {
        results[endpoint] = {
          success: false,
          status: error.response?.status || 0,
          error: error.response?.data?.message || error.message
        }
      }
    }

    return results
  }
}

export const apiTester = new ApiTester()