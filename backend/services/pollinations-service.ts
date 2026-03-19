import axios from 'axios';

/**
 * Service for interacting with Pollinations AI API.
 */
export class PollinationsService {
  private readonly baseUrl = 'https://image.pollinations.ai';
  private readonly textUrl = 'https://text.pollinations.ai';
  private readonly apiKey = process.env.POLLINATIONS_API_KEY;

  /**
   * Generates a direct URL for a product image based on its name and optional description.
   * 
   * @param productName - The name of the product.
   * @param options - Additional generation parameters.
   * @returns A string representing the generated image URL.
   */
  generateImageUrl(productName: string, options: { 
    model?: string, 
    width?: number, 
    height?: number,
    seed?: number,
    enhance?: boolean
  } = {}): string {
    const prompt = encodeURIComponent(productName);
    const model = options.model || 'flux';
    const width = options.width || 1024;
    const height = options.height || 1024;
    const seed = options.seed !== undefined ? options.seed : -1;
    const enhance = options.enhance !== undefined ? options.enhance : true;

    let url = `${this.baseUrl}/prompt/${prompt}?model=${model}&width=${width}&height=${height}&seed=${seed}&enhance=${enhance}`;
    
    if (this.apiKey) {
      url += `&key=${this.apiKey}`;
    }

    return url;
  }

  /**
   * Generates text content based on a prompt and system prompt.
   * 
   * @param prompt - The user prompt.
   * @param systemPrompt - The system instruction prompt.
   * @returns A promise that resolves to the generated text content.
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages = [
        { role: 'system', content: systemPrompt || 'You are a professional business assistant for African small business owners.' },
        { role: 'user', content: prompt }
      ];

      const response = await axios.post(`${this.textUrl}/`, {
        messages: messages,
        model: 'openai' // Pollinations supports 'openai' as a model name for their GPT-4o-mini powered text generation
      });

      return response.data;
    } catch (error) {
      console.error('Error generating text with Pollinations:', error);
      throw new Error('Failed to generate text content');
    }
  }
}

export const pollinationsService = new PollinationsService();
