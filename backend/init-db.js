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
      console.log('🌱 Seeding user: Zubair...');
      
      await query(`
        INSERT INTO profiles (
          user_id, name, password, headline, bio, location, industry,
          profile_picture, cover_photo, contact_info, social_links, experience, education, skills,
          connections, followers, following
        ) VALUES (
          1, 'Zubair', 'Zubair321', '', '', '', '',
          '/uploads/default-avatar.png', '/uploads/default-cover.png',
          '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
          0, 0, 0
        )
      `);
      
      console.log('✅ User Zubair created (password: Zubair321)');
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
