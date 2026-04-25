# Backend Setup: Neon (PostgreSQL) + Cloudinary (Media)

## 1. Create Free Neon Database

1. Go to **https://neon.tech** and sign up (free tier, no credit card)
2. Click **"Create Project"** → name it `linkedin-clone`
3. Copy the **connection string**

## 2. Create Free Cloudinary Account

1. Go to **https://cloudinary.com** and sign up (free tier, 25GB storage)
2. From your dashboard, copy the **Cloud Name**, **API Key**, and **API Secret**

## 3. Configure Environment

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:
```
DATABASE_URL=postgresql://your-username:your-password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Initialize Database (creates tables + seed data)

```bash
npm run init-db
```

You should see:
```
🔌 Connecting to PostgreSQL...
✅ Schema created
🌱 Seeding initial data...
✅ Seed data inserted
🎉 Database ready!
```

## 5. Start the Server

```bash
npm start
```

The server now uses PostgreSQL instead of in-memory storage. Data persists across restarts!

## Reverting to In-Memory (if needed)

```bash
npm run start:memory
```

## Files

- `db.js` - PostgreSQL connection pool
- `schema.sql` - Table definitions
- `init-db.js` - Migration + seed script
- `server-pg.js` - Express server using PostgreSQL
- `server.js` - Original in-memory version (kept as backup)
