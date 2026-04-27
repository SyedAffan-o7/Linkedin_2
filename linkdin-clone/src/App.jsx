import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import './App.css'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Login from './components/Login'
import PostDetail from './components/PostDetail'

// Wrapper component for post detail that passes user prop
function PostDetailWrapper({ user }) {
  const { id } = useParams()
  return <PostDetail postId={id} user={user} />
}

function AppContent() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  // Show login if no user
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Routes>
      <Route path="/" element={<Feed user={user} onLogout={handleLogout} />} />
      <Route path="/post/:id" element={<PostDetailWrapper user={user} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
