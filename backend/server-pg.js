import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';
import { upload, cloudinary } from './cloudinary-config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helpers: map DB row (snake_case) to API response (camelCase)
const mapPost = (r) => ({
  id: r.id,
  author: r.author,
  authorTitle: r.author_title,
  content: r.content,
  images: r.images || [],
  video: r.video,
  likes: r.likes,
  comments: r.comments,
  timestamp: r.timestamp,
});

const mapProfile = (r) => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  headline: r.headline,
  bio: r.bio,
  location: r.location,
  industry: r.industry,
  profilePicture: r.profile_picture,
  coverPhoto: r.cover_photo,
  contactInfo: r.contact_info || {},
  socialLinks: r.social_links || {},
  experience: r.experience || [],
  education: r.education || [],
  skills: r.skills || [],
  connections: r.connections,
  followers: r.followers,
  following: r.following,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Simple auth middleware - expects userId in header
const requireAuth = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - Login required' });
  }
  
  // Verify user exists
  const { rows } = await query('SELECT * FROM profiles WHERE id = $1', [userId]);
  if (!rows[0]) {
    return res.status(401).json({ error: 'Invalid user' });
  }
  
  req.user = mapProfile(rows[0]);
  next();
};

// =========================================
// AUTH
// =========================================

app.post('/api/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password required' });
    }
    
    const { rows } = await query('SELECT * FROM profiles WHERE name = $1 AND password = $2', [name, password]);
    if (!rows[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ user: mapProfile(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================
// POSTS (User-specific)
// =========================================

// Get current user's posts only
app.get('/api/posts', requireAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM posts WHERE user_id = $1 ORDER BY timestamp DESC', [req.user.id]);
    res.json({ posts: rows.map(mapPost) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    const { rows } = await query(
      `INSERT INTO posts (user_id, author, author_title, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, req.user.name, req.user.headline || 'Member', content.trim()]
    );
    res.status(201).json({ post: mapPost(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/with-media', requireAuth, (req, res, next) => {
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: err.message || 'Upload failed', details: err.toString() });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    const images = req.files?.images ? req.files.images.map(f => f.path) : [];
    const video = req.files?.video ? req.files.video[0].path : null;

    const { rows } = await query(
      `INSERT INTO posts (user_id, author, author_title, content, images, video)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING *`,
      [req.user.id, req.user.name, req.user.headline || 'Member', content.trim(), JSON.stringify(images), video]
    );
    res.status(201).json({ post: mapPost(rows[0]) });
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: mapPost(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
  try {
    // Only allow liking own posts
    const { rows } = await query(
      `UPDATE posts SET likes = likes + 1 WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found or not yours' });
    res.json({ post: mapPost(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Post not found or not yours' });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================
// PROFILES (User-specific)
// =========================================

// Get current user's profile
app.get('/api/profiles/me', requireAuth, async (req, res) => {
  try {
    res.json({ profile: req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update current user's profile
app.put('/api/profiles/me', requireAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    const p = req.user;
    const { name, headline, bio, location, industry } = req.body;

    const profilePicture = req.file ? req.file.path : p.profilePicture;

    const { rows } = await query(
      `UPDATE profiles SET
        name = $1, headline = $2, bio = $3, location = $4, industry = $5,
        profile_picture = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [
        name !== undefined ? name : p.name,
        headline !== undefined ? headline : p.headline,
        bio !== undefined ? bio : p.bio,
        location !== undefined ? location : p.location,
        industry !== undefined ? industry : p.industry,
        profilePicture,
        req.user.id
      ]
    );
    res.json({ profile: mapProfile(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all profiles (if needed)
app.get('/api/profiles', requireAuth, async (req, res) => {
  try {
    // Only return own profile for now
    res.json({ profiles: [req.user] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles/:id/update', async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Profile not found' });

    const p = mapProfile(existing[0]);
    const { firstName, lastName, headline, bio, location, industry } = req.body;

    const { rows } = await query(
      `UPDATE profiles SET
        first_name = $1, last_name = $2, headline = $3, bio = $4, location = $5, industry = $6,
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [
        firstName !== undefined ? firstName : p.firstName,
        lastName !== undefined ? lastName : p.lastName,
        headline !== undefined ? headline : p.headline,
        bio !== undefined ? bio : p.bio,
        location !== undefined ? location : p.location,
        industry !== undefined ? industry : p.industry,
        req.params.id
      ]
    );
    res.json({ profile: mapProfile(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profiles/:id/cover', upload.single('coverPhoto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Cover photo is required' });
    const { rows } = await query(
      `UPDATE profiles SET cover_photo = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [req.file.path, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile: mapProfile(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JSONB array helpers
async function updateJsonbArray(profileId, column, newArray) {
  const { rows } = await query(
    `UPDATE profiles SET ${column} = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [JSON.stringify(newArray), profileId]
  );
  return rows[0];
}

app.post('/api/profiles/:id/experience', async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Profile not found' });

    const { title, company, location, startDate, endDate, current, description } = req.body;
    if (!title || !company) return res.status(400).json({ error: 'Title and company are required' });

    const exp = existing[0].experience || [];
    const newExp = {
      id: exp.length > 0 ? Math.max(...exp.map(e => e.id)) + 1 : 1,
      title, company, location: location || '',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || null, current: current || false, description: description || ''
    };
    exp.push(newExp);
    const updated = await updateJsonbArray(req.params.id, 'experience', exp);
    res.status(201).json({ experience: newExp, profile: mapProfile(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/profiles/:profileId/experience/:expId', async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.profileId]);
    if (!existing[0]) return res.status(404).json({ error: 'Profile not found' });

    const exp = (existing[0].experience || []).filter(e => e.id !== parseInt(req.params.expId));
    const updated = await updateJsonbArray(req.params.profileId, 'experience', exp);
    res.json({ message: 'Experience deleted', profile: mapProfile(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles/:id/education', async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Profile not found' });

    const { school, degree, field, startDate, endDate, description } = req.body;
    if (!school || !degree) return res.status(400).json({ error: 'School and degree are required' });

    const edu = existing[0].education || [];
    const newEdu = {
      id: edu.length > 0 ? Math.max(...edu.map(e => e.id)) + 1 : 1,
      school, degree, field: field || '',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || null, description: description || ''
    };
    edu.push(newEdu);
    const updated = await updateJsonbArray(req.params.id, 'education', edu);
    res.status(201).json({ education: newEdu, profile: mapProfile(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/profiles/:profileId/education/:eduId', async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.profileId]);
    if (!existing[0]) return res.status(404).json({ error: 'Profile not found' });

    const edu = (existing[0].education || []).filter(e => e.id !== parseInt(req.params.eduId));
    const updated = await updateJsonbArray(req.params.profileId, 'education', edu);
    res.json({ message: 'Education deleted', profile: mapProfile(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles/:id/skills', async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Profile not found' });

    const { skill } = req.body;
    if (!skill) return res.status(400).json({ error: 'Skill name is required' });

    const skills = existing[0].skills || [];
    if (skills.find(s => s.name.toLowerCase() === skill.toLowerCase())) {
      return res.status(400).json({ error: 'Skill already exists' });
    }
    skills.push({ name: skill, endorsements: 0 });
    const updated = await updateJsonbArray(req.params.id, 'skills', skills);
    res.status(201).json({ skills, profile: mapProfile(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/profiles/:profileId/skills/:skillName', async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.profileId]);
    if (!existing[0]) return res.status(404).json({ error: 'Profile not found' });

    const skills = (existing[0].skills || []).filter(
      s => s.name.toLowerCase() !== req.params.skillName.toLowerCase()
    );
    const updated = await updateJsonbArray(req.params.profileId, 'skills', skills);
    res.json({ message: 'Skill deleted', profile: mapProfile(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profiles/:id/posts', async (req, res) => {
  try {
    const { rows: profileRows } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (!profileRows[0]) return res.status(404).json({ error: 'Profile not found' });

    const fullName = `${profileRows[0].first_name} ${profileRows[0].last_name}`;
    const { rows } = await query(
      'SELECT * FROM posts WHERE author = $1 ORDER BY timestamp DESC',
      [fullName]
    );
    res.json({ posts: rows.map(mapPost) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'LinkedIn Clone API is running',
    database: 'PostgreSQL via Neon',
    storage: 'Cloudinary',
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: PostgreSQL (Neon)`);
  console.log(`🖼️  Media storage: Cloudinary`);
});
