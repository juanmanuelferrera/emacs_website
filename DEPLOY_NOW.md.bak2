# Quick Deployment Guide - Deploy Your Emacs Website Now!

## Prerequisites Check

You need Node.js and npm installed. Check if you have them:
```bash
node --version
npm --version
```

If not installed, get them from: https://nodejs.org/

## Step 1: Install Wrangler

```bash
# Option A: Install globally (recommended)
npm install -g wrangler

# Option B: If permission issues, use npx (no install needed)
npx wrangler --version
```

**For the rest of this guide, if you used Option B, replace `wrangler` with `npx wrangler`**

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate with Cloudflare. If you don't have a Cloudflare account:
1. Go to https://cloudflare.com
2. Sign up (free)
3. Then run `wrangler login` again

## Step 3: Create D1 Database

```bash
cd /Users/jaganat/.emacs.d/git_projects/emacs_website
wrangler d1 create emacs_website_db
```

This will output something like:
```
✅ Successfully created DB 'emacs_website_db'

[[d1_databases]]
binding = "DB"
database_name = "emacs_website_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**IMPORTANT:** Copy the `database_id` value!

## Step 4: Update wrangler.toml

Edit `wrangler.toml` and paste your database_id:

```toml
[[ d1_databases ]]
binding = "DB"
database_name = "emacs_website_db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"
```

## Step 5: Initialize Database Schema

```bash
wrangler d1 execute emacs_website_db --file=./schema.sql
```

You should see:
```
🌀 Mapping SQL input into an array of statements
🌀 Executing on emacs_website_db (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
✅ Executed 7 commands in 0.123ms
```

## Step 6: Set Up Email (Mailgun) - OPTIONAL

**If you want email registration (M-x register-user):**

1. Sign up at https://www.mailgun.com/ (free tier: 100 emails/day)
2. Get your API key from Dashboard → Settings → API Keys
3. Note your domain (e.g., sandboxXXXX.mailgun.org)
4. Add secrets:

```bash
wrangler secret put MAILGUN_API_KEY
# When prompted, paste your API key

wrangler secret put MAILGUN_DOMAIN
# When prompted, enter your domain
```

**Skip this step if you don't need email registration** (you can still create accounts manually via database)

## Step 7: Deploy Worker API

```bash
wrangler deploy
```

You'll see:
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded emacs-website (X.XX sec)
Published emacs-website (X.XX sec)
  https://emacs-website.YOUR_SUBDOMAIN.workers.dev
```

**IMPORTANT:** Copy your worker URL!

## Step 8: Update Frontend API URL

Edit `script.js` and replace ALL occurrences of:
```javascript
const API_URL = 'http://localhost:8787';
```

With your worker URL:
```javascript
const API_URL = 'https://emacs-website.YOUR_SUBDOMAIN.workers.dev';
```

There are 3 places to update:
1. In `registerUser()` function (around line 795)
2. In `loginUser()` function (around line 880)
3. Any other API calls

Or use this command to replace all at once:
```bash
sed -i.bak "s|http://localhost:8787|https://emacs-website.YOUR_SUBDOMAIN.workers.dev|g" script.js
```

## Step 9: Deploy Frontend to Cloudflare Pages

```bash
wrangler pages deploy . --project-name=emacs-website
```

Output will show:
```
✨ Success! Uploaded X files (X.XX sec)

✨ Deployment complete! Take a peek over at
   https://XXXXXXXX.emacs-website.pages.dev
```

**That's your live website URL!** 🎉

## Step 10: Register Your Account

1. Visit your website URL
2. Press `M-x` (Alt+x or Option+x)
3. Type `register-user`
4. Fill in:
   - Username: `jaganat`
   - Full Name: `Jagannath Mishra Dasa`
   - Email: `your@email.com`
5. Press `C-c C-c` or click "Register"
6. Check your email for password
7. Press `M-x` → type `login`
8. Enter your username and password from email

## Verification Checklist

✅ Website loads at your Pages URL
✅ M-x opens command palette (Alt+x)
✅ M-m toggles sidebar (Alt+m)
✅ Can view all built-in buffers
✅ Can create new buffer (C-n)
✅ Registration works (M-x register-user)
✅ Login works (M-x login)

## Custom Domain (Optional)

To use your own domain:

1. Go to Cloudflare Dashboard → Pages → emacs-website
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. Enter your domain
5. Follow DNS instructions
6. Wait for SSL certificate (automatic)

## Troubleshooting

### Database Errors
```bash
# Check database exists
wrangler d1 list

# Check database schema
wrangler d1 execute emacs_website_db --command=".schema"

# View users
wrangler d1 execute emacs_website_db --command="SELECT * FROM users"
```

### Worker Logs
```bash
# View live logs
wrangler tail

# Check recent deployments
wrangler deployments list
```

### Pages Issues
```bash
# List all projects
wrangler pages project list

# View project details
wrangler pages deployment list --project-name=emacs-website
```

### Email Not Sending
1. Check Mailgun dashboard for any errors
2. Verify domain is active
3. Check API key is correct:
   ```bash
   wrangler secret list
   ```
4. View worker logs for errors:
   ```bash
   wrangler tail
   ```

## Environment Variables Summary

Worker Secrets (optional, for email):
- `MAILGUN_API_KEY` - Your Mailgun API key
- `MAILGUN_DOMAIN` - Your Mailgun domain

## URLs to Save

- Worker API: `https://emacs-website.YOUR_SUBDOMAIN.workers.dev`
- Website: `https://XXXXXXXX.emacs-website.pages.dev`
- Cloudflare Dashboard: `https://dash.cloudflare.com`

## Next Steps

1. Create content with C-n
2. Share your site URL
3. Register more users
4. Customize buffers
5. Export content (M-x export-to-org, export-to-pdf)
6. Explore all M-x commands (M-x help)

## Cost

Everything runs on Cloudflare's **FREE tier**:
- ✅ Cloudflare Pages: Free (unlimited sites)
- ✅ Cloudflare Workers: Free (100,000 requests/day)
- ✅ D1 Database: Free (5GB storage, 5M reads/day)
- ✅ Mailgun: Free (100 emails/day)

**Total cost: $0** 🎉

---

**Congratulations! Your Emacs-style website is now live!** 🚀

Visit your URL and press M-x to get started.
