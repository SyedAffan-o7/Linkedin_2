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
      console.log('🌱 Seeding 3 users with preset credentials...');
      
      // User 1: John Doe
      await query(`
        INSERT INTO profiles (
          user_id, email, password, first_name, last_name, headline, bio, location, industry,
          profile_picture, cover_photo, contact_info, social_links, experience, education, skills,
          connections, followers, following
        ) VALUES (
          1, 'john@linkedin.com', 'password123', 'John', 'Doe', 'Software Engineer at Google',
          'Passionate software engineer with 5+ years of experience in full-stack development.',
          'San Francisco Bay Area', 'Technology',
          '/uploads/default-avatar.png', '/uploads/default-cover.png',
          $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb,
          2847, 5234, 892
        )
      `, [
        JSON.stringify({ email: 'john@linkedin.com', phone: '+1 (555) 123-4567', website: 'https://johndoe.dev' }),
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

      // User 2: Jane Smith
      await query(`
        INSERT INTO profiles (
          user_id, email, password, first_name, last_name, headline, bio, location, industry,
          profile_picture, cover_photo, contact_info, social_links, experience, education, skills,
          connections, followers, following
        ) VALUES (
          2, 'jane@linkedin.com', 'password123', 'Jane', 'Smith', 'Product Manager at Microsoft',
          'Experienced product manager driving innovation and user-centric solutions.',
          'Seattle, WA', 'Technology',
          '/uploads/default-avatar.png', '/uploads/default-cover.png',
          $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb,
          1523, 3421, 567
        )
      `, [
        JSON.stringify({ email: 'jane@linkedin.com', phone: '+1 (555) 987-6543', website: 'https://janesmith.dev' }),
        JSON.stringify({ linkedin: 'https://linkedin.com/in/janesmith', github: 'https://github.com/janesmith', twitter: 'https://twitter.com/janesmith' }),
        JSON.stringify([
          { id: 1, title: 'Product Manager', company: 'Microsoft', location: 'Seattle, WA', startDate: '2021-03-01', endDate: null, current: true, description: 'Leading product development for Azure services.' },
          { id: 2, title: 'Business Analyst', company: 'Amazon', location: 'Seattle, WA', startDate: '2018-07-01', endDate: '2021-02-28', current: false, description: 'Data analysis and market research.' }
        ]),
        JSON.stringify([
          { id: 1, school: 'Harvard Business School', degree: 'MBA', field: 'Business Administration', startDate: '2016-09-01', endDate: '2018-05-30', description: 'Focus on Technology Management' }
        ]),
        JSON.stringify([
          { name: 'Product Management', endorsements: 52 },
          { name: 'Agile', endorsements: 41 },
          { name: 'Data Analysis', endorsements: 35 },
          { name: 'Strategy', endorsements: 29 }
        ])
      ]);

      // User 3: Mike Johnson
      await query(`
        INSERT INTO profiles (
          user_id, email, password, first_name, last_name, headline, bio, location, industry,
          profile_picture, cover_photo, contact_info, social_links, experience, education, skills,
          connections, followers, following
        ) VALUES (
          3, 'mike@linkedin.com', 'password123', 'Mike', 'Johnson', 'UX Designer at Apple',
          'Creative UX designer crafting beautiful and intuitive user experiences.',
          'Cupertino, CA', 'Design',
          '/uploads/default-avatar.png', '/uploads/default-cover.png',
          $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb,
          987, 2156, 432
        )
      `, [
        JSON.stringify({ email: 'mike@linkedin.com', phone: '+1 (555) 456-7890', website: 'https://mikejohnson.design' }),
        JSON.stringify({ linkedin: 'https://linkedin.com/in/mikejohnson', github: 'https://github.com/mikejohnson', twitter: 'https://twitter.com/mikejohnson' }),
        JSON.stringify([
          { id: 1, title: 'Senior UX Designer', company: 'Apple', location: 'Cupertino, CA', startDate: '2020-01-15', endDate: null, current: true, description: 'Designing iOS and macOS experiences.' },
          { id: 2, title: 'UI Designer', company: 'Adobe', location: 'San Jose, CA', startDate: '2017-08-01', endDate: '2019-12-30', current: false, description: 'Creative Suite design system.' }
        ]),
        JSON.stringify([
          { id: 1, school: 'Rhode Island School of Design', degree: 'BFA', field: 'Graphic Design', startDate: '2013-09-01', endDate: '2017-05-30', description: 'Focus on Digital Design' }
        ]),
        JSON.stringify([
          { name: 'Figma', endorsements: 48 },
          { name: 'Sketch', endorsements: 36 },
          { name: 'User Research', endorsements: 31 },
          { name: 'Prototyping', endorsements: 27 }
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
