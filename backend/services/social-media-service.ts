import { pollinationsService } from './pollinations-service.js';

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
  imageUrl?: string;
}

export class SocialMediaService {
  async generateContent(data: SocialMediaContentRequest): Promise<SocialMediaContentResponse> {
    const systemPrompt = this.buildSystemPrompt(data.platform, data.type, data.tone);
    const userPrompt = this.buildUserPrompt(data.description, data.platform, data.type, data.tone);

    const rawText = await pollinationsService.generateText(userPrompt, systemPrompt);
    const { content, hashtags } = this.parseResponse(rawText);

    let imageUrl: string | undefined;
    if (data.type === 'post' || data.type === 'ad') {
      imageUrl = pollinationsService.generateImageUrl(`${data.description}, ${data.platform} marketing style`, {
        width: 1024,
        height: 1024
      });
    }

    return {
      platform: data.platform,
      type: data.type,
      content,
      hashtags,
      imageUrl
    };
  }

  private buildSystemPrompt(platform: string, type: string, tone: string): string {
    const baseContext = "You are an AI social media content creator specializing in African small business marketing. Your content should be culturally relevant, engaging, and designed to drive business growth.";
    
    const platformContext: Record<string, string> = {
      instagram: "Create visually-oriented content that leverages hashtags effectively and encourages engagement through comments and shares.",
      twitter: "Create concise, impactful content that sparks conversation and is optimized for retweets and replies.",
      linkedin: "Create professional, insight-driven content that establishes thought leadership and builds business networks."
    };

    const toneContext: Record<string, string> = {
      professional: "Adopt a professional, authoritative tone that builds trust and credibility while showcasing expertise.",
      casual: "Use a friendly, conversational tone that feels approachable and authentic, like talking to a friend.",
      promotional: "Create compelling, urgency-driven content that motivates immediate action while remaining authentic.",
      inspirational: "Craft uplifting, motivational content that empowers entrepreneurs and celebrates business success.",
      humorous: "Use appropriate humor and wit that resonates with business owners while keeping the message clear.",
      informative: "Provide valuable, educational content that positions the brand as a trusted source of business knowledge."
    };

    return `${baseContext} ${platformContext[platform] || ''} ${toneContext[tone] || ''}. 
    IMPORTANT: Provide the output in the following format:
    CONTENT: [The actual post text]
    HASHTAGS: [#hashtag1, #hashtag2, ...]. 
    Do not include any other text or explanations.`;
  }

  private buildUserPrompt(desc: string, platform: string, type: string, tone: string): string {
    return `Create a ${tone} ${type} for ${platform} about: "${desc}". 
    The content should be optimized for African small businesses, include relevant emojis naturally, and drive engagement. 
    Focus on practical benefits and real-world applications.`;
  }

  private parseResponse(rawText: string): { content: string, hashtags: string[] } {
    let content = '';
    let hashtags: string[] = [];

    const contentMatch = rawText.match(/CONTENT:\s*([\s\S]*?)(?=HASHTAGS:|$)/i);
    const hashtagsMatch = rawText.match(/HASHTAGS:\s*([\s\S]*?)$/i);

    if (contentMatch) {
      content = contentMatch[1].trim();
    } else {
      content = rawText.replace(/HASHTAGS:[\s\S]*$/i, '').trim();
    }

    if (hashtagsMatch) {
      const hashtagsStr = hashtagsMatch[1].trim();
      hashtags = hashtagsStr
        .split(/[,\s]+/)
        .map(tag => tag.trim())
        .filter(tag => tag.startsWith('#'));
    }

    return { content, hashtags };
  }
}

export const socialMediaService = new SocialMediaService();
