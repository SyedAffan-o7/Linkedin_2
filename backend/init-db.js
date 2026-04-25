// Database initialization script
// Run with: npm run init-db
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await query(schema);
    console.log('✅ Schema created');

    // Check if seed data exists
    const { rows } = await query('SELECT COUNT(*) FROM profiles');
    if (parseInt(rows[0].count) === 0) {
      console.log('🌱 Seeding initial data...');
      
      // Seed default profile
      await query(`
        INSERT INTO profiles (
          user_id, first_name, last_name, headline, bio, location, industry,
          profile_picture, cover_photo, contact_info, social_links, experience, education, skills,
          connections, followers, following
        ) VALUES (
          1, 'John', 'Doe', 'Software Engineer at Google',
          'Passionate software engineer with 5+ years of experience in full-stack development.',
          'San Francisco Bay Area', 'Technology',
          '/uploads/default-avatar.png', '/uploads/default-cover.png',
          $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb,
          2847, 5234, 892
        )
      `, [
        JSON.stringify({ email: 'john.doe@example.com', phone: '+1 (555) 123-4567', website: 'https://johndoe.dev' }),
        JSON.stringify({ linkedin: 'https://linkedin.com/in/johndoe', github: 'https://github.com/johndoe', twitter: 'https://twitter.com/johndoe' }),
        JSON.stringify([
          { id: 1, title: 'Software Engineer', company: 'Google', location: 'Mountain View, CA', startDate: '2022-01-15', endDate: null, current: true, description: 'Working on Google Cloud Platform.' },
          { id: 2, title: 'Full Stack Developer', company: 'Microsoft', location: 'Seattle, WA', startDate: '2019-06-01', endDate: '2021-12-20', current: false, description: 'Developed web applications using React, Node.js.' }
        ]),
        JSON.stringify([
          { id: 1, school: 'Stanford University', degree: 'Master of Science', field: 'Computer Science', startDate: '2017-09-01', endDate: '2019-05-30', description: 'AI and ML specialization' }
        ]),
        JSON.stringify([
          { name: 'JavaScript', endorsements: 45 },
          { name: 'React', endorsements: 38 },
          { name: 'Node.js', endorsements: 32 },
          { name: 'Python', endorsements: 28 }
        ])
      ]);

      // Seed sample posts
      await query(`
        INSERT INTO posts (author, author_title, content, images, likes, comments, timestamp) VALUES
        ('John Doe', 'Software Engineer at Google', 'Just started working on a new React project! 🚀',
          '["https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800"]'::jsonb,
          42, 5, NOW() - INTERVAL '1 hour'),
        ('Jane Smith', 'Product Manager at Microsoft', 'Check out this amazing product demo! 📊',
          '["https://images.unsplash.com/photo-1551434678-e076c223a692?w=800","https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"]'::jsonb,
          28, 3, NOW() - INTERVAL '2 hours')
      `);
      
      console.log('✅ Seed data inserted');
    } else {
      console.log('ℹ️  Database already has data, skipping seed');
    }

    console.log('🎉 Database ready!');
  } catch (err) {
    console.error('❌ Init failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
