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
  firstName: r.first_name,
  lastName: r.last_name,
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

// =========================================
// POSTS
// =========================================

app.get('/api/posts', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM posts ORDER BY timestamp DESC');
    res.json({ posts: rows.map(mapPost) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { author, authorTitle, content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    const { rows } = await query(
      `INSERT INTO posts (author, author_title, content) VALUES ($1, $2, $3) RETURNING *`,
      [author || 'Anonymous User', authorTitle || 'Member', content.trim()]
    );
    res.status(201).json({ post: mapPost(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/with-media', (req, res, next) => {
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
    const { author, authorTitle, content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    // Cloudinary returns full URLs in file.path
    const images = req.files?.images ? req.files.images.map(f => f.path) : [];
    const video = req.files?.video ? req.files.video[0].path : null;

    console.log('Creating post with images:', images, 'video:', video);

    const { rows } = await query(
      `INSERT INTO posts (author, author_title, content, images, video)
       VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING *`,
      [author || 'Anonymous User', authorTitle || 'Member', content.trim(), JSON.stringify(images), video]
    );
    res.status(201).json({ post: mapPost(rows[0]) });
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: mapPost(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================
// PROFILES
// =========================================

app.get('/api/profiles', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM profiles ORDER BY id');
    res.json({ profiles: rows.map(mapProfile) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile: mapProfile(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profiles/user/:userId', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM profiles WHERE user_id = $1', [req.params.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile: mapProfile(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles', upload.single('profilePicture'), async (req, res) => {
  try {
    const { userId, firstName, lastName, headline, bio, location, industry, email, phone, website, linkedin, github, twitter } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ error: 'First name and last name are required' });

    const profilePicture = req.file ? req.file.path : '/uploads/default-avatar.png';
    const contactInfo = JSON.stringify({ email: email || '', phone: phone || '', website: website || '' });
    const socialLinks = JSON.stringify({ linkedin: linkedin || '', github: github || '', twitter: twitter || '' });

    const { rows } = await query(
      `INSERT INTO profiles (user_id, first_name, last_name, headline, bio, location, industry, profile_picture, contact_info, social_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb) RETURNING *`,
      [userId || null, firstName, lastName, headline || '', bio || '', location || '', industry || '', profilePicture, contactInfo, socialLinks]
    );
    res.status(201).json({ profile: mapProfile(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profiles/:id', upload.single('profilePicture'), async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Profile not found' });

    const p = mapProfile(existing[0]);
    const { firstName, lastName, headline, bio, location, industry, email, phone, website, linkedin, github, twitter } = req.body;

    const newContactInfo = {
      email: email !== undefined ? email : p.contactInfo.email,
      phone: phone !== undefined ? phone : p.contactInfo.phone,
      website: website !== undefined ? website : p.contactInfo.website,
    };
    const newSocialLinks = {
      linkedin: linkedin !== undefined ? linkedin : p.socialLinks.linkedin,
      github: github !== undefined ? github : p.socialLinks.github,
      twitter: twitter !== undefined ? twitter : p.socialLinks.twitter,
    };
    const profilePicture = req.file ? req.file.path : p.profilePicture;

    const { rows } = await query(
      `UPDATE profiles SET
        first_name = $1, last_name = $2, headline = $3, bio = $4, location = $5, industry = $6,
        profile_picture = $7, contact_info = $8::jsonb, social_links = $9::jsonb, updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [
        firstName || p.firstName, lastName || p.lastName,
        headline !== undefined ? headline : p.headline,
        bio !== undefined ? bio : p.bio,
        location !== undefined ? location : p.location,
        industry !== undefined ? industry : p.industry,
        profilePicture, JSON.stringify(newContactInfo), JSON.stringify(newSocialLinks),
        req.params.id
      ]
    );
    res.json({ profile: mapProfile(rows[0]) });
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
