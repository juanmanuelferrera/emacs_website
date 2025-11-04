#!/bin/bash

# Emacs Website Deployment Script
# Run this script to deploy your website to Cloudflare

set -e  # Exit on error

echo "🚀 Emacs Website Deployment"
echo "============================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Error: Neither wrangler nor npx is available"
    echo ""
    echo "Please install Node.js and npm first:"
    echo "  brew install node  (on macOS)"
    echo "  Or download from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Determine wrangler command
if command -v wrangler &> /dev/null; then
    WRANGLER="wrangler"
    echo "✅ Found wrangler installed globally"
else
    WRANGLER="npx wrangler"
    echo "✅ Will use npx wrangler (no installation needed)"
fi

echo ""
echo "Step 1: Login to Cloudflare"
echo "----------------------------"
read -p "Press Enter to open browser and login..."
$WRANGLER login

echo ""
echo "Step 2: Create D1 Database"
echo "--------------------------"
echo "Creating database..."
OUTPUT=$($WRANGLER d1 create emacs_website_db)
echo "$OUTPUT"

# Extract database ID
DATABASE_ID=$(echo "$OUTPUT" | grep "database_id" | sed 's/.*= "\(.*\)"/\1/')

if [ -z "$DATABASE_ID" ]; then
    echo "❌ Failed to get database ID"
    echo "Please create database manually and update wrangler.toml"
    exit 1
fi

echo ""
echo "✅ Database created with ID: $DATABASE_ID"

# Update wrangler.toml
echo "Updating wrangler.toml..."
sed -i.backup "s/database_id = \"\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
echo "✅ wrangler.toml updated"

echo ""
echo "Step 3: Initialize Database Schema"
echo "-----------------------------------"
$WRANGLER d1 execute emacs_website_db --file=./schema.sql
echo "✅ Database schema initialized"

echo ""
echo "Step 4: Set up Email (Optional)"
echo "-------------------------------"
read -p "Do you want to set up email registration with Mailgun? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Get your Mailgun API key from:"
    echo "https://app.mailgun.com/app/account/security/api_keys"
    echo ""
    read -p "Enter your Mailgun API key: " MAILGUN_KEY
    echo "$MAILGUN_KEY" | $WRANGLER secret put MAILGUN_API_KEY
    
    echo ""
    read -p "Enter your Mailgun domain (e.g., sandboxXXXX.mailgun.org): " MAILGUN_DOMAIN
    echo "$MAILGUN_DOMAIN" | $WRANGLER secret put MAILGUN_DOMAIN
    
    echo "✅ Mailgun configured"
else
    echo "⏭️  Skipping email setup (you can add it later)"
fi

echo ""
echo "Step 5: Deploy Worker API"
echo "-------------------------"
$WRANGLER deploy
echo "✅ Worker deployed"

# Get worker URL
WORKER_URL=$($WRANGLER deployments list 2>/dev/null | grep "https://" | head -1 | awk '{print $2}')

if [ -z "$WORKER_URL" ]; then
    echo ""
    echo "⚠️  Could not automatically detect worker URL"
    echo "Please check your Cloudflare dashboard for the worker URL"
    echo "Then update script.js manually"
else
    echo ""
    echo "✅ Worker URL: $WORKER_URL"
    echo ""
    echo "Step 6: Update Frontend API URL"
    echo "-------------------------------"
    echo "Updating script.js with worker URL..."
    sed -i.backup "s|http://localhost:8787|$WORKER_URL|g" script.js
    echo "✅ script.js updated"
fi

echo ""
echo "Step 7: Deploy Frontend to Cloudflare Pages"
echo "-------------------------------------------"
$WRANGLER pages deploy . --project-name=emacs-website

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Your website is now live!"
echo ""
echo "Next steps:"
echo "1. Visit your Cloudflare Pages URL (shown above)"
echo "2. Press M-x (Alt+x) to open command palette"
echo "3. Type 'register-user' to create your account"
echo "4. Email: jaganat@mail.com"
echo "5. Full Name: Jagannath Mishra Dasa"
echo "6. Check your email for password"
echo ""
echo "Keyboard shortcuts:"
echo "- M-x : Command palette"
echo "- M-m : Toggle sidebar"
echo "- C-n : Create new page"
echo "- C-e : Edit page"
echo "- TAB : Toggle org-mode fold"
echo "- Shift+TAB : Toggle all folds"
echo ""
echo "Enjoy your Emacs-style website! 🚀"
