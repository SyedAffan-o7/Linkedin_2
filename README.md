# LinkedIn Clone

A full-stack LinkedIn clone built with React, Node.js, PostgreSQL, and Cloudinary.

## Features

- User profile management
- Create posts with text, images, and videos
- Like and comment on posts
- PostgreSQL database for persistent storage
- Cloudinary for media storage

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Lucide React icons

**Backend:**
- Node.js
- Express
- PostgreSQL (Neon)
- Cloudinary
- Multer

## Project Structure

```
Linkdin clone/
├── linkdin-clone/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                # Node.js backend
│   ├── server-pg.js
│   ├── db.js
│   ├── cloudinary-config.js
│   ├── schema.sql
│   ├── init-db.js
│   ├── .env
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/SyedAffan-o7/Linkedin_2.git
cd Linkedin_2
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file:
```env
DATABASE_URL=your_neon_postgresql_url
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=5000
```

Initialize the database:
```bash
npm run init-db
```

Start the backend:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd linkdin-clone
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## API Endpoints

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create text post
- `POST /api/posts/with-media` - Create post with media
- `GET /api/profiles/:id` - Get user profile
- `PUT /api/profiles/:id` - Update profile

## License

MIT
