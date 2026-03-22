// speech.ts

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type SpeechLanguage = 'en' | 'sw';

interface SpeechOptions {
  language?: SpeechLanguage;
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

class SpeechService {
  private recognition: any = null;

  constructor() {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  start(options: SpeechOptions) {
    if (!this.recognition) {
      options.onError?.('Speech recognition not supported');
      return;
    }

    const { language = 'en', onResult, onError, onStart, onEnd } = options;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = language === 'sw' ? 'sw-KE' : 'en-US';

    this.recognition.onstart = () => onStart?.();

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      onError?.(event.error || 'Error');
    };

    this.recognition.onend = () => onEnd?.();

    this.recognition.start();
  }

  stop() {
    this.recognition?.stop();
  }
}

export const speechService = new SpeechService();