import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ThumbsUp, MessageCircle, Share2, MoreHorizontal,
  Send, Bookmark, X, Trash2, Link as LinkIcon, Check
} from 'lucide-react';
import Navbar from './Navbar';

const API_URL = 'http://localhost:5000/api';

const getMediaUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `http://localhost:5000${path}`;
};

// Image Carousel Component (reused from Feed)
function ImageCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative mt-4">
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={getMediaUrl(images[currentIndex])}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          className="w-full max-h-[500px] object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"
            >
              ←
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"
            >
              →
            </button>
          </>
        )}
      </div>

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

      {images.length > 1 && (
        <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </span>
      )}
    </div>
  );
}

function PostDetail({ postId, user }) {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Post not found');
        } else {
          setError('Failed to load post');
        }
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setPost(data.post);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Error loading post');
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id || '' }
      });

      if (response.ok) {
        const data = await response.json();
        setPost({ ...post, likes: data.post.likes });
        setLiked(true);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' }
      });

      if (response.ok) {
        navigate('/');
      } else {
        alert('Failed to delete post - not yours or not found');
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
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  const formatFullDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3f2ef]">
        <Navbar user={user} />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading post...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#f3f2ef]">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">{error || 'Post not found'}</p>
            <button 
              onClick={() => navigate('/')}
              className="text-blue-600 font-semibold hover:underline"
            >
              ← Back to feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnPost = user && post.user_id === user.id;

  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <Navbar user={user} />
      
      <div className="max-w-4xl mx-auto p-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to feed
        </button>

        {/* Post Card */}
        <div className="bg-white rounded-lg shadow">
          {/* Post Header */}
          <div className="p-4 sm:p-6">
            <div className="flex gap-3 sm:gap-4">
              <img 
                src={getMediaUrl(post.authorImage) || '/default-avatar.png'}
                alt={post.author}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 object-cover bg-gray-300 cursor-pointer"
                onError={(e) => { e.target.src = '/default-avatar.png'; }}
              />
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-gray-900 text-lg hover:text-blue-600 cursor-pointer truncate">
                  {post.author}
                </h1>
                <p className="text-sm text-gray-500">{post.authorTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatFullDate(post.timestamp)} • {formatTimeAgo(post.timestamp)}
                </p>
              </div>
              
              {/* Actions Menu */}
              <div className="flex items-start gap-2">
                {isOwnPost && (
                  <button
                    onClick={handleDeletePost}
                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Post Content */}
            <div className="mt-4">
              <p className="text-gray-800 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <ImageCarousel images={post.images} />
            )}

            {/* Post Video */}
            {post.video && (
              <div className="mt-4">
                <video
                  src={getMediaUrl(post.video)}
                  controls
                  className="w-full rounded-lg max-h-[500px]"
                />
              </div>
            )}
          </div>

          {/* Post Stats */}
          <div className="px-4 sm:px-6 py-3 border-t border-b flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="bg-blue-100 text-blue-600 rounded-full p-1">
                <ThumbsUp className="w-3 h-3" />
              </span>
              <span>{post.likes} likes</span>
            </div>
            <div className="flex gap-4">
              <span>{post.comments} comments</span>
              <span>{post.shares || 0} reposts</span>
            </div>
          </div>

          {/* Post Actions */}
          <div className="px-2 py-1 flex">
            <button
              onClick={handleLike}
              className={`flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 rounded font-semibold transition-colors ${
                liked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} /> 
              {liked ? 'Liked' : 'Like'}
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 font-semibold">
              <MessageCircle className="w-5 h-5" /> Comment
            </button>
            <button 
              onClick={() => {
                setShowShareModal(true);
                setShareCopied(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 font-semibold"
            >
              <Share2 className="w-5 h-5" /> Share
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 font-semibold">
              <Send className="w-5 h-5" /> Send
            </button>
            <button className="hidden sm:flex flex-1 items-center justify-center gap-2 py-3 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 font-semibold">
              <Bookmark className="w-5 h-5" /> Save
            </button>
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-3">
              <img 
                src={getMediaUrl(user?.profilePicture) || '/default-avatar.png'}
                alt="You"
                className="w-10 h-10 rounded-full object-cover bg-gray-300"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full border border-gray-300 rounded-full px-4 py-2 pr-12 focus:outline-none focus:border-blue-500"
                />
                <button 
                  disabled={!commentText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 disabled:text-gray-400 font-semibold text-sm px-2"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-4 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Comments ({post.comments})</h2>
          {post.comments === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            <p className="text-gray-500 text-center py-8">Comments coming soon...</p>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Share</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Copy Link */}
              <button
                onClick={() => {
                  const postUrl = `${window.location.origin}/post/${postId}`;
                  navigator.clipboard.writeText(postUrl);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {shareCopied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <LinkIcon className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <span className="font-medium text-gray-700">
                  {shareCopied ? 'Link copied!' : 'Copy link'}
                </span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => {
                  const postUrl = `${window.location.origin}/post/${postId}`;
                  const text = encodeURIComponent(`Check out this post: ${postUrl}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.241-.579-.486-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-700">WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostDetail;
