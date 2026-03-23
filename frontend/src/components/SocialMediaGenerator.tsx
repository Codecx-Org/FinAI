import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Instagram, Twitter, Linkedin, Share2, AlertCircle, Download, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const PROXY_URL: string = (() => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PROXY_URL)
      // @ts-ignore
      return (import.meta as any).env.VITE_PROXY_URL as string;
  } catch {}
  return 'http://localhost:3001';
})();

// ─────────────────────────────────────────────
// API — POST /api/content/generate-social-media
// ─────────────────────────────────────────────
interface APIResponse {
  platform: string;
  type: string;
  content: string;
  hashtags: string[];
  imageBase64?: string; // base64 PNG from Cloudflare AI
}

const generateContentViaAPI = async (
  platform: string, type: string, tone: string, description: string,
): Promise<APIResponse> => {
  const token = localStorage.getItem('numeraai_token');
  const res = await fetch(`${PROXY_URL}/api/content/generate-social-media`, {
    method: 'POST',
    signal: AbortSignal.timeout(60000), // CF image gen can take ~20-30s
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ platform, type, tone, description }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error || `API error ${res.status}`);
  }
  return res.json();
};

// base64 string → Blob
const base64ToBlob = (base64: string, mime = 'image/png'): Blob => {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface SocialMediaGeneratorProps { onBack: () => void; }
interface GeneratedContent {
  platform: string; type: string; content: string;
  hashtags: string[]; imageBase64?: string; source?: 'ai' | 'template';
}
interface Goal { id: string; label: string; sublabel: string; gradient: string; }

// ─────────────────────────────────────────────
// SHARE OPTIONS
// ─────────────────────────────────────────────
const SHARE_OPTIONS = [
  {
    id: 'whatsapp-chat', label: 'WhatsApp Chat', sub: 'Send to a contact', bg: 'bg-green-600',
    icon: (<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>),
  },
  { id: 'instagram-story', label: 'Instagram Story', sub: 'Save & open IG story',  bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400', icon: <Instagram className="w-5 h-5 text-white" /> },
  { id: 'instagram-post',  label: 'Instagram Post',  sub: 'Copy & open Instagram', bg: 'bg-gradient-to-br from-purple-500 to-pink-500',                icon: <Instagram className="w-5 h-5 text-white" /> },
  { id: 'twitter',         label: 'Twitter / X',     sub: 'Opens compose',          bg: 'bg-black',    icon: <Twitter  className="w-5 h-5 text-white" /> },
  { id: 'linkedin',        label: 'LinkedIn',         sub: 'Opens share',            bg: 'bg-blue-600', icon: <Linkedin className="w-5 h-5 text-white" /> },
  {
    id: 'facebook', label: 'Facebook', sub: 'Opens share dialog', bg: 'bg-blue-700',
    icon: (<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>),
  },
  {
    id: 'tiktok', label: 'TikTok', sub: 'Copy & open TikTok', bg: 'bg-black',
    icon: (<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>),
  },
  { id: 'copy',     label: 'Copy Text',      sub: 'Copy to clipboard',    bg: 'bg-gray-600', icon: <Copy     className="w-5 h-5 text-white" /> },
  { id: 'download', label: 'Download Image', sub: 'Save image to device', bg: 'bg-teal-600', icon: <Download className="w-5 h-5 text-white" /> },
];

// ─────────────────────────────────────────────
// FALLBACK TEMPLATES
// ─────────────────────────────────────────────
const getTemplateContent = (plt: string, type: string, tn: string, desc: string): string => {
  const t: Record<string, Record<string, Record<string, string>>> = {
    instagram: {
      post: {
        professional:  `📊 Elevate your business with ${desc}.\n\nAfrican entrepreneurs deserve world-class tools.\n\n✅ Reduce costs\n✅ Grow faster\n✅ Stay ahead\n\nLink in bio.`,
        casual:        `Hey business owners! 👋\n\n${desc} is changing how we run businesses here in Africa!\n\nTry it and thank us later 😄 Link in bio!`,
        promotional:   `🔥 BIG NEWS: ${desc} is here!\n\n⚡ Limited spots\n🎁 Free onboarding\n\n👆 Link in bio — don't sleep on this!`,
        inspirational: `🌟 Your business breakthrough starts with ${desc}.\n\nChoose wisely. Choose growth. 💪\n\nLink in bio.`,
        humorous:      `Plot twist: ${desc} makes running a business less painful 😂\n\nWho knew?! 🙃 Link in bio.`,
        informative:   `💡 ${desc} can boost efficiency by up to 50%.\n\nAfrican businesses are already winning.\n\nLink in bio. 📚`,
      },
      ad: {
        professional:  `📊 ${desc} — The professional choice.\n\nOptimize. Scale. Succeed. Get started — link in bio.`,
        casual:        `🔥 ${desc} just dropped!\n\nEasy to use, impossible to ignore. Link in bio!`,
        promotional:   `⚡ SPECIAL OFFER: ${desc}\n\nFirst 100 get FREE access. Claim yours — link in bio!`,
        inspirational: `🚀 ${desc} — Fuel for your biggest goals.\n\nThe future belongs to those who build it. Link in bio.`,
        humorous:      `😅 ${desc} — because business is hard enough without bad tools.\n\nWe fixed that. Link in bio!`,
        informative:   `📈 ${desc} — 50% efficiency gains. Proven results. Learn more — link in bio.`,
      },
    },
    twitter: {
      post: {
        professional:  `📊 ${desc} is changing the game for African small businesses.\n\nSmart tools = bigger growth. #SmallBusiness #AfricanTech`,
        casual:        `Okay, ${desc} is actually amazing 🔥 Why didn't anyone tell us sooner?! #EntrepreneurLife`,
        promotional:   `🚨 ${desc} — special offer for African entrepreneurs! Don't miss this. #LimitedOffer`,
        inspirational: `🌟 ${desc} — Your breakthrough is closer than you think. Keep building. #Motivation`,
        humorous:      `Breaking: ${desc} makes running a business 10x less chaotic 😂 Science. Probably. #BusinessHumor`,
        informative:   `📚 3 facts about ${desc}:\n1. Saves 35% on costs\n2. Built for Africa\n3. Actually works #BusinessFacts`,
      },
    },
    linkedin: {
      post: {
        professional:  `The Future of African Business: ${desc}\n\nBusinesses investing in the right tools today will lead tomorrow.\n\n• Reduced costs\n• Real-time insights\n• Mobile-first\n\nWhat tools are you using?\n\n#DigitalTransformation #AfricanBusiness`,
        casual:        `Quick win for fellow entrepreneurs! 💡\n\n${desc} — implemented this and the difference is real.\n\nWhat's your go-to business hack?\n\n#BusinessTips`,
        promotional:   `🎉 Announcing: ${desc}\n\nBuilt for African small businesses. Limited beta — comment below!\n\n#ProductLaunch #SmallBusiness`,
        inspirational: `African entrepreneurs are building the future. 🌍\n\n${desc} is one piece of that puzzle. Keep going.\n\n#AfricanEntrepreneur`,
        humorous:      `Real talk: ${desc} shouldn't require a PhD to use 😅\n\nWe built something different. Comment 'INTERESTED'. #SmallBusiness`,
        informative:   `Data: Businesses using ${desc} see 40% faster growth.\n\nGood tools remove friction = more time for what matters.\n\n#DataDriven #BusinessIntelligence`,
      },
    },
  };
  return t[plt]?.[type]?.[tn] || t[plt]?.['post']?.[tn] ||
    `${desc}\n\nBuilt for African small businesses. Built for growth.\n\n#SmallBusiness #Africa`;
};

const generateSmartHashtags = (plt: string, tn: string, desc: string, content: string): string[] => {
  const base = ['#SmallBusiness', '#AfricanTech', '#Entrepreneurs', '#BusinessGrowth'];
  const toneMap: Record<string, string[]> = {
    professional: ['#DigitalTransformation', '#BusinessInnovation'], casual: ['#EntrepreneurLife', '#SmallBizLife'],
    promotional:  ['#LimitedOffer', '#BusinessDeal'],                inspirational: ['#DreamBig', '#Motivation'],
    humorous:     ['#BusinessHumor', '#StartupLife'],                informative:   ['#BusinessEducation', '#KnowledgeSharing'],
  };
  const platformMap: Record<string, string[]> = {
    instagram: ['#AfricanInnovation', '#TechForAfrica'], twitter: ['#AfricanStartups', '#Innovation'], linkedin: ['#BusinessStrategy', '#Leadership'],
  };
  const contextMap: Record<string, string[]> = {
    inventory: ['#InventoryManagement'], sales: ['#SalesTracker'], payment: ['#MobileMoney', '#MPesa'], ai: ['#Automation'], growth: ['#Scaling'],
  };
  const ctx: string[] = [];
  Object.entries(contextMap).forEach(([k, tags]) => {
    if (desc.toLowerCase().includes(k) || content.toLowerCase().includes(k)) ctx.push(...tags);
  });
  return [...base, ...(toneMap[tn] || []), ...(platformMap[plt] || []), ...ctx]
    .filter((v, i, a) => a.indexOf(v) === i).slice(0, plt === 'twitter' ? 4 : 8);
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export function SocialMediaGenerator({ onBack }: SocialMediaGeneratorProps) {
  const [selectedGoal, setSelectedGoal]         = useState<Goal | null>(null);
  const [tone, setTone]                         = useState('');
  const [description, setDescription]           = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating]         = useState(false);
  const [showShareModal, setShowShareModal]     = useState(false);
  const [errors, setErrors]                     = useState<string[]>([]);
  const [copied, setCopied]                     = useState(false);

  const goals: Goal[] = [
    { id: 'grow',    label: 'Grow My Business',        sublabel: 'Expand reach & revenue',        gradient: 'from-emerald-400 to-teal-500'  },
    { id: 'attract', label: 'Attract New Customers',   sublabel: 'Bring in fresh leads',          gradient: 'from-violet-500 to-purple-600' },
    { id: 'launch',  label: 'Launch a Product',        sublabel: 'Announce something new',        gradient: 'from-orange-400 to-pink-500'   },
    { id: 'trust',   label: 'Build Trust & Authority', sublabel: 'Position yourself as the best', gradient: 'from-amber-400 to-orange-500'  },
    { id: 'sale',    label: 'Run a Promotion',         sublabel: 'Drive urgency & conversions',   gradient: 'from-red-400 to-rose-600'      },
    { id: 'retain',  label: 'Keep Customers Coming',   sublabel: 'Loyalty & repeat business',     gradient: 'from-yellow-400 to-amber-500'  },
  ];

  const tones = [
    { value: 'professional', label: 'Professional' }, { value: 'casual',        label: 'Casual'        },
    { value: 'promotional',  label: 'Promotional'  }, { value: 'inspirational', label: 'Inspirational' },
    { value: 'humorous',     label: 'Humorous'     }, { value: 'informative',   label: 'Informative'   },
  ];

  const generateContent = async () => {
    if (!selectedGoal || !tone || !description.trim()) return;
    const platform    = tone === 'professional' || tone === 'informative' ? 'linkedin' : 'instagram';
    const contentType = selectedGoal.id === 'sale' ? 'ad' : 'post';

    setIsGenerating(true); setErrors([]); setGeneratedContent(null);

    try {
      const result = await generateContentViaAPI(platform, contentType, tone, description);
      const hashtags = result.hashtags?.length
        ? result.hashtags
        : generateSmartHashtags(platform, tone, description, result.content);
      setGeneratedContent({ platform: result.platform, type: result.type, content: result.content, hashtags, imageBase64: result.imageBase64, source: 'ai' });
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      console.warn('[Generate] Failed:', msg);
      setErrors([msg]);
      const fallback = getTemplateContent(platform, contentType, tone, description);
      setGeneratedContent({ platform, type: contentType, content: fallback, hashtags: generateSmartHashtags(platform, tone, description, fallback), source: 'template' });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Image helpers ──
  const getBlob = (): Blob | null =>
    generatedContent?.imageBase64 ? base64ToBlob(generatedContent.imageBase64) : null;

  const downloadImage = () => {
    const blob = getBlob(); if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `numeraai-post-${Date.now()}.png`;
    a.click();
  };

  const shareImageNative = async (text: string): Promise<boolean> => {
    if (!navigator.share) return false;
    const blob = getBlob(); if (!blob) return false;
    try { await navigator.share({ files: [new File([blob], 'post.png', { type: 'image/png' })], text }); return true; }
    catch { return false; }
  };

  const handleShare = async (target: string) => {
    if (!generatedContent) return;
    const text    = `${generatedContent.content}\n\n${generatedContent.hashtags.join(' ')}`;
    const encoded = encodeURIComponent(text);

    switch (target) {
      case 'whatsapp-chat':    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer'); break;
      case 'whatsapp-status': { const ok = await shareImageNative(text); if (!ok) { downloadImage(); await navigator.clipboard.writeText(text).catch(()=>{}); alert('Image downloaded & text copied!\n\nOpen WhatsApp → Status → add image, then paste caption.'); } break; }
      case 'instagram-story': { downloadImage(); await navigator.clipboard.writeText(text).catch(()=>{}); window.open('https://www.instagram.com/','_blank','noopener,noreferrer'); alert('Image downloaded & caption copied!\n\nOpen Instagram → Your Story → add the image, then paste your caption.'); break; }
      case 'instagram-post':  { const ok = await shareImageNative(text); if (!ok) { await navigator.clipboard.writeText(text).catch(()=>{}); downloadImage(); window.open('https://www.instagram.com/','_blank','noopener,noreferrer'); } break; }
      case 'twitter':   window.open(`https://twitter.com/intent/tweet?text=${encoded}`,'_blank','noopener,noreferrer,width=600,height=500'); break;
      case 'linkedin':  window.open(`https://www.linkedin.com/shareArticle?mini=true&summary=${encoded}`,'_blank','noopener,noreferrer,width=600,height=500'); break;
      case 'facebook':  window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encoded}`,'_blank','noopener,noreferrer,width=600,height=500'); break;
      case 'tiktok':    await navigator.clipboard.writeText(text).catch(()=>{}); window.open('https://www.tiktok.com/upload','_blank','noopener,noreferrer'); alert('Caption copied! Paste after uploading on TikTok.'); break;
      case 'copy':      await navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); setShowShareModal(false); return;
      case 'download':  downloadImage(); break;
    }
    setShowShareModal(false);
  };

  const imgSrc = generatedContent?.imageBase64 ? `data:image/png;base64,${generatedContent.imageBase64}` : undefined;

  const renderPlatformPreview = () => (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
      <div className="w-full aspect-square bg-gray-100">
        {imgSrc
          ? <ImageWithFallback src={imgSrc} alt="Generated" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image generated</div>}
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm whitespace-pre-line leading-relaxed">{generatedContent?.content}</p>
        <div className="flex flex-wrap gap-1">
          {generatedContent?.hashtags.map((tag, i) => <span key={i} className="text-[#00C4B4] text-xs font-medium">{tag}</span>)}
        </div>
      </div>
    </div>
  );

  const renderPreview = () => {
    if (!generatedContent) return null;
    return (
      <Card className="rounded-lg border-2 border-[#00C4B4]/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{generatedContent.type === 'ad' ? '✦ Ad' : '✦ Post'}</CardTitle>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">{generatedContent.source === 'ai' ? 'AI generated' : 'template'}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderPlatformPreview()}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setGeneratedContent(null)}>Generate New</Button>
            <Button onClick={() => setShowShareModal(true)} className="flex-1 bg-[#00C4B4] hover:bg-[#00B3A6] text-white h-12">
              <Share2 className="w-4 h-4 mr-2" />Share
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
              navigator.clipboard.writeText(`${generatedContent.content}\n\n${generatedContent.hashtags.join(' ')}`).catch(()=>{});
              setCopied(true); setTimeout(()=>setCopied(false),2000);
            }}>
              {copied ? <><Check className="w-3 h-3 mr-1" />Copied!</> : <><Copy className="w-3 h-3 mr-1" />Copy Text</>}
            </Button>
            {generatedContent.imageBase64 && (
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={downloadImage}>
                <Download className="w-3 h-3 mr-1" />Save Image
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const SECTIONS = [
    { label: 'WhatsApp',        filter: (o: typeof SHARE_OPTIONS[0]) => o.id.startsWith('whatsapp') },
    { label: 'Instagram',       filter: (o: typeof SHARE_OPTIONS[0]) => o.id.startsWith('instagram') },
    { label: 'Other Platforms', filter: (o: typeof SHARE_OPTIONS[0]) => ['twitter','linkedin','facebook','tiktok'].includes(o.id) },
    { label: 'Save & Copy',     filter: (o: typeof SHARE_OPTIONS[0]) => ['copy','download'].includes(o.id) },
  ];

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2"><ArrowLeft className="w-5 h-5" /></Button>
        <div><h2 className="text-lg font-semibold">Create Content</h2><p className="text-xs text-muted-foreground">Pick a goal and we'll handle the rest</p></div>
      </div>

      {errors.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <ul className="space-y-1">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What's your goal?</p>
        <div className="grid grid-cols-2 gap-2">
          {goals.map(goal => {
            const sel = selectedGoal?.id === goal.id;
            return (
              <button key={goal.id} onClick={() => setSelectedGoal(sel ? null : goal)}
                className={`relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 border-2 ${sel ? 'border-[#00C4B4] bg-[#00C4B4]/5 shadow-md' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:shadow-sm'}`}>
                <p className="text-xs font-semibold leading-tight">{goal.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{goal.sublabel}</p>
                {sel && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00C4B4] flex items-center justify-center"><span className="text-white text-[9px] font-bold">✓</span></div>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tone</Label>
        <div className="grid grid-cols-3 gap-2">
          {tones.map(t => {
            const sel = tone === t.value;
            return (
              <button key={t.value} onClick={() => setTone(sel ? '' : t.value)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all duration-150 ${sel ? 'border-[#00C4B4] bg-[#00C4B4] text-white shadow-sm' : 'border-gray-200 text-muted-foreground hover:border-gray-300 hover:text-foreground'}`}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What are you promoting? <span className="normal-case font-normal ml-1">({description.length}/200)</span>
        </Label>
        <Textarea placeholder="e.g. My new M-Pesa payment feature, weekend sale on clothes…" value={description}
          onChange={e => { if (e.target.value.length <= 200) setDescription(e.target.value); }}
          className="rounded-xl resize-none text-sm" rows={3} />
      </div>

      <Button onClick={generateContent} disabled={!selectedGoal || !tone || !description.trim() || isGenerating}
        className="w-full bg-[#00C4B4] hover:bg-[#00B3A6] disabled:opacity-40 text-white rounded-xl h-12 font-semibold text-sm shadow-md transition-all">
        {isGenerating
          ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</div>
          : <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" />{selectedGoal ? `Generate — ${selectedGoal.label}` : 'Generate Content'}</div>}
      </Button>

      {generatedContent && <div className="space-y-2"><Label>Generated Content Preview</Label>{renderPreview()}</div>}

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5" />Share Your Content</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">On mobile, image + text will be shared directly to the app. On desktop, the image downloads and caption is copied automatically.</p>
            {SECTIONS.map(({ label, filter }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {SHARE_OPTIONS.filter(filter).map(({ id, label: lbl, sub, icon, bg }) => (
                    <button key={id} onClick={() => handleShare(id)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>{icon}</div>
                      <div className="text-left"><p className="text-sm font-semibold">{id === 'copy' && copied ? 'Copied!' : lbl}</p><p className="text-[10px] text-muted-foreground">{sub}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => setShowShareModal(false)} className="w-full">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}