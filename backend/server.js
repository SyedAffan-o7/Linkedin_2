import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG, GIF, WEBP) and videos (MP4, WEBM, MOV) are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// In-memory storage for posts
let posts = [
  {
    id: 1,
    author: 'John Doe',
    authorTitle: 'Software Engineer at Google',
    content: 'Just started working on a new React project! Excited to build something amazing. 🚀',
    images: ['https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'],
    video: null,
    likes: 42,
    comments: 5,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    author: 'Jane Smith',
    authorTitle: 'Product Manager at Microsoft',
    content: 'Check out this amazing product demo! 📊',
    images: [
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
      'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?w=800'
    ],
    video: null,
    likes: 28,
    comments: 3,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Get all posts
app.get('/api/posts', (req, res) => {
  res.json({ posts: posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) });
});

// Create a new post (text only)
app.post('/api/posts', (req, res) => {
  const { author, authorTitle, content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  const newPost = {
    id: posts.length + 1,
    author: author || 'Anonymous User',
    authorTitle: authorTitle || 'Member',
    content: content.trim(),
    images: [],
    video: null,
    likes: 0,
    comments: 0,
    timestamp: new Date().toISOString(),
  };

  posts.push(newPost);
  res.status(201).json({ post: newPost });
});

// Create a post with media (multipart/form-data)
app.post('/api/posts/with-media', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  const { author, authorTitle, content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required' });
  }

  const images = req.files?.images ? req.files.images.map(file => `/uploads/${file.filename}`) : [];
  const video = req.files?.video ? `/uploads/${req.files.video[0].filename}` : null;

  const newPost = {
    id: posts.length + 1,
    author: author || 'Anonymous User',
    authorTitle: authorTitle || 'Member',
    content: content.trim(),
    images,
    video,
    likes: 0,
    comments: 0,
    timestamp: new Date().toISOString(),
  };

  posts.push(newPost);
  res.status(201).json({ post: newPost });
});

// Like a post
app.post('/api/posts/:id/like', (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  post.likes += 1;
  res.json({ post });
});

// Delete a post
app.delete('/api/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const index = posts.findIndex(p => p.id === postId);

  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(index, 1);
  res.json({ message: 'Post deleted successfully' });
});

// ==========================================
// PROFILE ROUTES
// ==========================================

// In-memory profile storage
let profiles = [
  {
    id: 1,
    userId: 1,
    firstName: 'John',
    lastName: 'Doe',
    headline: 'Software Engineer at Google',
    bio: 'Passionate software engineer with 5+ years of experience in full-stack development. Love building scalable web applications and exploring new technologies.',
    location: 'San Francisco Bay Area',
    industry: 'Technology',
    profilePicture: '/uploads/default-avatar.png',
    coverPhoto: '/uploads/default-cover.png',
    contactInfo: {
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      website: 'https://johndoe.dev'
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      twitter: 'https://twitter.com/johndoe'
    },
    experience: [
      {
        id: 1,
        title: 'Software Engineer',
        company: 'Google',
        location: 'Mountain View, CA',
        startDate: '2022-01-15',
        endDate: null,
        current: true,
        description: 'Working on Google Cloud Platform, building scalable infrastructure solutions.'
      },
      {
        id: 2,
        title: 'Full Stack Developer',
        company: 'Microsoft',
        location: 'Seattle, WA',
        startDate: '2019-06-01',
        endDate: '2021-12-20',
        current: false,
        description: 'Developed web applications using React, Node.js, and Azure cloud services.'
      }
    ],
    education: [
      {
        id: 1,
        school: 'Stanford University',
        degree: 'Master of Science',
        field: 'Computer Science',
        startDate: '2017-09-01',
        endDate: '2019-05-30',
        description: 'Specialized in Artificial Intelligence and Machine Learning'
      },
      {
        id: 2,
        school: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Engineering',
        startDate: '2013-08-15',
        endDate: '2017-05-20',
        description: 'Dean\'s List, GPA 3.9/4.0'
      }
    ],
    skills: [
      { name: 'JavaScript', endorsements: 45 },
      { name: 'React', endorsements: 38 },
      { name: 'Node.js', endorsements: 32 },
      { name: 'Python', endorsements: 28 },
      { name: 'Google Cloud', endorsements: 25 },
      { name: 'TypeScript', endorsements: 22 },
      { name: 'Docker', endorsements: 18 },
      { name: 'Kubernetes', endorsements: 15 }
    ],
    connections: 2847,
    followers: 5234,
    following: 892,
    createdAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Get all profiles
app.get('/api/profiles', (req, res) => {
  res.json({ profiles });
});

// Get profile by ID
app.get('/api/profiles/:id', (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json({ profile });
});

// Get profile by user ID
app.get('/api/profiles/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const profile = profiles.find(p => p.userId === userId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json({ profile });
});

// Create new profile
app.post('/api/profiles', upload.single('profilePicture'), (req, res) => {
  const {
    userId,
    firstName,
    lastName,
    headline,
    bio,
    location,
    industry,
    email,
    phone,
    website,
    linkedin,
    github,
    twitter
  } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  const newProfile = {
    id: profiles.length + 1,
    userId: userId ? parseInt(userId) : profiles.length + 1,
    firstName,
    lastName,
    headline: headline || '',
    bio: bio || '',
    location: location || '',
    industry: industry || '',
    profilePicture: req.file ? `/uploads/${req.file.filename}` : '/uploads/default-avatar.png',
    coverPhoto: '/uploads/default-cover.png',
    contactInfo: {
      email: email || '',
      phone: phone || '',
      website: website || ''
    },
    socialLinks: {
      linkedin: linkedin || '',
      github: github || '',
      twitter: twitter || ''
    },
    experience: [],
    education: [],
    skills: [],
    connections: 0,
    followers: 0,
    following: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  profiles.push(newProfile);
  res.status(201).json({ profile: newProfile });
});

// Update profile
app.put('/api/profiles/:id', upload.single('profilePicture'), (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const {
    firstName,
    lastName,
    headline,
    bio,
    location,
    industry,
    email,
    phone,
    website,
    linkedin,
    github,
    twitter
  } = req.body;

  if (firstName) profile.firstName = firstName;
  if (lastName) profile.lastName = lastName;
  if (headline !== undefined) profile.headline = headline;
  if (bio !== undefined) profile.bio = bio;
  if (location !== undefined) profile.location = location;
  if (industry !== undefined) profile.industry = industry;
  if (email !== undefined) profile.contactInfo.email = email;
  if (phone !== undefined) profile.contactInfo.phone = phone;
  if (website !== undefined) profile.contactInfo.website = website;
  if (linkedin !== undefined) profile.socialLinks.linkedin = linkedin;
  if (github !== undefined) profile.socialLinks.github = github;
  if (twitter !== undefined) profile.socialLinks.twitter = twitter;
  if (req.file) profile.profilePicture = `/uploads/${req.file.filename}`;

  profile.updatedAt = new Date().toISOString();

  res.json({ profile });
});

// Update profile via JSON (no file upload)
app.post('/api/profiles/:id/update', express.json(), (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const {
    firstName,
    lastName,
    headline,
    bio,
    location,
    industry
  } = req.body;

  if (firstName !== undefined) profile.firstName = firstName;
  if (lastName !== undefined) profile.lastName = lastName;
  if (headline !== undefined) profile.headline = headline;
  if (bio !== undefined) profile.bio = bio;
  if (location !== undefined) profile.location = location;
  if (industry !== undefined) profile.industry = industry;

  profile.updatedAt = new Date().toISOString();

  res.json({ profile });
});

// Update cover photo
app.put('/api/profiles/:id/cover', upload.single('coverPhoto'), (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Cover photo is required' });
  }

  profile.coverPhoto = `/uploads/${req.file.filename}`;
  profile.updatedAt = new Date().toISOString();

  res.json({ profile });
});

// Add experience
app.post('/api/profiles/:id/experience', (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const { title, company, location, startDate, endDate, current, description } = req.body;

  if (!title || !company) {
    return res.status(400).json({ error: 'Title and company are required' });
  }

  const newExperience = {
    id: profile.experience.length + 1,
    title,
    company,
    location: location || '',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || null,
    current: current || false,
    description: description || ''
  };

  profile.experience.push(newExperience);
  profile.updatedAt = new Date().toISOString();

  res.status(201).json({ experience: newExperience, profile });
});

// Delete experience
app.delete('/api/profiles/:profileId/experience/:expId', (req, res) => {
  const profileId = parseInt(req.params.profileId);
  const expId = parseInt(req.params.expId);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const expIndex = profile.experience.findIndex(e => e.id === expId);
  if (expIndex === -1) {
    return res.status(404).json({ error: 'Experience not found' });
  }

  profile.experience.splice(expIndex, 1);
  profile.updatedAt = new Date().toISOString();

  res.json({ message: 'Experience deleted successfully', profile });
});

// Add education
app.post('/api/profiles/:id/education', (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const { school, degree, field, startDate, endDate, description } = req.body;

  if (!school || !degree) {
    return res.status(400).json({ error: 'School and degree are required' });
  }

  const newEducation = {
    id: profile.education.length + 1,
    school,
    degree,
    field: field || '',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || null,
    description: description || ''
  };

  profile.education.push(newEducation);
  profile.updatedAt = new Date().toISOString();

  res.status(201).json({ education: newEducation, profile });
});

// Delete education
app.delete('/api/profiles/:profileId/education/:eduId', (req, res) => {
  const profileId = parseInt(req.params.profileId);
  const eduId = parseInt(req.params.eduId);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const eduIndex = profile.education.findIndex(e => e.id === eduId);
  if (eduIndex === -1) {
    return res.status(404).json({ error: 'Education not found' });
  }

  profile.education.splice(eduIndex, 1);
  profile.updatedAt = new Date().toISOString();

  res.json({ message: 'Education deleted successfully', profile });
});

// Add skill
app.post('/api/profiles/:id/skills', (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const { skill } = req.body;

  if (!skill) {
    return res.status(400).json({ error: 'Skill name is required' });
  }

  const existingSkill = profile.skills.find(s => s.name.toLowerCase() === skill.toLowerCase());
  if (existingSkill) {
    return res.status(400).json({ error: 'Skill already exists' });
  }

  profile.skills.push({ name: skill, endorsements: 0 });
  profile.updatedAt = new Date().toISOString();

  res.status(201).json({ skills: profile.skills, profile });
});

// Delete skill
app.delete('/api/profiles/:profileId/skills/:skillName', (req, res) => {
  const profileId = parseInt(req.params.profileId);
  const skillName = req.params.skillName;
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const skillIndex = profile.skills.findIndex(s => s.name.toLowerCase() === skillName.toLowerCase());
  if (skillIndex === -1) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  profile.skills.splice(skillIndex, 1);
  profile.updatedAt = new Date().toISOString();

  res.json({ message: 'Skill deleted successfully', profile });
});

// Get posts by user (for profile page)
app.get('/api/profiles/:id/posts', (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const userPosts = posts.filter(p => p.author === `${profile.firstName} ${profile.lastName}`);
  res.json({ posts: userPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'LinkedIn Clone API is running',
    endpoints: {
      posts: {
        getPosts: 'GET /api/posts',
        createPost: 'POST /api/posts (text only)',
        createPostWithMedia: 'POST /api/posts/with-media (multipart/form-data)',
        likePost: 'POST /api/posts/:id/like',
        deletePost: 'DELETE /api/posts/:id'
      },
      profiles: {
        getAllProfiles: 'GET /api/profiles',
        getProfile: 'GET /api/profiles/:id',
        getProfileByUser: 'GET /api/profiles/user/:userId',
        createProfile: 'POST /api/profiles',
        updateProfile: 'PUT /api/profiles/:id',
        updateCover: 'PUT /api/profiles/:id/cover',
        addExperience: 'POST /api/profiles/:id/experience',
        deleteExperience: 'DELETE /api/profiles/:profileId/experience/:expId',
        addEducation: 'POST /api/profiles/:id/education',
        deleteEducation: 'DELETE /api/profiles/:profileId/education/:eduId',
        addSkill: 'POST /api/profiles/:id/skills',
        deleteSkill: 'DELETE /api/profiles/:profileId/skills/:skillName',
        getProfilePosts: 'GET /api/profiles/:id/posts',
        updateProfileJSON: 'POST /api/profiles/:id/update'
      }
    },
    features: ['Text posts', 'Multiple image uploads (carousel)', 'Video uploads', 'Like posts', 'Complete Profile System']
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
