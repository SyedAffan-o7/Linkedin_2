import { useState } from 'react'
import './App.css'
import Feed from './components/Feed'
import Profile from './components/Profile'

function App() {
  const [currentView, setCurrentView] = useState('feed')
  const [selectedProfileId, setSelectedProfileId] = useState(null)

  const navigateToProfile = (profileId = 1) => {
    setSelectedProfileId(profileId)
    setCurrentView('profile')
  }

  const navigateToFeed = () => {
    setCurrentView('feed')
    setSelectedProfileId(null)
  }

  return (
    <>
      {currentView === 'feed' ? (
        <Feed onViewProfile={navigateToProfile} />
      ) : (
        <Profile profileId={selectedProfileId} onBack={navigateToFeed} />
      )}
    </>
  )
}

export default App
