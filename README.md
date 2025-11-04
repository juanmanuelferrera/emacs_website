# Emacs-Style Website

A minimalist website designed to look and feel like the Emacs text editor, featuring M-x command navigation.

## Features

- **Pure black background with white text** (Modus Vivendi theme)
- **iA Writer Mono S font** (your actual Emacs font)
- **Clean interface** with no visible navigation
- **M-x command system** for all navigation (Alt+x or Option+x)
- **Emacs-inspired mode line** showing buffer name and time
- **Multiple buffers** that can be switched via commands

## Usage

Simply open `index.html` in a web browser.

### Navigation

Press **M-x** (Alt+x on Windows/Linux, Option+x on Mac) to open the command palette.

Then type a command:

- `switch-buffer` or `list-buffers` - See all available buffers
- `home` - Go to home buffer
- `about` - Go to about buffer
- `projects` - Go to projects buffer
- `contact` - Go to contact buffer
- `scratch` - Go to scratch buffer
- `help` - Show all available commands

### Keyboard Shortcuts

- **M-x** (Alt+x or Option+x) - Open command palette
- **ESC** or **C-g** - Cancel/close minibuffer
- **Enter** - Execute selected command
- **↑/↓** - Navigate completions
- **Tab** - Auto-complete to selected item
- **C-x C-c** - Try to quit (Easter egg!)

## Files

- `index.html` - Main HTML structure with buffer content
- `style.css` - Emacs-inspired styling (Modus Vivendi colors)
- `script.js` - M-x command system and navigation
- `README.md` - This file

## Design Philosophy

This website embraces the Emacs philosophy:

1. **Keyboard-First**: All navigation via M-x commands
2. **Content Over Chrome**: No visible UI, just content
3. **Discoverability**: Commands are autocompleted and described
4. **Minimalism**: Black and white, monospace, nothing else

## Customization

### Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --bg-main: #000000;
    --fg-main: #ffffff;
    --cyan: #00d3d0;
    /* etc. */
}
```

### Font

The font is set to "iA Writer Mono S" (your Emacs font). To change:

```css
body {
    font-family: "Your Font", "Fallback", monospace;
}
```

### Adding New Buffers/Pages

1. Add a new buffer div in `index.html`:
```html
<div class="buffer" id="newpage">
    <div class="buffer-content">
        Your content here...
    </div>
</div>
```

2. Add a command in `script.js`:
```javascript
'newpage': {
    func: () => switchBuffer('newpage', '*New Page*'),
    desc: 'Switch to New Page buffer'
}
```

### Content Format

Content is written in a mix of:
- Org-mode style headers (`* Header`, `** Subheader`)
- Lisp-style comments (`;; Comment`)
- Plain text

This gives it an authentic Emacs feel while remaining readable.

## Browser Compatibility

Works best in modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Technical Notes

- Pure vanilla JavaScript, no frameworks
- No external dependencies
- Static website, no backend required
- Lightweight (~10KB total)

## Inspiration

Inspired by:
- GNU Emacs and its timeless design
- The Modus Themes by Protesilaos Stavrou
- The principle that good design is as little design as possible

## License

MIT License - Use freely!

---

*M-x butterfly* 🦋

Built with love for the Emacs community.
