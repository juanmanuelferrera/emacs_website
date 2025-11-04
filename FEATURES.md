# Emacs Website - Feature List

## Complete Feature Set (Current Build)

### Core Navigation

#### M-x Command Palette
- **Trigger:** `Alt+x` (or `Option+x` on Mac)
- Vertico-style vertical completion UI
- Fuzzy matching for commands
- Arrow keys to navigate (↑/↓)
- Enter to execute
- ESC or C-g to cancel
- Centered popup with cyan border
- Descriptions aligned right

#### M-m Sidebar Menu
- **Trigger:** `Alt+m`
- Toggleable left sidebar showing all buffers
- Hierarchical organization:
  - Built-in buffers (Home, Research, Philosophy, etc.)
  - Custom user-created buffers
- Current buffer highlighted with cyan border
- Click any item to switch
- Click overlay to close
- Author attribution for custom buffers

### Content Management

#### Create New Page (C-n)
- **Trigger:** `Ctrl+n`
- Prompt for page name
- Auto-generates buffer ID
- Saves to localStorage
- Immediately switchable
- Can also use: `M-x new-buffer`

#### Edit Page (C-e)
- **Trigger:** `Ctrl+e`
- Enable contentEditable mode
- Visual cyan outline when editing
- Mode line shows "Edit" in yellow
- Save with C-s
- Cancel with ESC
- Can also use: `M-x edit-buffer`

#### Save Page (C-s)
- **Trigger:** `Ctrl+s`
- Saves content to localStorage
- Exits edit mode
- Shows confirmation message
- Can also use: `M-x save-buffer`

#### Delete Page (C-d)
- **Trigger:** `Ctrl+d`
- Confirmation dialog
- Cannot delete built-in buffers
- Removes from storage and DOM
- Auto-switches to Home
- Can also use: `M-x delete-buffer`

### Export Features

#### Export to Text File
- **Command:** `M-x export-buffer` or `C-x C-w`
- Downloads as .txt file
- Preserves plain text formatting
- Filename based on buffer name

#### Export to Org File
- **Command:** `M-x export-to-org`
- Creates proper org-mode document
- Includes metadata:
  - #+TITLE
  - #+AUTHOR
  - #+DATE
  - #+OPTIONS
- Downloads as .org file

#### Export to PDF
- **Command:** `M-x export-to-pdf`
- Opens browser print dialog
- User can save as PDF
- Preserves formatting
- Title set to buffer name

### Content Discovery

#### List All Buffers (C-l)
- **Trigger:** `Ctrl+l`
- Shows all buffers in completion UI
- Built-in + custom buffers
- Click or Enter to switch
- Can also use: `M-x list-buffers`

#### Recent/New Content
- **Command:** `M-x recent-content`
- Shows unread/new content
- Marks content with (NEW) or (unread)
- RSS-like functionality
- Tracks viewed buffers
- Persists across sessions

#### Buffer Information
- **Command:** `M-x buffer-info`
- Shows current buffer details:
  - Buffer name
  - Author
  - Created date (custom buffers)
  - Modified date (custom buffers)
- Displayed in alert dialog

### Navigation Commands

#### Search in Buffer (C-f)
- **Trigger:** `Ctrl+f`
- Prompt for search term
- Uses browser's built-in find
- Case-insensitive
- Shows found/not found message

#### Go to Beginning (M-<)
- **Trigger:** `Alt+Shift+,` (Alt+<)
- Scrolls to top of buffer
- Quick navigation

#### Go to End (M->)
- **Trigger:** `Alt+Shift+.` (Alt+>)
- Scrolls to bottom of buffer
- Quick navigation

### Utility Commands

#### Copy Buffer Content (M-w)
- **Trigger:** `Alt+w`
- Copies entire buffer to clipboard
- Success/failure message
- Can also use: `M-x copy-buffer`

#### Clear Scratch Buffer (C-k)
- **Trigger:** `Ctrl+k` (only in *scratch* buffer)
- Confirmation dialog
- Resets to default content
- Only works in scratch buffer

#### Reload Page (C-r)
- **Trigger:** `Ctrl+r`
- Full page reload
- Clears any unsaved changes
- Can also use: `M-x reload`

#### Show Help (C-h)
- **Trigger:** `Ctrl+h`
- Lists all available commands
- Shows keyboard shortcuts
- Grouped by category
- Can also use: `M-x help`

### Direct Buffer Access

All built-in buffers accessible via M-x:
- `M-x home` - Welcome page
- `M-x research` - Bhagavad Gita research
- `M-x philosophy` - Philosophical questions
- `M-x projects` - Software projects
- `M-x espanol` - Spanish content
- `M-x writings` - Articles and essays
- `M-x contact` - Contact information
- `M-x scratch` - Scratch buffer

### Visual Features

#### Modus Vivendi Theme
- Pure black background (#000000)
- White text (#ffffff)
- Cyan accents (#00d3d0)
- Green for active elements (#44bc44)
- Yellow for warnings/highlights (#d0bc00)
- Consistent Emacs aesthetics

#### iA Writer Mono S Font
- 17px size (carefully calibrated)
- Monospace throughout
- Matches user's actual Emacs font
- Excellent readability

#### Mode Line
- Shows current buffer name
- Current mode (Fundamental/Edit)
- Line number (animated)
- Current time (HH:MM)
- Updates in real-time

### Data Persistence

#### localStorage Storage
- Custom buffers saved automatically
- Viewed content tracking
- Last visit timestamp
- Survives browser restart
- No server required for basic use

#### Author Attribution
- Built-in buffers: "Jagannath Mishra Dasa"
- Custom buffers: User-provided
- Shown in buffer info
- Displayed in sidebar
- Included in export metadata

### Keyboard Shortcuts Summary

```
Navigation:
  M-x         : Open command palette (Vertico-style)
  M-m         : Toggle sidebar menu
  C-l         : List all buffers

Content Management:
  C-n         : Create new page/buffer
  C-e         : Edit current page
  C-d         : Delete current page
  C-s         : Save current page

Buffer Navigation:
  C-f         : Search in current buffer
  M-<         : Go to beginning
  M->         : Go to end

Utilities:
  C-h         : Show help
  C-r         : Reload page
  C-k         : Clear scratch buffer (scratch only)
  M-w         : Copy buffer content
  C-x C-w     : Export to text file

Cancel Operations:
  ESC         : Exit edit mode / Close minibuffer
  C-g         : Cancel operation
```

### M-x Commands (Full List)

```
switch-buffer         Switch to another buffer
list-buffers          List all available buffers
toggle-sidebar        Toggle sidebar menu (M-m)
recent-content        Show recent/new content
new-buffer            Create a new buffer (C-n)
edit-buffer           Edit current buffer (C-e)
delete-buffer         Delete current buffer (C-d)
save-buffer           Save current buffer (C-x C-s)
buffer-info           Show current buffer information
export-buffer         Export to text file (C-x C-w)
export-to-org         Export to org file
export-to-pdf         Export to PDF
copy-buffer           Copy buffer content (M-w)
home                  Welcome page
research              Bhagavad Gita research
philosophy            Philosophical questions
projects              Software projects
espanol               Spanish content
writings              Articles and essays
contact               Contact information
scratch               Scratch buffer
help                  Show available commands
reload                Reload the page
```

## Technical Details

### Architecture
- Pure vanilla JavaScript (no frameworks)
- CSS with custom properties (CSS variables)
- HTML5 semantic structure
- localStorage for persistence
- ContentEditable API for inline editing

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design included

### File Structure
```
index.html      - Main HTML structure
style.css       - Modus Vivendi theme styles
script.js       - All functionality
worker.js       - Cloudflare Worker API (optional)
schema.sql      - Database schema (optional)
wrangler.toml   - Cloudflare config (optional)
```

### Performance
- No external dependencies
- Fast page load (<1s)
- Minimal memory footprint
- Smooth animations (CSS transitions)
- Efficient DOM manipulation

## Authentication System (When Deployed)

### Registration System
- Private registration code required (stored securely in Cloudflare secrets)
- Each user creates their own password
- Simple JWT authentication
- 7-day token expiration

### Protected Operations
- Create buffer (requires auth)
- Edit buffer (requires auth)
- Delete buffer (requires auth + ownership)
- Built-in buffers: Read-only

### Public Operations
- Read any buffer
- View buffer list
- Search
- Export
- Navigate

## Deployment Status

**Current Status:** NOT DEPLOYED

**To Deploy:**
```bash
# 1. Login to Cloudflare
wrangler login

# 2. Create D1 database
wrangler d1 create emacs_website_db
# Copy database_id to wrangler.toml

# 3. Initialize database
wrangler d1 execute emacs_website_db --file=./schema.sql

# 4. Deploy worker
wrangler deploy

# 5. Deploy frontend
wrangler pages deploy . --project-name=emacs-website
```

**After Deployment:**
1. Visit your Cloudflare Pages URL
2. Register with the private registration code
3. Create your own password
4. Start creating content!

## What Makes This Special

1. **Authentic Emacs Experience**
   - Real Emacs keybindings
   - Vertico-style completion
   - Mode line with live updates
   - M-x command system
   - Buffer metaphor

2. **Content Management Without CMS**
   - Create pages inline
   - Edit directly in browser
   - No admin panel needed
   - Keyboard-first workflow

3. **Export Flexibility**
   - Text, Org, PDF formats
   - Proper metadata
   - Author attribution
   - One-command export

4. **RSS-like Content Discovery**
   - Track viewed content
   - See what's new
   - Personal content feed
   - Persistent across sessions

5. **Minimalist Design**
   - No visual clutter
   - Black and white only
   - Monospace font throughout
   - Focus on content

6. **Keyboard-First**
   - Every action has keybinding
   - No mouse required
   - Emacs muscle memory
   - Efficient workflow

## Future Enhancements (Planned)

- [ ] Multi-user collaboration
- [ ] Version history for buffers
- [ ] Real-time sync between devices
- [ ] Org-mode syntax highlighting
- [ ] Search across all buffers
- [ ] Tags/categories for buffers
- [ ] Export to multiple formats (MD, HTML)
- [ ] Import from files
- [ ] Keyboard macro recording
- [ ] Custom themes
- [ ] Mobile keyboard shortcuts
- [ ] Offline PWA support

---

**Built with care by Jagannath Mishra Dasa**
**Inspired by GNU Emacs and the spirit of text editing mastery**
