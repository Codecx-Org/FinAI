import axios from 'axios';

/**
 * Service for interacting with Pollinations AI API.
 */
export class PollinationsService {
  private readonly baseUrl = 'https://gen.pollinations.ai';
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

    let url = `${this.baseUrl}/image/${prompt}?model=${model}&width=${width}&height=${height}&seed=${seed}&enhance=${enhance}`;
    
    if (this.apiKey) {
      url += `&key=${this.apiKey}`;
    }

    return url;
  }
}

export const pollinationsService = new PollinationsService();
