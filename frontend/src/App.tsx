import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { SalesTracker } from './components/SalesTracker';
import { AICoach } from './components/AICoach';
import { InventoryManager } from './components/InventoryManager';
import { BusinessInsights } from './components/BusinessInsights';
import { UserProfile } from './components/UserProfile';
import { SocialMediaGenerator } from './components/SocialMediaGenerator';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { BottomNavigation } from './components/BottomNavigation';
import { Toaster } from 'sonner';
import { api } from './lib/axios';
import { toast } from 'sonner';

export type Tab = 'home' | 'sales' | 'inventory' | 'insights' | 'profile';

interface UserData {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAI, setShowAI] = useState(false);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('numeraai_token');
  });

  const [userData, setUserData] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('numeraai_userdata');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleLogin = async (credentials: any) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, business } = response.data;
      
      localStorage.setItem('numeraai_token', token);
      localStorage.setItem('numeraai_userdata', JSON.stringify(business));
      
      setUserData(business);
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const handleRegister = async (data: any) => {
    try {
      await api.post('/auth/register', data);
      toast.success('Registration successful! Please login.');
      setAuthMode('login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('numeraai_token');
    localStorage.removeItem('numeraai_userdata');
    setIsAuthenticated(false);
    setUserData(null);
    setActiveTab('home');
  };

  const renderContent = () => {
    const businessId = userData?.id;
    
    if (showSocialMedia) {
      return <SocialMediaGenerator onBack={() => setShowSocialMedia(false)} />;
    }
    
    if (showAI) {
      return <AICoach />;
    }
    
    switch (activeTab) {
      case 'home':
        return <Dashboard userData={userData ? { ...userData, firstName: userData.ownerName.split(' ')[0], lastName: userData.ownerName.split(' ')[1] || '', businessName: userData.name, businessType: '', yearsInBusiness: '' } : undefined} businessId={businessId} />;
      case 'sales':
        return <SalesTracker businessId={businessId} />;
      case 'inventory':
        return <InventoryManager businessId={businessId} />;
      case 'insights':
        return <BusinessInsights businessId={businessId} />;
      case 'profile':
        return <UserProfile initialUserData={userData ? { firstName: userData.ownerName.split(' ')[0], lastName: userData.ownerName.split(' ')[1] || '', phone: '', businessName: userData.name, businessType: '', yearsInBusiness: '' } : undefined} onLogout={handleLogout} businessId={businessId} />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-center" />
        {authMode === 'login' ? (
          <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthMode('register')} />
        ) : (
          <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      {/* App Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-md mx-auto text-center relative">
          <h1 className="text-lg font-medium">NumeraAI</h1>
          <p className="text-xs text-muted-foreground">
            Intelligent Business Management
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        {renderContent()}
      </main>

      {/* Floating AI Button */}
      <button
        onClick={() => {
          setShowAI(!showAI);
          if (showAI) {
            setActiveTab('home');
          }
          setShowSocialMedia(false);
        }}
        className={`fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-50 ${
          showAI 
            ? 'bg-purple-600 hover:bg-purple-700 rotate-45' 
            : 'bg-purple-600 hover:bg-purple-700 hover:scale-110'
        }`}
        aria-label={showAI ? 'Close AI Coach' : 'Open AI Coach'}
      >
        <Bot className={`w-6 h-6 text-white transition-transform duration-300 ${showAI ? 'rotate-45' : ''}`} />
      </button>

      {/* Social Media FAB */}
      <button
        onClick={() => {
          setShowSocialMedia(!showSocialMedia);
          if (showSocialMedia) {
            setActiveTab('home');
          }
          setShowAI(false);
        }}
        className={`fixed right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-50 ${
          showSocialMedia 
            ? 'bg-[#00C4B4] hover:bg-[#00B3A6] rotate-45 bottom-40' 
            : 'bg-[#00C4B4] hover:bg-[#00B3A6] hover:scale-110 bottom-40'
        }`}
        style={{ 
          boxShadow: '0 4px 12px rgba(0, 196, 180, 0.3), 0 2px 4px rgba(0, 196, 180, 0.2)' 
        }}
        aria-label={showSocialMedia ? 'Close Social Media Generator' : 'Open Social Media Generator'}
      >
        <Sparkles className={`w-6 h-6 text-white transition-transform duration-300 ${showSocialMedia ? 'rotate-45' : ''}`} />
      </button>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setShowAI(false);
          setShowSocialMedia(false);
        }}
      />
    </div>
  );
}