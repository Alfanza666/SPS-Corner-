import React, { useState } from 'react';
import { Landing } from './pages/Landing';
import { Shop } from './pages/Shop';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { User } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onNavigate={setCurrentPage} />;
      case 'shop':
        return <Shop onNavigate={setCurrentPage} />;
      case 'login':
        return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case 'dashboard':
        return user ? (
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
          />
        ) : (
          <Login onLogin={handleLogin} onNavigate={setCurrentPage} />
        );
      default:
        return <Landing onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      {renderPage()}
    </>
  );
};

export default App;