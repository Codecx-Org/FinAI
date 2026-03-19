import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { SalesTracker } from './components/SalesTracker';
import { AICoach } from './components/AICoach';
import { InventoryManager } from './components/InventoryManager';
import { BusinessInsights } from './components/BusinessInsights';
import { UserProfile } from './components/UserProfile';
import { SocialMediaGenerator } from './components/SocialMediaGenerator';
import { BusinessOnboarding } from './components/BusinessOnboarding';
import { BottomNavigation } from './components/BottomNavigation';
import { Toaster } from 'sonner';

export type Tab = 'home' | 'sales' | 'inventory' | 'insights' | 'profile';

interface UserData {
  id?: number;
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  businessId?: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAI, setShowAI] = useState(false);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(() => {
    // Load onboarding status from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('numeraai_onboarded');
      return saved === 'true';
    }
    return false;
  });
  const [userData, setUserData] = useState<UserData | null>(() => {
    // Load user data from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('numeraai_userdata');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      }
    }
    return null;
  });

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data);
    setIsOnboarded(true);
    setActiveTab('profile'); // Start with profile page after onboarding
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('numeraai_onboarded', 'true');
      localStorage.setItem('numeraai_userdata', JSON.stringify(data));
    }
  };

  // Development helper - reset onboarding (you can remove this in production)
  const resetOnboarding = () => {
    setIsOnboarded(false);
    setUserData(null);
    setActiveTab('home');
    setShowAI(false);
    setShowSocialMedia(false);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('numeraai_onboarded');
      localStorage.removeItem('numeraai_userdata');
      localStorage.removeItem('numeraai_goals'); // Clear goals too
    }
  };

  const handleLogout = () => {
    resetOnboarding();
  };

  const renderContent = () => {
    const businessId = userData?.businessId;
    
    if (showSocialMedia) {
      return <SocialMediaGenerator onBack={() => setShowSocialMedia(false)} />;
    }
    
    if (showAI) {
      return <AICoach />;
    }
    
    switch (activeTab) {
      case 'home':
        return <Dashboard userData={userData || undefined} businessId={businessId} />;
      case 'sales':
        return <SalesTracker businessId={businessId} />;
      case 'inventory':
        return <InventoryManager businessId={businessId} />;
      case 'insights':
        return <BusinessInsights businessId={businessId} />;
      case 'profile':
        return <UserProfile initialUserData={userData || undefined} onLogout={handleLogout} businessId={businessId} />;
      default:
        return <Dashboard />;
    }
  };

  // Show onboarding if not completed
  if (!isOnboarded) {
    return <BusinessOnboarding onComplete={handleOnboardingComplete} />;
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
          {/* Development helper - triple tap to reset */}
          <div 
            className="absolute top-0 right-0 w-8 h-8 opacity-0"
            onClick={(e) => {
              if (e.detail === 3) resetOnboarding();
            }}
          />
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