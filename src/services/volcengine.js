/**
 * 火山引擎（Volcengine）生图服务
 * 文档: https://www.volcengine.com/docs/82379/1541523?lang=zh
 */

// 从环境变量获取 API Key
// 请在项目根目录创建 .env.local 文件并添加 VITE_VOLC_API_KEY=your_api_key
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
const CHAT_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

const getApiKey = () => {
  return localStorage.getItem('VITE_VOLC_API_KEY')
}

/**
 * 调用 AI 润色/对话接口
 * @param {string} prompt 提示词
 * @param {string} text 需要润色的原始文本
 * @param {object} options 其他选项 (model)
 * @returns {Promise<string>} 润色后的文本
 */
export async function polishText(prompt, text, options = {}) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('请先在左下角设置中配置火山引擎 API Key')
  }

  const {
    model = 'doubao-1-5-pro-32k-250115' // 豆包 1.5 Pro 模型
  } = options

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的文案润色助手，请根据用户的要求优化文本。直接返回润色后的结果，不要包含"润色后："、"以下是优化后的内容："等无关的前缀或后缀。'
          },
          {
            role: 'user',
            content: `要求：${prompt}\n\n原始文本：${text}`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `请求失败: ${response.status}`)
    }

    const data = await response.json()

    // 解析返回结果
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content
    } else {
      throw new Error('未获取到润色结果')
    }
  } catch (error) {
    console.error('AI 润色失败:', error)
    throw error
  }
}

/**
 * 调用 AI 生图接口
 * @param {string} prompt 提示词
 * @param {object} options 其他选项 (width, height, model, image)
 * @returns {Promise<string>} 图片 URL
 */
export async function generateImage(prompt, options = {}) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('请先在左下角设置中配置火山引擎 API Key')
  }

  const {
    width = 2048,
    height = 2048,
    model = 'doubao-seedream-5-0-260128', // 使用 5.0 lite 模型
    image = null // 图生图的参考图 URL
  } = options

  try {
    const requestBody = {
      model,
      prompt,
      // 如果有 image 参数，则是图生图
      ...(image && { image }),
      size: `${width}x${height}`,
      output_format: 'png',
      watermark: false,
      response_format: 'b64_json'
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `请求失败: ${response.status}`)
    }

    const data = await response.json()

    // 解析返回结果
    if (data.data && data.data.length > 0) {
      return 'data:image/png;base64,' + data.data[0].b64_json
    } else {
      throw new Error('未获取到图片数据')
    }
  } catch (error) {
    console.error('AI 生图失败:', error)
    throw error
  }
}
