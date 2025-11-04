# Manual Deployment Guide

The automated script encountered npm cache permission issues. Follow these manual steps:

## Fix npm Permissions First

```bash
# Fix npm cache permissions
sudo chown -R $(whoami) "/Users/jaganat/.npm"
npm cache clean --force
```

## Deployment Steps

### 1. Login to Cloudflare
```bash
cd /Users/jaganat/.emacs.d/git_projects/emacs_website
npx wrangler login
```

A browser will open. Login to Cloudflare (or create account if needed).

### 2. Create D1 Database
```bash
npx wrangler d1 create emacs_website_db
```

You'll see output like:
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the database_id!**

### 3. Update wrangler.toml

Edit `wrangler.toml` and replace the empty database_id:

```toml
[[ d1_databases ]]
binding = "DB"
database_name = "emacs_website_db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"
```

### 4. Initialize Database
```bash
npx wrangler d1 execute emacs_website_db --file=./schema.sql
```

### 5. Setup Email (Optional - for M-x register-user)

If you want email registration:

```bash
# Get API key from: https://app.mailgun.com/app/account/security/api_keys
npx wrangler secret put MAILGUN_API_KEY
# Paste your API key when prompted

npx wrangler secret put MAILGUN_DOMAIN
# Enter your domain (e.g., sandboxXXXX.mailgun.org)
```

**Skip this if you don't want email registration.**

### 6. Deploy Worker
```bash
npx wrangler deploy
```

You'll see output like:
```
Published emacs-website (X.XX sec)
  https://emacs-website.YOUR_SUBDOMAIN.workers.dev
```

**Copy your worker URL!**

### 7. Update script.js

Edit `script.js` and replace ALL occurrences of:
```javascript
const API_URL = 'http://localhost:8787';
```

With your worker URL (3 places to update):
```javascript
const API_URL = 'https://emacs-website.YOUR_SUBDOMAIN.workers.dev';
```

Or use this command:
```bash
# Replace YOUR_URL with your actual worker URL
sed -i.bak "s|http://localhost:8787|https://emacs-website.YOUR_SUBDOMAIN.workers.dev|g" script.js
```

### 8. Deploy Frontend
```bash
npx wrangler pages deploy . --project-name=emacs-website
```

You'll see:
```
✨ Deployment complete!
   https://XXXXXXXX.emacs-website.pages.dev
```

**That's your live website URL!** 🎉

## Test Your Website

1. Visit your Cloudflare Pages URL
2. Press `M-x` (Alt+x or Option+x)
3. You should see the Vertico-style completion popup

## Register Your Account

1. Press `M-x` → type `register-user`
2. Enter:
   - Email: `jaganat@mail.com`
   - Name: `Jagannath Mishra Dasa`
3. Check your email for password
4. Press `M-x` → type `login`
5. Enter email and password

## Test Org-Mode Folding

1. Press `C-n` to create a new page
2. Add content with headings:
   ```
   * Main Topic
   Some content here.
   
   ** Subtopic
   More content.
   ```
3. Press `C-x C-s` to save
4. Press `M-x` → type `enable-org-mode`
5. Click headings to fold/unfold!
6. Try `TAB` on a heading
7. Try `Shift+TAB` to toggle all

## Troubleshooting

### npm permission errors
```bash
sudo chown -R $(whoami) "/Users/jaganat/.npm"
npm cache clean --force
```

### Wrangler not found
```bash
npm install -g wrangler
# Or keep using: npx wrangler
```

### Database errors
```bash
# List databases
npx wrangler d1 list

# Check schema
npx wrangler d1 execute emacs_website_db --command=".schema"
```

### View worker logs
```bash
npx wrangler tail
```

### Worker URL not working
Check your Cloudflare dashboard:
- Go to: https://dash.cloudflare.com
- Workers & Pages → emacs-website
- Copy the URL shown there

## URLs to Save

After deployment, save these:
- **Worker API**: https://emacs-website.YOUR_SUBDOMAIN.workers.dev
- **Website**: https://XXXXXXXX.emacs-website.pages.dev
- **Dashboard**: https://dash.cloudflare.com

## Custom Domain (Later)

To use your own domain:
1. Go to Cloudflare Dashboard → Pages → emacs-website
2. Custom domains → Add domain
3. Follow DNS instructions

---

**Need help?** Check the logs:
```bash
npx wrangler tail  # Live worker logs
cat /Users/jaganat/.npm/_logs/[latest].log  # npm errors
```
