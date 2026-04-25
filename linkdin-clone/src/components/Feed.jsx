import { useState, useEffect, useRef } from 'react';
import { 
  Bookmark, Users, Newspaper, Calendar, Video, Image as ImageIcon, FileText, Pencil, 
  Info, X, Trash2, ThumbsUp, MessageCircle, Share2, BarChart3, Puzzle, Zap, 
  Grid3X3, Music, ChevronDown, ChevronRight, Camera, Flame
} from 'lucide-react';
import Navbar from './Navbar';

const API_URL = 'http://localhost:5000/api';

// Helper: Returns full URL for media, supporting both Cloudinary (absolute) and local paths
const getMediaUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `http://localhost:5000${path}`;
};

// Image Carousel Component
function ImageCarousel({ images, postId }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative mt-3">
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={getMediaUrl(images[currentIndex])}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          className="w-full max-h-96 object-cover"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
            >
              ←
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </span>
      )}
    </div>
  );
}

function Feed({ onViewProfile }) {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: 'Demo',
    lastName: 'User',
    headline: 'Full Stack Developer',
    bio: '',
    location: '',
    industry: '',
    profilePicture: null
  });
  const [selectedProfilePic, setSelectedProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postFilter, setPostFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const profilePicInputRef = useRef(null);
  const postFileInputRef = useRef(null);

  // Fetch posts and profile on component mount
  useEffect(() => {
    fetchPosts();
    fetchProfile();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profiles/1`);
      const data = await response.json();
      if (data.profile) {
        setEditForm({
          firstName: data.profile.firstName || 'Demo',
          lastName: data.profile.lastName || 'User',
          headline: data.profile.headline || 'Full Stack Developer',
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          industry: data.profile.industry || '',
          profilePicture: data.profile.profilePicture
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`);
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }
    setSelectedFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setFilePreviewUrls(previews);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFilePreviewUrls(newPreviews);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const authorName = `${editForm.firstName} ${editForm.lastName}`;
    const authorTitle = editForm.headline || 'Member';

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('author', authorName);
      formData.append('authorTitle', authorTitle);
      formData.append('content', newPostContent);

      selectedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          formData.append('images', file);
        } else if (file.type.startsWith('video/')) {
          formData.append('video', file);
        }
      });

      const endpoint = selectedFiles.length > 0 ? `${API_URL}/posts/with-media` : `${API_URL}/posts`;
      const options = selectedFiles.length > 0 
        ? { method: 'POST', body: formData }
        : { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author: authorName,
              authorTitle: authorTitle,
              content: newPostContent,
            })
          };

      const response = await fetch(endpoint, options);

      if (response.ok) {
        const data = await response.json();
        setPosts([data.post, ...posts]);
        setNewPostContent('');
        setSelectedFiles([]);
        setFilePreviewUrls([]);
        if (postFileInputRef.current) postFileInputRef.current.value = '';
        setShowPostModal(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, likes: data.post.likes } : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Filter posts by date range
  const getFilteredPosts = () => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (postFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        return posts.filter(post => new Date(post.timestamp) >= filterDate);
      case '7days':
        filterDate.setDate(now.getDate() - 7);
        return posts.filter(post => new Date(post.timestamp) >= filterDate);
      case '30days':
        filterDate.setDate(now.getDate() - 30);
        return posts.filter(post => new Date(post.timestamp) >= filterDate);
      case '90days':
        filterDate.setDate(now.getDate() - 90);
        return posts.filter(post => new Date(post.timestamp) >= filterDate);
      case 'thisyear':
        filterDate.setMonth(0, 1);
        filterDate.setHours(0, 0, 0, 0);
        return posts.filter(post => new Date(post.timestamp) >= filterDate);
      case 'all':
      default:
        return posts;
    }
  };

  const filteredPosts = getFilteredPosts();

  const getFilterLabel = () => {
    switch (postFilter) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 days';
      case '30days': return 'Last 30 days';
      case '90days': return 'Last 90 days';
      case 'thisyear': return 'This year';
      case 'all': return 'All posts';
      default: return 'All posts';
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      let response;
      
      // If profile picture selected, use FormData
      if (selectedProfilePic) {
        const formData = new FormData();
        formData.append('profilePicture', selectedProfilePic);
        formData.append('firstName', editForm.firstName);
        formData.append('lastName', editForm.lastName);
        formData.append('headline', editForm.headline);
        formData.append('bio', editForm.bio);
        formData.append('location', editForm.location);
        formData.append('industry', editForm.industry);
        
        response = await fetch(`${API_URL}/profiles/1`, {
          method: 'PUT',
          body: formData
        });
      } else {
        // No picture - use JSON
        response = await fetch(`${API_URL}/profiles/1/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            headline: editForm.headline,
            bio: editForm.bio,
            location: editForm.location,
            industry: editForm.industry
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        // Update local state with new profile data
        if (data.profile) {
          setEditForm({
            firstName: data.profile.firstName || editForm.firstName,
            lastName: data.profile.lastName || editForm.lastName,
            headline: data.profile.headline || editForm.headline,
            bio: data.profile.bio || editForm.bio,
            location: data.profile.location || editForm.location,
            industry: data.profile.industry || editForm.industry,
            profilePicture: data.profile.profilePicture || editForm.profilePicture
          });
        }
        setShowEditModal(false);
        setSelectedProfilePic(null);
        setProfilePicPreview(null);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Column 1 - Left Sidebar */}
          <div className="hidden md:block space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-blue-600 to-blue-400"></div>
              <div className="px-4 pb-4">
                <div className="-mt-8 mb-3 cursor-pointer" onClick={() => onViewProfile?.(1)}>
                  <img 
                    src={getMediaUrl(editForm.profilePicture) || '/default-avatar.png'}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-4 border-white mx-auto hover:opacity-90 transition-opacity object-cover bg-gray-300"
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <h3 
                    className="text-center font-semibold text-gray-900 cursor-pointer hover:underline"
                    onClick={() => onViewProfile?.(1)}
                  >
                    {editForm.firstName} {editForm.lastName}
                  </h3>
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                    title="Edit Profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500">{editForm.headline}</p>
                
                {/* Profile Stats */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Profile viewers</span>
                    <span className="text-blue-600 font-semibold">9</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Post impressions</span>
                    <span className="text-blue-600 font-semibold">1,234</span>
                  </div>
                </div>
                
                {/* View Analytics */}
                <div className="mt-3 pt-3 border-t">
                  <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <BarChart3 className="w-4 h-4" /> View all analytics
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-2 space-y-1">
                {[
                  { icon: Bookmark, label: 'Saved items' },
                  { icon: Users, label: 'Groups' },
                  { icon: Newspaper, label: 'Newsletters' },
                  { icon: Calendar, label: 'Events' },
                ].map((item) => (
                  <button 
                    key={item.label}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Streak */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-gray-700">Streak</span>
                </div>
                <span className="text-xs text-gray-500">12 weeks</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 comment(s) posted this week</span>
                  <span>1/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '10%'}}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 post(s) published this week</span>
                  <span>0/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '0%'}}></div>
                </div>
              </div>
              <button className="mt-3 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                Weekly Timeline <Info className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Column 2 - Feed */}
          <div className="md:col-span-2">
            {/* Create Post - LinkedIn Style */}
            <div className="bg-white rounded-lg shadow mb-4 p-4">
              <div className="flex gap-3">
                <img 
                  src={getMediaUrl(editForm.profilePicture) || '/default-avatar.png'}
                  alt="Profile"
                  className="w-12 h-12 rounded-full flex-shrink-0 object-cover bg-gray-300"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <button
                  onClick={() => setShowPostModal(true)}
                  className="flex-1 text-left border border-gray-300 rounded-full px-4 py-3 text-gray-500 hover:bg-gray-100 transition-colors font-medium"
                >
                  Start a post
                </button>
              </div>
              <div className="flex justify-between mt-3 px-2">
                {[
                  { icon: Video, label: 'Video', color: 'text-green-600' },
                  { icon: ImageIcon, label: 'Photo', color: 'text-blue-600' },
                  { icon: FileText, label: 'Write article', color: 'text-orange-600' },
                ].map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => setShowPostModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium hidden sm:block">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By Bar */}
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="h-px bg-gray-300 flex-1 mr-4"></div>
              <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <span>Sort by:</span>
                <span className="font-semibold text-gray-900 flex items-center gap-1">Top <ChevronDown className="w-4 h-4" /></span>
              </button>
            </div>

            {/* Suggested for You - LinkedIn Style */}
            <div className="bg-white rounded-lg shadow mb-4 p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm text-gray-500">Suggested</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-start gap-3">
                <img 
                  src="/default-avatar.png" 
                  alt="Suggested User" 
                  className="w-12 h-12 rounded-full object-cover bg-gray-300"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Shoaib Qureshi</h4>
                  <p className="text-sm text-gray-500">3rd+</p>
                  <p className="text-sm text-gray-700 mt-1">
                    I Build E-commerce Stores That Convert Visitors Into Paying Customers...
                  </p>
                  <button className="mt-2 text-blue-600 font-semibold text-sm hover:underline">
                    View my services
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 border border-blue-600 text-blue-600 font-semibold py-1.5 px-4 rounded-full hover:bg-blue-50 transition-colors text-sm">
                  + Follow
                </button>
                <button className="flex-1 border border-gray-300 text-gray-600 font-semibold py-1.5 px-4 rounded-full hover:bg-gray-50 transition-colors text-sm">
                  Dismiss
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-semibold text-gray-700">
                {getFilterLabel()}
                <span className="text-gray-400 text-sm ml-2">({filteredPosts.length})</span>
              </h3>
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>Filter by</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      {[
                        { value: 'all', label: 'All posts' },
                        { value: 'today', label: 'Today' },
                        { value: '7days', label: 'Last 7 days' },
                        { value: '30days', label: 'Last 30 days' },
                        { value: '90days', label: 'Last 90 days' },
                        { value: 'thisyear', label: 'This year' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setPostFilter(option.value);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            postFilter === option.value 
                              ? 'bg-blue-50 text-blue-600 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            {postFilter === option.value && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Posts Feed */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                Loading posts...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                {postFilter === '30days' 
                  ? 'No posts in the last 30 days.' 
                  : 'No posts yet. Be the first to post!'}
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow mb-4">
                  {/* Post Header */}
                  <div className="p-4">
                    <div className="flex gap-3">
                      <img 
                        src={getMediaUrl(editForm.profilePicture) || '/default-avatar.png'}
                        alt="Profile"
                        className="w-12 h-12 rounded-full flex-shrink-0 cursor-pointer hover:opacity-90 object-cover bg-gray-300"
                        onClick={() => onViewProfile?.(1)}
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <div className="flex-1">
                        <h4 
                          className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => onViewProfile?.(1)}
                        >
                          {post.author}
                        </h4>
                        <p className="text-sm text-gray-500">{post.authorTitle}</p>
                        <p className="text-xs text-gray-400">{formatTimeAgo(post.timestamp)}</p>
                      </div>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <p className="mt-3 text-gray-800 leading-relaxed">
                      {post.content}
                    </p>

                    {/* Post Images - Carousel */}
                    {post.images && post.images.length > 0 && (
                      <ImageCarousel images={post.images} postId={post.id} />
                    )}

                    {/* Post Video */}
                    {post.video && (
                      <div className="mt-3">
                        <video
                          src={getMediaUrl(post.video)}
                          controls
                          className="w-full rounded-lg max-h-96"
                        />
                      </div>
                    )}
                  </div>

                  {/* Post Stats */}
                  <div className="px-4 py-2 border-t border-b flex items-center justify-between text-sm text-gray-500">
                    <span>{post.likes} likes</span>
                    <span>{post.comments} comments</span>
                  </div>

                  {/* Post Actions */}
                  <div className="p-2 flex">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 font-semibold"
                    >
                      <ThumbsUp className="w-5 h-5" /> Like
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 font-semibold">
                      <MessageCircle className="w-5 h-5" /> Comment
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 font-semibold">
                      <Share2 className="w-5 h-5" /> Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3 - Right Sidebar */}
          <div className="hidden md:block space-y-4">
            {/* LinkedIn News */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">LinkedIn News</h3>
                <button className="text-gray-400 hover:text-gray-600 text-sm"><Info className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Meta lays off 6K staffers to operate "more efficiently"', readers: '28,524 readers', time: '17h ago' },
                  { title: 'India asks citizens to not travel to Iran', readers: '1,299 readers', time: '1d ago' },
                  { title: 'Global varsities plan faculty hiring push in...', readers: '950 readers', time: '1d ago' },
                  { title: 'Indian pharma targets more global markets', readers: '759 readers', time: '1d ago' },
                  { title: 'Luxury retail breaks out of metros to...', readers: '582 readers', time: '1d ago' },
                ].map((news, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1.5">•</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 leading-tight">
                          {news.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {news.time} • {news.readers}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-2 font-medium">
                  Show more news <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Today's Puzzles */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Today's puzzles</h3>
              <div className="space-y-3">
                {[
                  { name: 'Patches #39', desc: 'Piece it together', icon: Puzzle, color: 'bg-blue-100' },
                  { name: 'Zip #404', desc: '2 connections played', icon: Zap, color: 'bg-orange-100' },
                  { name: 'Mini Sudoku #257', desc: 'The classic game, made mini', icon: Grid3X3, color: 'bg-green-100' },
                  { name: 'Tango #665', desc: 'Harmonize the grid', icon: Music, color: 'bg-pink-100' },
                ].map((puzzle) => (
                  <button key={puzzle.name} className="w-full flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className={`w-10 h-10 ${puzzle.color} rounded-lg flex items-center justify-center`}>
                      <puzzle.icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-gray-900">{puzzle.name}</p>
                      <p className="text-xs text-gray-500">{puzzle.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-2 font-medium">
                Show more <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Premium Promo */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ad</p>
                  <p className="text-sm text-gray-700">
                    Premium subscribers get up to <strong>13x more profile views</strong> on average
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full" />
                <p className="text-sm text-gray-700 font-medium">More profile views means more opportunities</p>
              </div>
              <button className="mt-3 w-full border-2 border-yellow-600 text-yellow-700 font-semibold py-2 rounded-full hover:bg-yellow-50 transition-colors text-sm">
                Try Premium for $0
              </button>
            </div>

            {/* Trending */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Trending Now</h3>
              <div className="space-y-3">
                {[
                  { tag: '#Hiring', count: '12.5K posts' },
                  { tag: '#RemoteWork', count: '8.2K posts' },
                  { tag: '#AI', count: '45.1K posts' },
                ].map((trend) => (
                  <div key={trend.tag} className="cursor-pointer hover:bg-gray-50 p-2 rounded -mx-2">
                    <p className="text-sm font-semibold text-blue-600">{trend.tag}</p>
                    <p className="text-xs text-gray-500">{trend.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            <div className="text-xs text-gray-500 text-center px-4">
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-2">
                <a href="#" className="hover:underline">About</a>
                <a href="#" className="hover:underline">Accessibility</a>
                <a href="#" className="hover:underline">Help Center</a>
                <a href="#" className="hover:underline">Privacy & Terms</a>
                <a href="#" className="hover:underline">Ad Choices</a>
                <a href="#" className="hover:underline">Advertising</a>
                <a href="#" className="hover:underline">Business Services</a>
                <a href="#" className="hover:underline">Get the LinkedIn app</a>
                <a href="#" className="hover:underline">More</a>
              </div>
              <p className="flex items-center justify-center gap-1">
                <span className="font-bold text-gray-700">LinkedIn</span> 2024
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProfilePic(null);
                    setProfilePicPreview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditProfile} className="space-y-4">
                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center mb-4">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => profilePicInputRef.current?.click()}
                  >
                    <img
                      src={profilePicPreview || getMediaUrl(editForm.profilePicture) || '/default-avatar.png'}
                      alt="Profile Preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">Change</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={profilePicInputRef}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedProfilePic(file);
                        setProfilePicPreview(URL.createObjectURL(file));
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 mt-2">Click to change profile picture</p>
                  {selectedProfilePic && (
                    <p className="text-xs text-blue-600 mt-1">New image selected: {selectedProfilePic.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <input
                    type="text"
                    value={editForm.headline}
                    onChange={(e) => setEditForm({...editForm, headline: e.target.value})}
                    placeholder="e.g., Software Engineer at Google"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      placeholder="e.g., San Francisco, CA"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={editForm.industry}
                      onChange={(e) => setEditForm({...editForm, industry: e.target.value})}
                      placeholder="e.g., Technology"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create a post</h2>
                <button 
                  onClick={() => {
                    setShowPostModal(false);
                    setNewPostContent('');
                    setSelectedFiles([]);
                    setFilePreviewUrls([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Editor */}
                <form onSubmit={handleCreatePost} className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={getMediaUrl(editForm.profilePicture) || '/default-avatar.png'}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover bg-gray-300"
                      onError={(e) => { e.target.src = '/default-avatar.png'; }}
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{editForm.firstName} {editForm.lastName}</h4>
                      <p className="text-sm text-gray-500">{editForm.headline || 'Post to Anyone'}</p>
                    </div>
                  </div>

                  {/* Text Area */}
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What do you want to talk about?"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-blue-500 min-h-[120px]"
                    rows="4"
                    autoFocus
                  />

                  {/* Selected Files Thumbnails */}
                  {filePreviewUrls.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-2">Selected media:</p>
                      <div className={`grid gap-2 ${filePreviewUrls.length === 1 ? 'grid-cols-1' : filePreviewUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {filePreviewUrls.map((url, index) => (
                          <div key={index} className="relative">
                            {selectedFiles[index]?.type?.startsWith('video/') ? (
                              <video src={url} className="w-full h-24 object-cover rounded-lg" />
                            ) : (
                              <img src={url} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Media Button */}
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      ref={postFileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      id="post-file-input"
                    />
                    <label
                      htmlFor="post-file-input"
                      className="flex items-center gap-2 text-gray-500 hover:bg-gray-100 px-3 py-2 rounded cursor-pointer"
                    >
                      <span className="text-blue-500 text-xl">📷</span>
                      <span className="text-sm">Media</span>
                      {selectedFiles.length > 0 && (
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {selectedFiles.length}
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPostModal(false);
                        setNewPostContent('');
                        setSelectedFiles([]);
                        setFilePreviewUrls([]);
                      }}
                      className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-full"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newPostContent.trim() || isSubmitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </form>

                {/* Right Side - Preview */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-2">Post Preview</h3>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getMediaUrl(editForm.profilePicture) || '/default-avatar.png'}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover bg-gray-300"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{editForm.firstName} {editForm.lastName}</h4>
                        <p className="text-sm text-gray-500">{editForm.headline || 'Post to Anyone'}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2">{newPostContent}</p>
                    {filePreviewUrls.length > 0 && (
                      <div className="mt-4">
                        <div className={`grid gap-2 ${filePreviewUrls.length === 1 ? 'grid-cols-1' : filePreviewUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {filePreviewUrls.map((url, index) => (
                            <div key={index} className="relative">
                              {selectedFiles[index]?.type?.startsWith('video/') ? (
                                <video src={url} className="w-full h-32 object-cover rounded-lg" />
                              ) : (
                                <img src={url} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feed;