import { useState, useEffect } from 'react'
import './App.css'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Login from './components/Login'

function App() {
  const [currentView, setCurrentView] = useState('feed')
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [user, setUser] = useState(null)

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('feed');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('feed');
  };

  const navigateToProfile = (profileId = 1) => {
    setSelectedProfileId(profileId)
    setCurrentView('profile')
  }

  const navigateToFeed = () => {
    setCurrentView('feed')
    setSelectedProfileId(null)
  }

  // Show login if no user
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      {currentView === 'feed' ? (
        <Feed 
          onViewProfile={navigateToProfile} 
          user={user}
          onLogout={handleLogout}
        />
      ) : (
        <Profile 
          profileId={selectedProfileId} 
          onBack={navigateToFeed}
          user={user}
        />
      )}
    </>
  )
}

export default App
