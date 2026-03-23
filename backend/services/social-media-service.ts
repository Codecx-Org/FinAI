import { cfGenerateText, cfGenerateImage } from './cloudflare-service.js';

export interface SocialMediaContentRequest {
  platform: string;
  type: string;
  tone: string;
  description: string;
}

export interface SocialMediaContentResponse {
  platform: string;
  type: string;
  content: string;
  hashtags: string[];
  imageBase64?: string;
}

export class SocialMediaService {
  async generateContent(data: SocialMediaContentRequest): Promise<SocialMediaContentResponse> {
    const systemPrompt = this.buildSystemPrompt(data.platform, data.type, data.tone);
    const userPrompt   = this.buildUserPrompt(data.description, data.platform, data.type, data.tone);

    // Run text + image in parallel
    const [rawText, imageBuffer] = await Promise.allSettled([
      cfGenerateText(userPrompt, systemPrompt),
      cfGenerateImage(`${data.description}, ${data.platform} marketing style, professional product photo`),
    ]);

    // Debug logging — remove once image is confirmed working
    console.log('[SocialMedia] text status:', rawText.status);
    console.log('[SocialMedia] image status:', imageBuffer.status);
    if (imageBuffer.status === 'rejected') {
      console.error('[SocialMedia] image failed:', imageBuffer.reason);
    }
    if (rawText.status === 'rejected') {
      console.error('[SocialMedia] text failed:', rawText.reason);
    }

    if (rawText.status === 'rejected') {
      throw new Error('Failed to generate text content');
    }

    const { content, hashtags } = this.parseResponse(rawText.value);

    const imageBase64 =
      imageBuffer.status === 'fulfilled'
        ? imageBuffer.value.toString('base64')
        : undefined;

    return {
      platform: data.platform,
      type: data.type,
      content,
      hashtags,
      imageBase64,
    };
  }

  private buildSystemPrompt(platform: string, type: string, tone: string): string {
    const baseContext =
      'You are an AI social media content creator specializing in African small business marketing. ' +
      'Your content should be culturally relevant, engaging, and designed to drive business growth.';

    const platformContext: Record<string, string> = {
      instagram: 'Create visually-oriented content that leverages hashtags effectively and encourages engagement through comments and shares.',
      twitter:   'Create concise, impactful content that sparks conversation and is optimized for retweets and replies.',
      linkedin:  'Create professional, insight-driven content that establishes thought leadership and builds business networks.',
    };

    const toneContext: Record<string, string> = {
      professional:  'Adopt a professional, authoritative tone that builds trust and credibility while showcasing expertise.',
      casual:        'Use a friendly, conversational tone that feels approachable and authentic, like talking to a friend.',
      promotional:   'Create compelling, urgency-driven content that motivates immediate action while remaining authentic.',
      inspirational: 'Craft uplifting, motivational content that empowers entrepreneurs and celebrates business success.',
      humorous:      'Use appropriate humor and wit that resonates with business owners while keeping the message clear.',
      informative:   'Provide valuable, educational content that positions the brand as a trusted source of business knowledge.',
    };

    return (
      `${baseContext} ${platformContext[platform] || ''} ${toneContext[tone] || ''}.\n` +
      `IMPORTANT: Provide the output in the following format:\n` +
      `CONTENT: [The actual post text]\n` +
      `HASHTAGS: [#hashtag1, #hashtag2, ...]\n` +
      `Do not include any other text or explanations.`
    );
  }

  private buildUserPrompt(desc: string, platform: string, type: string, tone: string): string {
    return (
      `Create a ${tone} ${type} for ${platform} about: "${desc}". ` +
      `The content should be optimized for African small businesses, include relevant emojis naturally, and drive engagement. ` +
      `Focus on practical benefits and real-world applications.`
    );
  }

  private parseResponse(rawText: string): { content: string; hashtags: string[] } {
    let content  = '';
    let hashtags: string[] = [];

    const contentMatch  = rawText.match(/CONTENT:\s*([\s\S]*?)(?=HASHTAGS:|$)/i);
    const hashtagsMatch = rawText.match(/HASHTAGS:\s*([\s\S]*?)$/i);

    content = contentMatch ? contentMatch[1].trim() : rawText.replace(/HASHTAGS:[\s\S]*$/i, '').trim();

    if (hashtagsMatch) {
      hashtags = hashtagsMatch[1]
        .trim()
        .split(/[,\s]+/)
        .map(t => t.trim())
        .filter(t => t.startsWith('#'));
    }

    return { content, hashtags };
  }
}

export const socialMediaService = new SocialMediaService();