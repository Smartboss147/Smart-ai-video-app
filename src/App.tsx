import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Studio } from './components/Studio';
import { TemplatesView } from './components/TemplatesView';
import { UsageView } from './components/UsageView';
import { AuthModal } from './components/AuthModal';
import { User } from './types';

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('aethercut_token') || 'user_default_1');
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'studio' | 'templates' | 'usage'>(() => {
    return localStorage.getItem('aethercut_token') ? 'dashboard' : 'landing';
  });
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        // fallback default user
        setUser({
          id: 'user_default_1',
          email: 'creator@aethercut.ai',
          name: 'Aether Creator',
          credits: 150,
          storageUsedBytes: 1024 * 1024 * 25,
          storageLimitBytes: 1024 * 1024 * 1024 * 10,
          tier: 'pro',
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      setUser({
        id: 'user_default_1',
        email: 'creator@aethercut.ai',
        name: 'Aether Creator',
        credits: 150,
        storageUsedBytes: 1024 * 1024 * 25,
        storageLimitBytes: 1024 * 1024 * 1024 * 10,
        tier: 'pro',
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('aethercut_token', newToken);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('aethercut_token');
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        user={user}
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'studio') setActiveProjectId(undefined);
          setCurrentView(view);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenUsage={() => setCurrentView('usage')}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col">
        {currentView === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              if (user) {
                setCurrentView('dashboard');
              } else {
                setShowAuthModal(true);
              }
            }}
            onExploreTemplates={() => setCurrentView('templates')}
          />
        )}

        {currentView === 'dashboard' && user && (
          <Dashboard
            user={user}
            token={token}
            onOpenStudio={(id) => {
              setActiveProjectId(id);
              setCurrentView('studio');
            }}
          />
        )}

        {currentView === 'studio' && (
          <Studio
            token={token}
            projectId={activeProjectId}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'templates' && (
          <TemplatesView
            onSelectTemplate={(promptText) => {
              setActiveProjectId(undefined);
              setCurrentView('studio');
            }}
          />
        )}

        {currentView === 'usage' && user && (
          <UsageView
            user={user}
            token={token}
            onUserUpdate={(updated) => setUser(updated)}
          />
        )}
      </main>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
