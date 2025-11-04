# Emacs Website - Cloudflare Deployment Guide

This guide will help you deploy your Emacs-style website to Cloudflare with D1 database support.

## Prerequisites

1. Cloudflare account (free tier works)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Git repository initialized

## Step 1: Login to Cloudflare

```bash
wrangler login
```

## Step 2: Create D1 Database

```bash
wrangler d1 create emacs_website_db
```

This will output a `database_id`. Copy it and update `wrangler.toml`:

```toml
[[ d1_databases ]]
binding = "DB"
database_name = "emacs_website_db"
database_id = "YOUR_DATABASE_ID_HERE"
```

## Step 3: Initialize Database Schema

```bash
wrangler d1 execute emacs_website_db --file=./schema.sql
```

## Step 4: Deploy Worker (Backend API)

```bash
wrangler deploy
```

This will output your worker URL, something like:
```
https://emacs-website.YOUR_SUBDOMAIN.workers.dev
```

## Step 5: Deploy Frontend to Cloudflare Pages

### Option A: Via Wrangler

```bash
wrangler pages deploy . --project-name=emacs-website
```

### Option B: Via Git (Recommended)

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect your Git repository
4. Configure build settings:
   - Build command: (leave empty)
   - Build output directory: `/`
5. Deploy

## Step 6: Update Frontend API URL

Edit `script.js` and add your worker URL at the top:

```javascript
const API_URL = 'https://emacs-website.YOUR_SUBDOMAIN.workers.dev';
```

Then update the API calls to use this URL instead of localStorage.

## Step 7: Test Your Deployment

Visit your Cloudflare Pages URL and:

1. Press `M-x` to open command palette
2. Press `C-n` to create a new buffer
3. Press `C-e` to edit it
4. Press `C-x C-s` to save

The data will now be stored in D1 database and accessible to all users!

## Database Management

### View all buffers
```bash
wrangler d1 execute emacs_website_db --command="SELECT * FROM buffers"
```

### Add a buffer manually
```bash
wrangler d1 execute emacs_website_db --command="INSERT INTO buffers (id, name, content, created_at, updated_at) VALUES ('test', 'Test', 'Content', datetime('now'), datetime('now'))"
```

### Delete a buffer
```bash
wrangler d1 execute emacs_website_db --command="DELETE FROM buffers WHERE id='test'"
```

## Environment Variables

For production, you may want to add authentication. Edit `wrangler.toml`:

```toml
[vars]
API_KEY = "your-secret-key"
```

## Costs

- Cloudflare Pages: Free (unlimited sites)
- Cloudflare Workers: Free (100,000 requests/day)
- D1 Database: Free (5GB storage, 5M reads/day, 100K writes/day)

## Custom Domain

1. Go to Cloudflare Pages → Your Project → Custom domains
2. Add your domain
3. Follow DNS instructions

## Troubleshooting

### Worker not responding
```bash
wrangler tail
```

### Database not found
Check that `database_id` in `wrangler.toml` matches your D1 database ID.

### CORS errors
Ensure worker.js has proper CORS headers (already configured).

## Architecture

```
┌─────────────┐
│  Frontend   │ (Cloudflare Pages)
│  HTML/CSS/JS│
└──────┬──────┘
       │ HTTPS
       ↓
┌──────────────┐
│ Worker API   │ (Cloudflare Workers)
│ worker.js    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ D1 Database  │ (Cloudflare D1)
│ SQLite       │
└──────────────┘
```

## Next Steps

- Add authentication (username/password)
- Add search functionality
- Export/import buffers
- Add syntax highlighting
- Implement collaboration features

---

**Note**: This is a public website where anyone can create/edit content. For production use, add authentication!
