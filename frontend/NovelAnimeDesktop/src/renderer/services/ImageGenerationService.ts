/**
 * Image Generation Service
 * 支持多种AI图片生成后端
 */

export interface ImageGenerationConfig {
  provider: 'stable-diffusion' | 'dalle' | 'pollinations' | 'placeholder';
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  size?: string;
  quality?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

export interface ImageGenerationResult {
  imageUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  provider: string;
  generatedAt: Date;
}

class ImageGenerationService {
  private config: ImageGenerationConfig;
  private cache: Map<string, ImageGenerationResult>;

  constructor() {
    // 从 localStorage 加载配置
    this.config = this.loadConfig();
    this.cache = new Map();
  }

  /**
   * 加载配置
   */
  private loadConfig(): ImageGenerationConfig {
    const savedConfig = localStorage.getItem('image_generation_config');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.warn('Failed to parse image generation config:', e);
      }
    }

    // 默认配置：使用 Pollinations AI（免费、无需 API 密钥）
    return {
      provider: 'pollinations',
      size: '800x450'
    };
  }

  /**
   * 保存配置
   */
  saveConfig(config: Partial<ImageGenerationConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('image_generation_config', JSON.stringify(this.config));
    console.log('✅ Image generation config saved:', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): ImageGenerationConfig {
    return { ...this.config };
  }

  /**
   * 生成图片
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const cacheKey = this.getCacheKey(request);
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      console.log('📦 Using cached image for:', request.prompt.substring(0, 50));
      return this.cache.get(cacheKey)!;
    }

    console.log(`🎨 Generating image with ${this.config.provider}:`, request.prompt.substring(0, 50));

    let result: ImageGenerationResult;

    try {
      switch (this.config.provider) {
        case 'stable-diffusion':
          result = await this.generateWithStableDiffusion(request);
          break;
        case 'dalle':
          result = await this.generateWithDALLE(request);
          break;
        case 'pollinations':
          result = await this.generateWithPollinations(request);
          break;
        case 'placeholder':
        default:
          result = await this.generatePlaceholder(request);
          break;
      }

      // 缓存结果
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Image generation failed:', error);
      
      // 降级到占位符
      console.log('⚠️ Falling back to placeholder image');
      result = await this.generatePlaceholder(request);
      return result;
    }
  }

  /**
   * 批量生成图片
   */
  async generateBatch(requests: ImageGenerationRequest[]): Promise<ImageGenerationResult[]> {
    console.log(`🎨 Batch generating ${requests.length} images...`);
    
    const results: ImageGenerationResult[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      try {
        const result = await this.generateImage(requests[i]);
        results.push(result);
        console.log(`✅ Generated ${i + 1}/${requests.length}`);
      } catch (error) {
        console.error(`❌ Failed to generate image ${i + 1}:`, error);
        // 使用占位符
        results.push(await this.generatePlaceholder(requests[i]));
      }
    }
    
    return results;
  }

  /**
   * 使用 Stable Diffusion 生成图片
   */
  private async generateWithStableDiffusion(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const apiUrl = this.config.apiUrl || 'http://localhost:7860';
    
    const payload = {
      prompt: this.enhancePrompt(request.prompt),
      negative_prompt: request.negativePrompt || 'blurry, low quality, distorted, ugly',
      width: request.width || 800,
      height: request.height || 450,
      steps: request.steps || 20,
      seed: request.seed || -1,
      sampler_name: 'DPM++ 2M Karras',
      cfg_scale: 7,
      batch_size: 1
    };

    console.log('📡 Calling Stable Diffusion API:', apiUrl);

    const response = await fetch(`${apiUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Stable Diffusion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.images || data.images.length === 0) {
      throw new Error('No images returned from Stable Diffusion');
    }

    // 将 base64 图片转换为 data URL
    const imageUrl = `data:image/png;base64,${data.images[0]}`;

    return {
      imageUrl,
      thumbnailUrl: imageUrl, // 可以生成缩略图
      prompt: request.prompt,
      provider: 'stable-diffusion',
      generatedAt: new Date()
    };
  }

  /**
   * 使用 DALL-E 生成图片
   */
  private async generateWithDALLE(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.config.apiKey) {
      throw new Error('DALL-E API key not configured');
    }

    const apiUrl = 'https://api.openai.com/v1/images/generations';
    
    const payload = {
      model: this.config.model || 'dall-e-3',
      prompt: this.enhancePrompt(request.prompt),
      n: 1,
      size: this.config.size || '1024x1024',
      quality: this.config.quality || 'standard'
    };

    console.log('📡 Calling DALL-E API');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DALL-E API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No images returned from DALL-E');
    }

    const imageUrl = data.data[0].url;

    return {
      imageUrl,
      thumbnailUrl: imageUrl,
      prompt: request.prompt,
      provider: 'dalle',
      generatedAt: new Date()
    };
  }

  /**
   * 使用 Pollinations AI 生成图片
   */
  private async generateWithPollinations(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // Pollinations AI 使用简单的 URL 参数方式
    // https://image.pollinations.ai/prompt/{prompt}?width={width}&height={height}&seed={seed}
    
    const prompt = encodeURIComponent(this.enhancePrompt(request.prompt));
    const width = request.width || 800;
    const height = request.height || 450;
    const seed = request.seed || Math.floor(Math.random() * 1000000);
    
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
    
    console.log('📡 Calling Pollinations AI:', imageUrl.substring(0, 100) + '...');
    
    // Pollinations AI 直接返回图片 URL，无需额外处理
    return {
      imageUrl,
      thumbnailUrl: imageUrl, // 可以使用相同 URL，浏览器会缓存
      prompt: request.prompt,
      provider: 'pollinations',
      generatedAt: new Date()
    };
  }

  /**
   * 生成占位符图片（使用本地SVG，避免外部服务依赖）
   */
  private async generatePlaceholder(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const width = request.width || 800;
    const height = request.height || 450;
    
    // 从提示词中提取关键词
    const keywords = this.extractKeywords(request.prompt);
    const text = keywords.slice(0, 3).join(' ') || '分镜';
    
    // 生成本地 SVG 占位符（避免外部服务依赖）
    const imageUrl = this.generateSVGPlaceholder(width, height, text);
    const thumbnailUrl = this.generateSVGPlaceholder(150, 150, text);

    return {
      imageUrl,
      thumbnailUrl,
      prompt: request.prompt,
      provider: 'placeholder',
      generatedAt: new Date()
    };
  }

  /**
   * 生成 SVG 占位符图片（Data URL）
   */
  private generateSVGPlaceholder(width: number, height: number, text: string): string {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#7a9188"/>
        <text 
          x="50%" 
          y="50%" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          font-family="Arial, sans-serif" 
          font-size="20" 
          fill="#ffffff"
        >${text}</text>
      </svg>
    `.trim();
    
    // 转换为 Data URL
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  /**
   * 增强提示词（添加动画风格）
   */
  private enhancePrompt(prompt: string): string {
    // 添加动画风格关键词
    const styleKeywords = [
      'anime style',
      'high quality',
      'detailed',
      'cinematic lighting',
      'professional composition'
    ];

    return `${prompt}, ${styleKeywords.join(', ')}`;
  }

  /**
   * 从提示词中提取关键词
   */
  private extractKeywords(prompt: string): string[] {
    // 简单的关键词提取（可以改进）
    const words = prompt.split(/[,，。、\s]+/);
    return words.filter(w => w.length > 1).slice(0, 5);
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(request: ImageGenerationRequest): string {
    return `${this.config.provider}_${request.prompt}_${request.width || 800}x${request.height || 450}`;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Image cache cleared');
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      switch (this.config.provider) {
        case 'stable-diffusion':
          return await this.testStableDiffusion();
        case 'dalle':
          return await this.testDALLE();
        case 'pollinations':
          return { success: true, message: 'Pollinations AI 无需配置，可直接使用' };
        case 'placeholder':
          return { success: true, message: 'Placeholder service is always available' };
        default:
          return { success: false, message: 'Unknown provider' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 测试 Stable Diffusion 连接
   */
  private async testStableDiffusion(): Promise<{ success: boolean; message: string }> {
    const apiUrl = this.config.apiUrl || 'http://localhost:7860';
    
    try {
      const response = await fetch(`${apiUrl}/sdapi/v1/sd-models`, {
        method: 'GET'
      });

      if (response.ok) {
        const models = await response.json();
        return {
          success: true,
          message: `Connected to Stable Diffusion. ${models.length} models available.`
        };
      } else {
        return {
          success: false,
          message: `Failed to connect: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error.message}`
      };
    }
  }

  /**
   * 测试 DALL-E 连接
   */
  private async testDALLE(): Promise<{ success: boolean; message: string }> {
    if (!this.config.apiKey) {
      return {
        success: false,
        message: 'API key not configured'
      };
    }

    try {
      // 测试 API key 是否有效（调用 models 端点）
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Connected to DALL-E API successfully'
        };
      } else {
        return {
          success: false,
          message: `API key validation failed: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error.message}`
      };
    }
  }
}

// 导出单例
export const imageGenerationService = new ImageGenerationService();
