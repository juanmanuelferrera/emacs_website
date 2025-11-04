# Emacs Website - Cloudflare Deployment Guide

Complete guide to deploy your Emacs-style website with authentication to Cloudflare.

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

### Via Wrangler (Quick)

```bash
wrangler pages deploy . --project-name=emacs-website
```

### Via Git (Recommended for continuous deployment)

1. Push your code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Click "Create a project"
4. Connect your Git repository
5. Configure build settings:
   - Build command: (leave empty)
   - Build output directory: `/`
6. Deploy

## Step 6: Update Frontend API URL

Edit `script.js` and find the line:

```javascript
const API_URL = 'http://localhost:8787';  // Change this
```

Replace with your worker URL:

```javascript
const API_URL = 'https://emacs-website.YOUR_SUBDOMAIN.workers.dev';
```

Commit and redeploy:

```bash
git add script.js
git commit -m "Update API URL"
wrangler pages deploy .
```

## Usage

### Register a New Account

**Note:** All users share the same password: `Emacs108`

1. Visit your deployed site
2. Press `M-x` → type `register`
3. Enter username (min 3 chars) - Password is automatically `Emacs108`
4. You're automatically logged in!

**Example:** Register as "jaganat" (your main account):
```bash
# After site is deployed, visit the URL
# Press M-x, type "register"
# Username: jaganat
# Password: Emacs108 (automatic)
```

### Login

1. Press `M-x` → type `login`
2. Enter credentials
3. Your session is saved for 7 days

### Create a Page

1. Make sure you're logged in
2. Press `C-n` (Control+N)
3. Enter page name
4. Start writing!
5. Press `C-e` to edit
6. Press `C-x C-s` to save

### Edit a Page

1. Switch to the page you want to edit
2. Press `C-e` (Control+E)
3. Make your changes
4. Press `C-x C-s` to save

### Delete a Page

1. Switch to the page you want to delete
2. Press `C-d` (Control+D)
3. Confirm deletion

## Authentication System

### How It Works

1. **Registration**: Username + password → hashed password stored in D1
2. **Login**: Credentials verified → JWT token issued (7 days)
3. **Protected Actions**: Token sent with requests → Worker verifies

### Security Features

- Passwords hashed with SHA-256
- JWT tokens for sessions (7 day expiration)
- Only buffer creators can delete their buffers
- Built-in buffers are read-only
- Public reading, authenticated writing

### API Endpoints

#### Public (No Auth)
- `GET /api/buffers` - List all buffers
- `GET /api/buffers/:id` - Get single buffer

#### Auth Required
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/buffers` - Create buffer
- `PUT /api/buffers/:id` - Update buffer
- `DELETE /api/buffers/:id` - Delete buffer

## Database Management

### View all users
```bash
wrangler d1 execute emacs_website_db --command="SELECT username, created_at FROM users"
```

### View all buffers
```bash
wrangler d1 execute emacs_website_db --command="SELECT id, name, created_by, created_at FROM buffers"
```

### Make yourself admin (future feature)
```bash
wrangler d1 execute emacs_website_db --command="UPDATE users SET is_admin = 1 WHERE username='yourusername'"
```

### Delete a user
```bash
wrangler d1 execute emacs_website_db --command="DELETE FROM users WHERE username='spam_user'"
```

### Reset database (⚠️  Deletes all data!)
```bash
wrangler d1 execute emacs_website_db --file=./schema.sql
```

## Local Development

### Run Worker Locally
```bash
wrangler dev
```

### Run with local D1
```bash
wrangler dev --local --persist
```

### Test API
```bash
# Register
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Create buffer (use token from login)
curl -X POST http://localhost:8787/api/buffers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test","content":"Test content"}'
```

## Costs (Free Tier)

- **Cloudflare Pages**: Free (unlimited sites, 500 builds/month)
- **Cloudflare Workers**: Free (100,000 requests/day)
- **D1 Database**: Free (5GB storage, 5M reads/day, 100K writes/day)

All features work on free tier!

## Custom Domain

1. Go to Cloudflare Pages → Your Project → Custom domains
2. Add your domain
3. Follow DNS instructions (automatic if using Cloudflare DNS)

## Monitoring

### View Worker Logs
```bash
wrangler tail
```

### View Analytics
Go to Cloudflare Dashboard → Workers → Your Worker → Analytics

## Architecture

```
┌─────────────────┐
│    Frontend     │  Cloudflare Pages
│   HTML/CSS/JS   │  (Static hosting)
└────────┬────────┘
         │ HTTPS + JWT
         ↓
┌─────────────────┐
│   Worker API    │  Cloudflare Workers
│   Authentication│  (Serverless API)
│   CRUD Logic    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  D1 Database    │  Cloudflare D1
│   SQLite        │  (Serverless DB)
│   Users/Buffers │
└─────────────────┘
```

## Permissions

- **Read**: Anyone (public pages)
- **Write/Edit**: Authenticated users only
- **Delete**: Only buffer creator
- **Built-in buffers**: Read-only (home, research, etc.)

## Troubleshooting

### "Unauthorized" error
- Check if you're logged in (`M-x` → `me`)
- Token may have expired (7 days) - login again

### "Buffer already exists"
- Choose a different name
- Or edit the existing one if you created it

### "Cannot delete built-in buffers"
- Built-in buffers (home, research, etc.) cannot be deleted
- Create custom buffers instead

### CORS errors
- Worker has CORS headers configured
- Check `API_URL` in script.js matches your worker URL

### Database errors
```bash
# Check database status
wrangler d1 info emacs_website_db

# Verify schema
wrangler d1 execute emacs_website_db --command=".schema"
```

## Security Best Practices

1. **Use HTTPS only** (Cloudflare provides free SSL)
2. **Strong passwords** (min 6 chars, encourage longer)
3. **Rate limiting** (add to worker for production)
4. **Input validation** (already implemented)
5. **XSS protection** (sanitize user content)

## Future Enhancements

- [ ] Email verification
- [ ] Password reset
- [ ] User profiles
- [ ] Buffer collaboration
- [ ] Version history
- [ ] Export/import
- [ ] Syntax highlighting
- [ ] Real-time collaboration
- [ ] Admin dashboard
- [ ] Rate limiting

## Support

For issues:
1. Check worker logs: `wrangler tail`
2. Check D1 database: `wrangler d1 execute ...`
3. Verify deployment: `wrangler deployments list`

---

**Your Emacs-style website is now live with authentication!**

Anyone can read, but only authenticated users can create/edit/delete their own content.
