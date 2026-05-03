import React, { useState } from 'react';
import { Bot, Send, User, Lightbulb, TrendingUp, Globe, MessageCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useChat, type ChatMessage } from '../hooks/api/useChat';
import ReactMarkdown from 'react-markdown';
import { speechService } from './speech';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  language?: 'en' | 'sw';
}
const initialMessages: Message[] = [
  {
    id: '1',
    content: 'Habari! I\'m your AI business coach. I can help you in English or Kiswahili. How can I assist your business today?',
    isBot: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    language: 'en'
  },
  //=
];

const quickActions = [
  { id: '1', label: 'Pricing Help', icon: TrendingUp, query: 'Help me optimize my product pricing' },
  { id: '2', label: 'Marketing Tips', icon: Lightbulb, query: 'Give me marketing ideas for my business' },
  { id: '3', label: 'Inventory Advice', icon: MessageCircle, query: 'How can I manage my inventory better?' },
  { id: '4', label: 'M-Pesa Setup', icon: Globe, query: 'Help me set up M-Pesa for my business' },
];


export function AICoach() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');

  const { mutateAsync: sendMessage, isPending: isTyping } = useChat();
  const [isListening, setIsListening] = useState(false);
  //voice handler
  const handleVoiceInput = () => {
  if (!speechService.isSupported()) {
    alert('Speech recognition not supported in this browser');
    return;
  }

  speechService.start({
    language,
    onStart: () => setIsListening(true),

    onResult: (text) => {
      setInputMessage(text);

    },

    onError: (err) => {
      console.error(err);
      setIsListening(false);
    },

    onEnd: () => setIsListening(false),
  });
};


  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSendMessage = async() => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date(),
      language
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');

    try {
      const history: ChatMessage[] = messages.map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.content
      }));

      const data = await sendMessage({
        message: currentInput,
        history,
        language
      });
      // Handle both response formats (with or without success flag)
      const responseText = data.success ? data.response : data.response;
      

      const botResponse: Message = {
        id: Date.now().toString(),
        content: responseText,
        isBot: true,
        timestamp: new Date(),
        language
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: language === 'sw'
          ? 'Samahani, nimepata tatizo la kiufundi. Tafadhali jaribu tena baadaye.'
          : 'Sorry, I encountered a technical issue. Please try again later.',
        isBot: true,
        timestamp: new Date(),
        language
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleQuickAction = (query: string) => {
    setInputMessage(query);
    // Auto-send can be triggered if desired
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h2>AI Business Coach</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Mshauri wa biashara / Your intelligent business advisor
        </p>
        
        {/* Language Toggle */}
        <div className="flex justify-center gap-2 mt-3">
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
          >
            English
          </Button>
          <Button
            variant={language === 'sw' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('sw')}
          >
            Kiswahili
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full">
          <TabsTrigger value="chat w-full">Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.query)}
                      className="flex items-center gap-2 h-auto p-2"
                    >
                      <Icon className="w-3 h-3" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="h-96">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    {message.isBot && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.isBot
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {message.isBot ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {!message.isBot && (
                      <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={language === 'sw' ? 'Andika ujumbe wako...' : 'Type your message...'}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}