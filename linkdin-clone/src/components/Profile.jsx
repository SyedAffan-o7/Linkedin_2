import { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';

const API_URL = 'http://localhost:5000/api';

function Profile({ profileId = 1, onBack }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/profiles/${profileId}`),
        fetch(`${API_URL}/profiles/${profileId}/posts`)
      ]);

      const profileData = await profileRes.json();
      const postsData = await postsRes.json();

      if (profileData.profile) {
        setProfile(profileData.profile);
        setEditForm(profileData.profile);
      }
      setPosts(postsData.posts || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          headline: editForm.headline,
          bio: editForm.bio,
          location: editForm.location,
          industry: editForm.industry,
          email: editForm.contactInfo?.email,
          website: editForm.contactInfo?.website
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type === 'profile' ? 'profilePicture' : 'coverPhoto', file);

    try {
      const endpoint = type === 'profile' 
        ? `${API_URL}/profiles/${profileId}` 
        : `${API_URL}/profiles/${profileId}/cover`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}/experience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          company: formData.get('company'),
          location: formData.get('location'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate') || null,
          current: formData.get('current') === 'on',
          description: formData.get('description')
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setShowAddExperience(false);
        e.target.reset();
      }
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const handleDeleteExperience = async (expId) => {
    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}/experience/${expId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}/education`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school: formData.get('school'),
          degree: formData.get('degree'),
          field: formData.get('field'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate') || null,
          description: formData.get('description')
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setShowAddEducation(false);
        e.target.reset();
      }
    } catch (error) {
      console.error('Error adding education:', error);
    }
  };

  const handleDeleteEducation = async (eduId) => {
    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}/education/${eduId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error deleting education:', error);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: newSkill.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({ ...prev, skills: data.skills }));
        setNewSkill('');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const handleDeleteSkill = async (skillName) => {
    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}/skills/${skillName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getImageUrl = (path) => {
    if (!path) return '/default-avatar.png';
    return path.startsWith('http') ? path : `http://localhost:5000${path}`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            Profile not found
            {onBack && (
              <button onClick={onBack} className="mt-4 text-blue-600 hover:underline block">
                ← Back to Feed
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Profile Content */}
          <div className="md:col-span-3">
            {/* Profile Header Card */}
            <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
              {/* Cover Photo */}
              <div 
                className="h-48 bg-gradient-to-r from-blue-600 to-blue-400 relative cursor-pointer group"
                onClick={() => coverInputRef.current?.click()}
              >
                {profile.coverPhoto && profile.coverPhoto !== '/uploads/default-cover.png' && (
                  <img 
                    src={getImageUrl(profile.coverPhoto)} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white font-medium">Change Cover Photo</span>
                </div>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={(e) => handlePhotoUpload(e, 'cover')}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Avatar */}
                  <div className="-mt-16 relative">
                    <div 
                      className="w-32 h-32 bg-gray-300 rounded-full border-4 border-white overflow-hidden cursor-pointer group relative"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img 
                        src={getImageUrl(profile.profilePicture)} 
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-xs text-center">Change<br/>Photo</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handlePhotoUpload(e, 'profile')}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Name & Headline */}
                  <div className="flex-1 pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {profile.firstName} {profile.lastName}
                        </h1>
                        <p className="text-gray-600 mt-1">{profile.headline}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {profile.location} {profile.industry && `• ${profile.industry}`}
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          {profile.connections?.toLocaleString()} connections • {profile.followers?.toLocaleString()} followers
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {onBack && (
                          <button 
                            onClick={onBack}
                            className="px-4 py-2 border border-gray-300 rounded-full font-medium hover:bg-gray-50"
                          >
                            Back to Feed
                          </button>
                        )}
                        <button 
                          onClick={() => setIsEditing(!isEditing)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700"
                        >
                          {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact & Social Links */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  {profile.contactInfo?.email && (
                    <a href={`mailto:${profile.contactInfo.email}`} className="text-blue-600 hover:underline">
                      📧 {profile.contactInfo.email}
                    </a>
                  )}
                  {profile.contactInfo?.website && (
                    <a href={profile.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      🌐 Website
                    </a>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      💼 LinkedIn
                    </a>
                  )}
                  {profile.socialLinks?.github && (
                    <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      🐙 GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            {isEditing && (
              <div className="bg-white rounded-lg shadow mb-4 p-6">
                <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={editForm.firstName || ''}
                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editForm.lastName || ''}
                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                    <input
                      type="text"
                      value={editForm.headline || ''}
                      onChange={(e) => setEditForm({...editForm, headline: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={editForm.bio || ''}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <input
                        type="text"
                        value={editForm.industry || ''}
                        onChange={(e) => setEditForm({...editForm, industry: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700">
                      Save Changes
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-full font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-4">
              <div className="flex border-b">
                {['posts', 'experience', 'education', 'skills'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 font-medium capitalize ${
                      activeTab === tab 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Posts Tab */}
                {activeTab === 'posts' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Posts</h3>
                    {posts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No posts yet</p>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <div key={post.id} className="border rounded-lg p-4">
                            <p className="text-gray-800 mb-2">{post.content}</p>
                            {post.images?.length > 0 && (
                              <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {post.images.map((img, idx) => (
                                  <img 
                                    key={idx} 
                                    src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                                    alt="" 
                                    className="w-full h-48 object-cover rounded"
                                  />
                                ))}
                              </div>
                            )}
                            {post.video && (
                              <video 
                                src={`http://localhost:5000${post.video}`}
                                controls 
                                className="w-full max-h-64 rounded"
                              />
                            )}
                            <div className="flex gap-4 mt-3 text-sm text-gray-500">
                              <span>{post.likes} likes</span>
                              <span>{post.comments} comments</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Experience Tab */}
                {activeTab === 'experience' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Experience</h3>
                      <button 
                        onClick={() => setShowAddExperience(!showAddExperience)}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        + Add Experience
                      </button>
                    </div>

                    {showAddExperience && (
                      <form onSubmit={handleAddExperience} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                        <input name="title" placeholder="Job Title" className="w-full border rounded px-3 py-2" required />
                        <input name="company" placeholder="Company" className="w-full border rounded px-3 py-2" required />
                        <input name="location" placeholder="Location" className="w-full border rounded px-3 py-2" />
                        <div className="grid grid-cols-2 gap-3">
                          <input name="startDate" type="date" className="w-full border rounded px-3 py-2" required />
                          <input name="endDate" type="date" className="w-full border rounded px-3 py-2" />
                        </div>
                        <label className="flex items-center gap-2">
                          <input name="current" type="checkbox" />
                          <span className="text-sm">I currently work here</span>
                        </label>
                        <textarea name="description" placeholder="Description" rows="2" className="w-full border rounded px-3 py-2" />
                        <div className="flex gap-2">
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm">Save</button>
                          <button type="button" onClick={() => setShowAddExperience(false)} className="px-4 py-2 border rounded-full text-sm">Cancel</button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-4">
                      {profile.experience?.map((exp) => (
                        <div key={exp.id} className="flex gap-4 p-4 border rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-2xl">💼</div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{exp.title}</h4>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-gray-500 text-sm">{exp.location}</p>
                            <p className="text-gray-500 text-sm">
                              {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                            </p>
                            <p className="text-gray-600 mt-2">{exp.description}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      {profile.experience?.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No experience added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Education</h3>
                      <button 
                        onClick={() => setShowAddEducation(!showAddEducation)}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        + Add Education
                      </button>
                    </div>

                    {showAddEducation && (
                      <form onSubmit={handleAddEducation} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                        <input name="school" placeholder="School/University" className="w-full border rounded px-3 py-2" required />
                        <input name="degree" placeholder="Degree" className="w-full border rounded px-3 py-2" required />
                        <input name="field" placeholder="Field of Study" className="w-full border rounded px-3 py-2" />
                        <div className="grid grid-cols-2 gap-3">
                          <input name="startDate" type="date" className="w-full border rounded px-3 py-2" required />
                          <input name="endDate" type="date" className="w-full border rounded px-3 py-2" />
                        </div>
                        <textarea name="description" placeholder="Description, activities, societies" rows="2" className="w-full border rounded px-3 py-2" />
                        <div className="flex gap-2">
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm">Save</button>
                          <button type="button" onClick={() => setShowAddEducation(false)} className="px-4 py-2 border rounded-full text-sm">Cancel</button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-4">
                      {profile.education?.map((edu) => (
                        <div key={edu.id} className="flex gap-4 p-4 border rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-2xl">🎓</div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{edu.school}</h4>
                            <p className="text-gray-600">{edu.degree}{edu.field && `, ${edu.field}`}</p>
                            <p className="text-gray-500 text-sm">
                              {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                            </p>
                            <p className="text-gray-600 mt-2">{edu.description}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      {profile.education?.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No education added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Skills</h3>
                    
                    <form onSubmit={handleAddSkill} className="flex gap-2 mb-6">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a new skill..."
                        className="flex-1 border rounded-lg px-3 py-2"
                      />
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700">
                        Add
                      </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                          <span className="font-medium">{skill.name}</span>
                          {skill.endorsements > 0 && (
                            <span className="text-gray-500 text-sm">• {skill.endorsements}</span>
                          )}
                          <button 
                            onClick={() => handleDeleteSkill(skill.name)}
                            className="text-gray-400 hover:text-red-500 ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    {profile.skills?.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No skills added yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden md:block space-y-4">
            {/* Bio Card */}
            {profile.bio && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-gray-600 text-sm">{profile.bio}</p>
              </div>
            )}

            {/* Profile Stats */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Profile Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Profile views</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Post impressions</span>
                  <span className="font-semibold">5,678</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Search appearances</span>
                  <span className="font-semibold">892</span>
                </div>
              </div>
            </div>

            {/* Similar Profiles */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">People also viewed</h3>
              <div className="space-y-3">
                {['Jane Smith', 'Mike Johnson', 'Sarah Williams'].map((name, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm hover:text-blue-600 cursor-pointer">{name}</p>
                      <p className="text-gray-500 text-xs">Software Engineer</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
