import React, { useState } from 'react';
import { Bot, Send, User, Lightbulb, TrendingUp, Globe, MessageCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useChat, type ChatMessage } from '../hooks/api/useChat';
import ReactMarkdown from 'react-markdown';

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

const businessInsights = [
  {
    title: 'Chick Mash Demand Prediction',
    insight: 'AI predicts 35% increase in chick mash demand next week due to new poultry farmers in your area. Stock up now to capture this growing market.',
    action: 'Increase chick mash inventory',
    type: 'prediction'
  },
  {
    title: 'Layers Mash Pricing Opportunity',
    insight: 'Current layers mash prices are 12% below optimal market rate. Consider increasing price to KES 4,200 per 70kg bag for better margins.',
    action: 'Optimize layers mash pricing',
    type: 'pricing'
  },
  {
    title: 'Growers Mash Stock Alert',
    insight: 'Growers mash stock is running low. Current inventory will last only 4 more days based on recent sales trends.',
    action: 'Reorder growers mash immediately',
    type: 'alert'
  },
  {
    title: 'Peak Sales Hours',
    insight: 'Your best sales are between 6-8 PM. Consider extending hours or promoting during this time.',
    action: 'Extend evening hours'
  },
  {
    title: 'Product Opportunity',
    insight: 'Customers often ask for milk when buying tea. Consider stocking UHT milk.',
    action: 'Add dairy products'
  },
  {
    title: 'Payment Trends',
    insight: '70% of your customers prefer M-Pesa. Promote this payment method.',
    action: 'Display M-Pesa prominently'
  }
];

export function AICoach() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');

  const { mutateAsync: sendMessage, isPending: isTyping } = useChat();

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
        history
      });

      const botResponse: Message = {
        id: Date.now().toString(),
        content: data.response,
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
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
        
        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-3">
            {businessInsights.map((insight, index) => (
              <Card key={index} className={
                insight.type === 'prediction' ? 'border-purple-200 bg-purple-50' :
                insight.type === 'pricing' ? 'border-green-200 bg-green-50' :
                insight.type === 'alert' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium flex items-center gap-2">
                      {insight.type === 'prediction' && <TrendingUp className="w-4 h-4 text-purple-600" />}
                      {insight.type === 'pricing' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {insight.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      {!insight.type && <Lightbulb className="w-4 h-4 text-blue-600" />}
                      {insight.title}
                    </h3>
                    <Badge variant="secondary" className={
                      insight.type === 'prediction' ? 'bg-purple-100 text-purple-700' :
                      insight.type === 'pricing' ? 'bg-green-100 text-green-700' :
                      insight.type === 'alert' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {insight.type === 'prediction' ? 'Demand AI' :
                       insight.type === 'pricing' ? 'Pricing AI' :
                       insight.type === 'alert' ? 'Stock Alert' :
                       'Business AI'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.insight}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    {insight.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}