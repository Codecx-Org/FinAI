import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Instagram, Twitter, Linkedin, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useGenerateSocialMedia, type SocialMediaContentResponse } from '../hooks/api/useContent';
import { toast } from 'sonner';

interface SocialMediaGeneratorProps {
  onBack: () => void;
}

export function SocialMediaGenerator({ onBack }: SocialMediaGeneratorProps) {
  const [platform, setPlatform] = useState<string>('');
  const [contentType, setContentType] = useState<string>('');
  const [tone, setTone] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<SocialMediaContentResponse | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const { mutateAsync: generateAIContent, isPending: isGenerating } = useGenerateSocialMedia();

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'twitter', label: 'Twitter', icon: Twitter },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  ];

  const contentTypes = [
    { value: 'post', label: 'Post' },
    { value: 'story', label: 'Story' },
    { value: 'ad', label: 'Advertisement' },
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'inspirational', label: 'Inspirational' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'informative', label: 'Informative' },
  ];

  const generateContent = async () => {
    if (!platform || !contentType || !tone || !description.trim()) {
      return;
    }

    try {
      const result = await generateAIContent({
        platform,
        type: contentType,
        tone,
        description
      });
      
      setGeneratedContent(result);
      toast.success('AI content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate AI content. Please try again.');
    }
  };

  const getPlatformIcon = (platformValue: string) => {
    const platform = platforms.find(p => p.value === platformValue);
    return platform ? platform.icon : Instagram;
  };

  const handleShare = (sharePlatform: string) => {
    console.log(`Sharing to ${sharePlatform}:`, generatedContent);
    setShowShareModal(false);
    toast.success(`Content shared to ${sharePlatform}!`);
  };

  const handleInputChange = (value: string) => {
    if (value.length <= 200) {
      setDescription(value);
    }
  };

  const renderPlatformPreview = () => {
    if (!generatedContent) return null;

    if (generatedContent.platform === 'instagram') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-sm mx-auto">
          {/* Instagram Header */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">NM</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-black">numeraai_official</p>
              <p className="text-xs text-gray-500">Sponsored</p>
            </div>
          </div>

          {/* Image */}
          {generatedContent.imageUrl && (
            <div className="aspect-square bg-gray-100 relative">
              <ImageWithFallback 
                src={generatedContent.imageUrl}
                alt="Generated content"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-3">
            <p className="text-sm mb-2 text-black line-clamp-3">{generatedContent.content}</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {generatedContent.hashtags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-blue-600 text-xs">{tag}</span>
              ))}
            </div>
            <p className="text-xs text-gray-500">Just now</p>
          </div>
        </div>
      );
    }

    if (generatedContent.platform === 'twitter') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-lg mx-auto">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">NM</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-sm text-black">NumeraAI</span>
                <span className="text-blue-500">✓</span>
                <span className="text-gray-500 text-sm">@numeraai</span>
                <span className="text-gray-500 text-sm">• 1m</span>
              </div>
              <p className="text-sm mb-2 text-black">{generatedContent.content}</p>
              {generatedContent.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-200 mb-2">
                  <ImageWithFallback 
                    src={generatedContent.imageUrl}
                    alt="Generated content"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (generatedContent.platform === 'linkedin') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 max-w-lg mx-auto text-black">
          <div className="p-4">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">NM</span>
              </div>
              <div>
                <p className="font-medium text-sm">NumeraAI</p>
                <p className="text-xs text-gray-500">AI Business Solutions • 2nd</p>
                <p className="text-xs text-gray-500">1 minute ago</p>
              </div>
            </div>
            <p className="text-sm mb-3 whitespace-pre-line">{generatedContent.content}</p>
            {generatedContent.imageUrl && (
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-3">
                <ImageWithFallback 
                  src={generatedContent.imageUrl}
                  alt="Generated content"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderPreview = () => {
    if (!generatedContent) return null;

    const PlatformIcon = getPlatformIcon(generatedContent.platform);

    return (
      <Card className="rounded-lg border-2 border-[#00C4B4]/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 bg-[#00C4B4] rounded-full flex items-center justify-center">
              <PlatformIcon className="w-4 h-4 text-white" />
            </div>
            {generatedContent.platform.charAt(0).toUpperCase() + generatedContent.platform.slice(1)} {generatedContent.type}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform-specific preview mockup */}
          {renderPlatformPreview()}
          
          {/* Hashtags */}
          {generatedContent.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {generatedContent.hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setGeneratedContent(null)}
            >
              Generate New
            </Button>
            <Button 
              onClick={() => setShowShareModal(true)}
              className="flex-1 bg-[#00C4B4] hover:bg-[#00B3A6] text-white h-12"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-lg font-medium">Generate Social Media Content</h2>
          <p className="text-sm text-muted-foreground">AI-powered content creation</p>
        </div>
      </div>

      {/* Form */}
      <Card className="rounded-lg">
        <CardContent className="p-4 space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => {
                  const Icon = p.icon;
                  return (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {p.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description
              <span className="text-xs text-muted-foreground ml-2">
                ({description.length}/200)
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of what you want to promote..."
              value={description}
              onChange={(e) => handleInputChange(e.target.value)}
              className="rounded-lg resize-none text-black"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateContent}
            disabled={!platform || !contentType || !tone || !description.trim() || isGenerating}
            className="w-full bg-[#00C4B4] hover:bg-[#00B3A6] text-white rounded-lg h-12"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating AI Content...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Content
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Area */}
      {generatedContent && (
        <div className="space-y-2">
          <Label>Generated Content Preview</Label>
          {renderPreview()}
        </div>
      )}

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose where to share your generated content:
            </p>
            
            {/* Platform sharing options */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleShare('instagram')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 rounded-lg flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-black">Instagram</span>
              </button>

              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <Twitter className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-black">Twitter</span>
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Linkedin className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-black">LinkedIn</span>
              </button>
            </div>

            {/* Cancel button */}
            <Button
              variant="outline"
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
