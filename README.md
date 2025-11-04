# Emacs-Style Website

A private, keyboard-driven web interface inspired by GNU Emacs.

## 🚀 Live Site

https://main.emacs-website.pages.dev

## ✨ Features

### 🔒 Private & Secure
- Login required to view content
- Email-based registration
- Password protection

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `M-x` (Alt+x / Cmd+x) | Open command palette |
| `M-b` (Alt+b) | Show buffer list |
| `C-n` | Create new page |
| `C-e` | Edit current page |
| `C-d` | Delete page (y/n confirmation) |
| `C-s` | Save page |
| `C-f` | Search in page |
| `C-k` | Clear *scratch* buffer |
| `C-h` | Show help |
| `M-w` | Copy page content |
| `TAB` | Toggle section fold |
| `ESC` | Cancel operation |

### 📋 Minibuffer Interface
- All interactions happen in the minibuffer (no popups)
- Command autocomplete as you type
- Yes/No confirmations (type y or n)
- Text input for names and searches

### 🗂️ Page Management
- **Built-in pages:** Home and *scratch*
- **Custom pages:** Create your own with C-n
- **Buffer list:** Press M-b to see all pages
- **Auto-save:** Changes save to localStorage
- **Cloud sync:** Syncs when logged in

### 🎨 Org-Mode Folding
- Use `* Heading` for sections
- Press TAB on heading to fold/unfold
- Press Shift+TAB to toggle all

## 🔐 Getting Started

### Registration
1. Visit the site (login required screen appears)
2. Press `M-x` and type `register-user`
3. Enter registration code: `Emacs108`
4. Enter your email
5. Choose a password (min 6 characters)
6. You're logged in automatically!

### Login
1. Press `M-x` and type `login`
2. Enter your email
3. Enter your password
4. Welcome back!

### Creating Content
1. Press `C-n` to create a new page
2. Type the page name in minibuffer
3. Press `C-e` to edit
4. Write your content
5. Press `C-x C-s` to save

### Navigating
- Press `M-b` to see buffer list
- Click any buffer name to switch
- Or use `M-x` → type buffer name

### Searching
1. Press `C-s`
2. Type search term in minibuffer
3. Browser highlights matches

### Deleting Pages
1. Switch to the page you want to delete
2. Press `C-d`
3. Type `y` to confirm or `n` to cancel

## 📖 Usage Tips

### Command Palette (M-x)
- Press `M-x` to see all available commands
- Start typing to filter commands
- Use arrow keys to navigate
- Press Enter or Tab to select

### Buffer List (M-b)
- Shows all pages in the main area
- Click buffer names to switch
- Press `M-b` again to close
- Stays visible until closed

### Org-Mode Syntax
```
* Main Heading
** Sub-heading
*** Sub-sub-heading

Regular text here...

- Bullet point
- Another point
```

### Scratch Buffer
- Quick notes that don't save
- Press `C-k` to clear it
- Good for temporary work

## 🎯 Philosophy

This site follows the Emacs way:
- **Keyboard-first:** Everything via shortcuts
- **Minibuffer-driven:** No modal popups
- **Content-focused:** Minimal UI
- **Discoverable:** Commands show descriptions

## 📧 Support

For issues: https://github.com/your-username/emacs-website/issues

---

*M-x butterfly* 🦋

Made for the Emacs community
