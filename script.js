// Emacs-style Website JavaScript - M-x Command System with Content Creation

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const window_el = document.querySelector('.window');
    const minibuffer = document.getElementById('minibuffer');
    const minibufferInput = document.getElementById('minibuffer-input');
    const completionsDiv = document.getElementById('minibuffer-completions');
    const modeLineBuffer = document.getElementById('mode-line-buffer');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // Initialize or load buffers from localStorage
    let customBuffers = JSON.parse(localStorage.getItem('emacs-website-buffers')) || {};
    let currentBufferId = 'home';
    let isEditMode = false;
    let isSidebarOpen = false;

    // Default built-in buffers (read-only) with author info
    const builtInBuffers = ['home', 'research', 'philosophy', 'projects', 'espanol', 'writings', 'contact', 'scratch'];

    const bufferAuthors = {
        'home': 'Jagannath Mishra Dasa',
        'research': 'Jagannath Mishra Dasa',
        'philosophy': 'Jagannath Mishra Dasa',
        'projects': 'Jagannath Mishra Dasa',
        'espanol': 'Jagannath Mishra Dasa',
        'writings': 'Jagannath Mishra Dasa',
        'contact': 'Jagannath Mishra Dasa',
        'scratch': 'Public'
    };

    // Track viewed content for "recent/new" feature
    let viewedContent = JSON.parse(localStorage.getItem('emacs-website-viewed')) || {};
    let lastVisit = localStorage.getItem('emacs-website-last-visit') || new Date().toISOString();

    // Initialize custom buffers on page load
    function initializeCustomBuffers() {
        Object.keys(customBuffers).forEach(bufferId => {
            const buffer = customBuffers[bufferId];
            if (!document.getElementById(bufferId)) {
                createBufferElement(bufferId, buffer.name, buffer.content);
            }
        });
        updateSidebar();
    }

    // Toggle sidebar
    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        updateSidebarHighlight();
        showMessage(isSidebarOpen ? 'Sidebar opened' : 'Sidebar closed');
    }

    // Update sidebar to show current buffer highlighted
    function updateSidebarHighlight() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('current');
            if (item.dataset.buffer === currentBufferId) {
                item.classList.add('current');
            }
        });
    }

    // Update sidebar with custom buffers
    function updateSidebar() {
        const customBuffersSection = document.getElementById('custom-buffers-section');
        const customBuffersList = document.getElementById('custom-buffers-list');

        if (Object.keys(customBuffers).length > 0) {
            customBuffersSection.style.display = 'block';
            customBuffersList.innerHTML = Object.keys(customBuffers).map(bufferId => {
                const buffer = customBuffers[bufferId];
                const author = buffer.author || 'Anonymous';
                return `
                    <div class="sidebar-item" data-buffer="${bufferId}" data-display="*${buffer.name}*">
                        ${buffer.name}
                        <span class="sidebar-item-author">${author}</span>
                    </div>
                `;
            }).join('');

            // Add click handlers to new custom buffer items
            customBuffersList.querySelectorAll('.sidebar-item').forEach(item => {
                item.addEventListener('click', () => {
                    switchBuffer(item.dataset.buffer, item.dataset.display);
                    if (isSidebarOpen) {
                        toggleSidebar();
                    }
                });
            });
        } else {
            customBuffersSection.style.display = 'none';
        }
    }

    // Close sidebar when clicking overlay
    sidebarOverlay.addEventListener('click', () => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
    });

    // Add click handlers to built-in sidebar items
    document.querySelectorAll('.sidebar-item[data-buffer]').forEach(item => {
        item.addEventListener('click', () => {
            switchBuffer(item.dataset.buffer, item.dataset.display);
            if (isSidebarOpen) {
                toggleSidebar();
            }
        });
    });

    // Available commands
    const commands = {
        'switch-buffer': {
            func: () => showBufferList(),
            desc: 'Switch to another buffer'
        },
        'list-buffers': {
            func: () => showBufferList(),
            desc: 'List all available buffers'
        },
        'toggle-sidebar': {
            func: () => toggleSidebar(),
            desc: 'Toggle sidebar menu (M-m)'
        },
        'recent-content': {
            func: () => showRecentContent(),
            desc: 'Show recent/new content you haven\'t seen'
        },
        'new-buffer': {
            func: () => createNewBuffer(),
            desc: 'Create a new buffer (C-n)'
        },
        'edit-buffer': {
            func: () => enterEditMode(),
            desc: 'Edit current buffer (C-e)'
        },
        'delete-buffer': {
            func: () => deleteCurrentBuffer(),
            desc: 'Delete current buffer (C-d)'
        },
        'save-buffer': {
            func: () => saveCurrentBuffer(),
            desc: 'Save current buffer (C-x C-s)'
        },
        'buffer-info': {
            func: () => showBufferInfo(),
            desc: 'Show current buffer information'
        },
        'export-buffer': {
            func: () => exportBuffer(),
            desc: 'Export buffer to text file (C-x C-w)'
        },
        'export-to-org': {
            func: () => exportToOrg(),
            desc: 'Export buffer to org file'
        },
        'export-to-pdf': {
            func: () => exportToPdf(),
            desc: 'Export buffer to PDF'
        },
        'copy-buffer': {
            func: () => copyBufferContent(),
            desc: 'Copy buffer content to clipboard (M-w)'
        },
        'home': {
            func: () => switchBuffer('home', '*Home*'),
            desc: 'Welcome and introduction'
        },
        'research': {
            func: () => switchBuffer('research', '*Research*'),
            desc: 'Bhagavad Gita textual analysis'
        },
        'philosophy': {
            func: () => switchBuffer('philosophy', '*Philosophy*'),
            desc: 'Philosophical questions and comparative analysis'
        },
        'projects': {
            func: () => switchBuffer('projects', '*Projects*'),
            desc: 'Software projects and tools'
        },
        'espanol': {
            func: () => switchBuffer('espanol', '*Español*'),
            desc: 'Contenido en idioma español'
        },
        'writings': {
            func: () => switchBuffer('writings', '*Writings*'),
            desc: 'Articles, essays, and publications'
        },
        'contact': {
            func: () => switchBuffer('contact', '*Contact*'),
            desc: 'Contact information'
        },
        'scratch': {
            func: () => switchBuffer('scratch', '*scratch*'),
            desc: 'Scratch buffer for notes'
        },
        'help': {
            func: () => showHelp(),
            desc: 'Show available commands'
        },
        'reload': {
            func: () => location.reload(),
            desc: 'Reload the page'
        }
    };

    let selectedCompletionIndex = 0;
    let currentCompletions = [];

    // Create buffer element
    function createBufferElement(id, name, content = '') {
        const buffer = document.createElement('div');
        buffer.className = 'buffer';
        buffer.id = id;
        buffer.innerHTML = `
            <div class="buffer-content" contenteditable="false">${content || `;; New buffer: ${name}\n;; Press C-e to edit\n\n* ${name}\n\nYour content here...\n`}</div>
        `;
        window_el.appendChild(buffer);
        return buffer;
    }

    // Create new buffer
    function createNewBuffer() {
        closeMinibuffer();

        // Ask for buffer name
        const name = prompt('Buffer name:', 'New Buffer');
        if (!name) return;

        const bufferId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        // Check if buffer already exists
        if (document.getElementById(bufferId)) {
            showMessage('Buffer already exists!');
            return;
        }

        // Create buffer object
        customBuffers[bufferId] = {
            name: name,
            content: `;; New buffer: ${name}\n;; Press C-e to edit\n\n* ${name}\n\nYour content here...\n`,
            created: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('emacs-website-buffers', JSON.stringify(customBuffers));

        // Create buffer element
        createBufferElement(bufferId, name, customBuffers[bufferId].content);

        // Switch to new buffer
        switchBuffer(bufferId, `*${name}*`);
        showMessage(`Created buffer: *${name}*`);
    }

    // Enter edit mode
    function enterEditMode() {
        if (builtInBuffers.includes(currentBufferId)) {
            showMessage('Cannot edit built-in buffers. Create a new buffer with C-n');
            return;
        }

        isEditMode = true;
        const currentBuffer = document.getElementById(currentBufferId);
        const content = currentBuffer.querySelector('.buffer-content');
        content.contentEditable = 'true';
        content.focus();
        content.style.outline = '2px solid #00d3d0';
        showMessage('Edit mode active. Press C-x C-s to save, ESC to cancel');

        // Update mode line
        const modeSpan = document.querySelector('.mode-line-mode');
        modeSpan.textContent = 'Edit';
        modeSpan.style.color = '#d0bc00';
    }

    // Exit edit mode
    function exitEditMode(save = false) {
        isEditMode = false;
        const currentBuffer = document.getElementById(currentBufferId);
        const content = currentBuffer.querySelector('.buffer-content');

        if (save && !builtInBuffers.includes(currentBufferId)) {
            // Save content
            customBuffers[currentBufferId].content = content.innerHTML;
            localStorage.setItem('emacs-website-buffers', JSON.stringify(customBuffers));
            showMessage('Buffer saved');
        } else if (!save) {
            // Revert changes
            if (!builtInBuffers.includes(currentBufferId)) {
                content.innerHTML = customBuffers[currentBufferId].content;
            }
            showMessage('Changes discarded');
        }

        content.contentEditable = 'false';
        content.style.outline = 'none';

        // Restore mode line
        const modeSpan = document.querySelector('.mode-line-mode');
        modeSpan.textContent = 'Fundamental';
        modeSpan.style.color = '#44bc44';
    }

    // Save current buffer
    function saveCurrentBuffer() {
        if (isEditMode) {
            exitEditMode(true);
        } else {
            showMessage('No changes to save');
        }
    }

    // Delete current buffer
    function deleteCurrentBuffer() {
        if (builtInBuffers.includes(currentBufferId)) {
            showMessage('Cannot delete built-in buffers');
            return;
        }

        const bufferName = customBuffers[currentBufferId].name;
        if (!confirm(`Delete buffer *${bufferName}*?`)) {
            return;
        }

        // Remove from DOM
        const bufferElement = document.getElementById(currentBufferId);
        bufferElement.remove();

        // Remove from storage
        delete customBuffers[currentBufferId];
        localStorage.setItem('emacs-website-buffers', JSON.stringify(customBuffers));

        // Switch to home
        switchBuffer('home', '*Home*');
        showMessage(`Deleted buffer: *${bufferName}*`);
    }

    // Buffer switching function
    function switchBuffer(bufferName, displayName) {
        // Exit edit mode if active
        if (isEditMode) {
            exitEditMode(false);
        }

        // Hide all buffers
        const allBuffers = document.querySelectorAll('.buffer');
        allBuffers.forEach(b => b.classList.remove('active'));

        // Show target buffer
        const targetBuffer = document.getElementById(bufferName);
        if (targetBuffer) {
            targetBuffer.classList.add('active');
            modeLineBuffer.textContent = displayName;
            currentBufferId = bufferName;

            // Mark buffer as viewed
            markBufferViewed(bufferName);

            // Update sidebar highlight
            updateSidebarHighlight();

            // Show buffer author in message
            const author = bufferAuthors[bufferName] || customBuffers[bufferName]?.author || 'Unknown';
            showMessage(`${displayName} -- ${author}`);

            closeMinibuffer();

            // Scroll to top
            targetBuffer.scrollTop = 0;
        }
    }

    // Show buffer list in minibuffer
    function showBufferList() {
        // Built-in buffers
        const bufferList = [
            { name: 'home', display: '*Home*' },
            { name: 'research', display: '*Research*' },
            { name: 'philosophy', display: '*Philosophy*' },
            { name: 'projects', display: '*Projects*' },
            { name: 'espanol', display: '*Español*' },
            { name: 'writings', display: '*Writings*' },
            { name: 'contact', display: '*Contact*' },
            { name: 'scratch', display: '*scratch*' }
        ];

        // Add custom buffers
        Object.keys(customBuffers).forEach(bufferId => {
            bufferList.push({
                name: bufferId,
                display: `*${customBuffers[bufferId].name}*`
            });
        });

        minibufferInput.value = '';
        updateCompletions(bufferList.map(b => ({
            name: b.name,
            desc: `Switch to ${b.display}`,
            func: () => switchBuffer(b.name, b.display)
        })));
    }

    // Show help
    function showHelp() {
        const helpText = Object.keys(commands)
            .map(cmd => `  ${cmd.padEnd(20)} - ${commands[cmd].desc}`)
            .join('\n');
        const keyboardShortcuts = `
Keyboard Shortcuts:
  M-x         : Open command palette
  M-m         : Toggle sidebar menu
  C-n         : Create new buffer
  C-e         : Edit current buffer
  C-d         : Delete current buffer
  C-l         : List all buffers
  C-h         : Show this help
  C-s         : Search in current buffer
  C-r         : Reload page
  C-k         : Clear scratch buffer
  M-w         : Copy buffer content
  C-x C-s     : Save buffer
  C-x C-w     : Export buffer to file
  M-<         : Go to beginning
  M->         : Go to end
  ESC         : Cancel operation
  C-g         : Cancel operation
`;
        alert(`Available Commands:\n\n${helpText}\n${keyboardShortcuts}`);
        closeMinibuffer();
    }

    // Search in current buffer
    function searchInBuffer() {
        const searchTerm = prompt('Search for:');
        if (!searchTerm) return;

        const currentBuffer = document.getElementById(currentBufferId);
        const content = currentBuffer.querySelector('.buffer-content');
        const text = content.textContent;

        if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
            // Use browser's built-in find
            window.find(searchTerm, false, false, true);
            showMessage(`Found: ${searchTerm}`);
        } else {
            showMessage(`Not found: ${searchTerm}`);
        }
    }

    // Clear scratch buffer
    function clearScratchBuffer() {
        if (currentBufferId !== 'scratch') return;

        if (confirm('Clear *scratch* buffer?')) {
            const scratchBuffer = document.getElementById('scratch');
            const content = scratchBuffer.querySelector('.buffer-content');
            content.textContent = ';; This buffer is for notes that are not saved.\n;; Press M-x for available commands\n\n';
            showMessage('*scratch* buffer cleared');
        }
    }

    // Copy buffer content to clipboard
    function copyBufferContent() {
        const currentBuffer = document.getElementById(currentBufferId);
        const content = currentBuffer.querySelector('.buffer-content');
        const text = content.textContent;

        navigator.clipboard.writeText(text).then(() => {
            showMessage('Buffer content copied to clipboard');
        }).catch(() => {
            showMessage('Failed to copy content');
        });
    }

    // Export buffer to file (txt)
    function exportBuffer() {
        const currentBuffer = document.getElementById(currentBufferId);
        const content = currentBuffer.querySelector('.buffer-content');
        const text = content.textContent;

        const bufferName = modeLineBuffer.textContent.replace(/\*/g, '');
        const filename = `${bufferName.toLowerCase().replace(/\s+/g, '-')}.txt`;

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage(`Exported to ${filename}`);
    }

    // Export buffer to org file
    function exportToOrg() {
        const currentBuffer = document.getElementById(currentBufferId);
        const content = currentBuffer.querySelector('.buffer-content');
        const text = content.textContent;

        const bufferName = modeLineBuffer.textContent.replace(/\*/g, '');
        const author = bufferAuthors[currentBufferId] || customBuffers[currentBufferId]?.author || 'Unknown';
        const date = new Date().toISOString().split('T')[0];

        // Create org-mode formatted content
        const orgContent = `#+TITLE: ${bufferName}
#+AUTHOR: ${author}
#+DATE: ${date}
#+OPTIONS: toc:nil num:nil

${text}
`;

        const filename = `${bufferName.toLowerCase().replace(/\s+/g, '-')}.org`;

        const blob = new Blob([orgContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage(`Exported to ${filename}`);
    }

    // Export buffer to PDF
    function exportToPdf() {
        const bufferName = modeLineBuffer.textContent.replace(/\*/g, '');
        const originalTitle = document.title;

        // Set title for PDF
        document.title = bufferName;

        // Hide everything except current buffer
        const currentBuffer = document.getElementById(currentBufferId);
        document.body.style.overflow = 'visible';
        currentBuffer.style.position = 'relative';

        // Trigger print dialog (user can save as PDF)
        window.print();

        // Restore
        document.title = originalTitle;
        document.body.style.overflow = 'hidden';
        currentBuffer.style.position = '';

        showMessage('Print dialog opened. Choose "Save as PDF"');
    }

    // Scroll to top of buffer
    function scrollToTop() {
        const currentBuffer = document.getElementById(currentBufferId);
        currentBuffer.scrollTop = 0;
        showMessage('Beginning of buffer');
    }

    // Scroll to bottom of buffer
    function scrollToBottom() {
        const currentBuffer = document.getElementById(currentBufferId);
        currentBuffer.scrollTop = currentBuffer.scrollHeight;
        showMessage('End of buffer');
    }

    // Show buffer info (author, created date, etc.)
    function showBufferInfo() {
        const author = bufferAuthors[currentBufferId] || customBuffers[currentBufferId]?.author || 'Unknown';
        const bufferName = modeLineBuffer.textContent;
        const created = customBuffers[currentBufferId]?.created || 'Built-in';
        const modified = customBuffers[currentBufferId]?.modified || 'N/A';

        let info = `Buffer: ${bufferName}\nAuthor: ${author}`;
        if (created !== 'Built-in') {
            info += `\nCreated: ${new Date(created).toLocaleString()}`;
            if (modified !== 'N/A') {
                info += `\nModified: ${new Date(modified).toLocaleString()}`;
            }
        }

        alert(info);
        closeMinibuffer();
    }

    // Show recent/new content
    function showRecentContent() {
        closeMinibuffer();

        // Get all buffers with their last modified dates
        const allBuffers = [
            ...builtInBuffers.map(id => ({
                id,
                name: id,
                modified: viewedContent[id] || null,
                isNew: !viewedContent[id]
            })),
            ...Object.keys(customBuffers).map(id => ({
                id,
                name: customBuffers[id].name,
                modified: customBuffers[id].modified || customBuffers[id].created,
                isNew: new Date(customBuffers[id].created) > new Date(lastVisit)
            }))
        ];

        // Filter for new/unviewed content
        const newContent = allBuffers.filter(b => b.isNew || !viewedContent[b.id]);

        if (newContent.length === 0) {
            showMessage('No new content. You\'re all caught up!');
            return;
        }

        // Show list of new content
        const list = newContent.map(b => `  - ${b.name} ${b.isNew ? '(NEW)' : '(unread)'}`).join('\n');
        alert(`Recent/New Content:\n\n${list}\n\nUse M-x to switch to these buffers.`);
    }

    // Mark buffer as viewed
    function markBufferViewed(bufferId) {
        viewedContent[bufferId] = new Date().toISOString();
        localStorage.setItem('emacs-website-viewed', JSON.stringify(viewedContent));
        localStorage.setItem('emacs-website-last-visit', new Date().toISOString());
    }

    // Open minibuffer with M-x
    function openMinibuffer() {
        if (isEditMode) {
            showMessage('Exit edit mode first (ESC or C-x C-s)');
            return;
        }

        minibuffer.classList.add('active');
        minibufferInput.value = '';
        minibufferInput.focus();
        updateCompletions(Object.keys(commands).map(cmd => ({
            name: cmd,
            desc: commands[cmd].desc,
            func: commands[cmd].func
        })));
    }

    // Close minibuffer
    function closeMinibuffer() {
        minibuffer.classList.remove('active');
        completionsDiv.classList.remove('active');
        minibufferInput.value = '';
        currentCompletions = [];
        selectedCompletionIndex = 0;
    }

    // Update completions based on input
    function updateCompletions(items) {
        const input = minibufferInput.value.toLowerCase();

        // Filter items based on input
        currentCompletions = items.filter(item =>
            item.name.toLowerCase().includes(input)
        );

        // Show completions if there are any
        if (currentCompletions.length > 0) {
            completionsDiv.innerHTML = currentCompletions.map((item, index) => `
                <div class="completion-item ${index === selectedCompletionIndex ? 'selected' : ''}"
                     data-index="${index}">
                    ${item.name}
                    <span class="completion-description">${item.desc}</span>
                </div>
            `).join('');
            completionsDiv.classList.add('active');

            // Add click handlers to completion items
            document.querySelectorAll('.completion-item').forEach((el, index) => {
                el.addEventListener('click', () => {
                    executeCompletion(index);
                });
            });
        } else {
            completionsDiv.classList.remove('active');
        }
    }

    // Execute selected completion
    function executeCompletion(index) {
        if (currentCompletions[index]) {
            currentCompletions[index].func();
        }
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't intercept if we're in a contenteditable in edit mode
        if (isEditMode && e.target.contentEditable === 'true') {
            // Allow C-x C-s to save even in edit mode
            if (e.ctrlKey && e.key === 'x') {
                setTimeout(() => {
                    document.addEventListener('keydown', function saveHandler(e2) {
                        if (e2.ctrlKey && e2.key === 's') {
                            e2.preventDefault();
                            exitEditMode(true);
                            document.removeEventListener('keydown', saveHandler);
                        }
                    }, {once: true});
                }, 500);
                return;
            }

            // ESC exits edit mode without saving
            if (e.key === 'Escape') {
                e.preventDefault();
                exitEditMode(false);
                return;
            }

            // Let other keys work normally in edit mode
            return;
        }

        // M-x (Alt+x or Option+x on Mac) - Open minibuffer
        if (e.altKey && e.key === 'x') {
            e.preventDefault();
            openMinibuffer();
            return;
        }

        // M-m (Alt+m) - Toggle sidebar
        if (e.altKey && e.key === 'm' && !isEditMode) {
            e.preventDefault();
            toggleSidebar();
            return;
        }

        // C-n - Create new buffer
        if (e.ctrlKey && e.key === 'n' && !isEditMode) {
            e.preventDefault();
            createNewBuffer();
            return;
        }

        // C-e - Edit current buffer
        if (e.ctrlKey && e.key === 'e' && !isEditMode) {
            e.preventDefault();
            enterEditMode();
            return;
        }

        // C-d - Delete current buffer
        if (e.ctrlKey && e.key === 'd' && !isEditMode) {
            e.preventDefault();
            deleteCurrentBuffer();
            return;
        }

        // C-l - List all buffers
        if (e.ctrlKey && e.key === 'l' && !isEditMode) {
            e.preventDefault();
            openMinibuffer();
            showBufferList();
            return;
        }

        // C-h - Help
        if (e.ctrlKey && e.key === 'h' && !isEditMode) {
            e.preventDefault();
            showHelp();
            return;
        }

        // C-s - Search in current buffer
        if (e.ctrlKey && e.key === 's' && !isEditMode) {
            e.preventDefault();
            searchInBuffer();
            return;
        }

        // C-r - Reload/refresh page
        if (e.ctrlKey && e.key === 'r' && !isEditMode) {
            e.preventDefault();
            location.reload();
            return;
        }

        // C-k - Kill/clear scratch buffer
        if (e.ctrlKey && e.key === 'k' && !isEditMode) {
            e.preventDefault();
            if (currentBufferId === 'scratch') {
                clearScratchBuffer();
            } else {
                showMessage('C-k only works in *scratch* buffer');
            }
            return;
        }

        // M-w - Copy buffer content
        if (e.altKey && e.key === 'w' && !isEditMode) {
            e.preventDefault();
            copyBufferContent();
            return;
        }

        // C-x C-w - Export/save buffer to file
        if (e.ctrlKey && e.key === 'x' && !isEditMode) {
            setTimeout(() => {
                document.addEventListener('keydown', function exportHandler(e2) {
                    if (e2.ctrlKey && e2.key === 'w') {
                        e2.preventDefault();
                        exportBuffer();
                        document.removeEventListener('keydown', exportHandler);
                    }
                }, {once: true});
            }, 500);
            return;
        }

        // M-< - Go to beginning of buffer
        if (e.altKey && e.key === '<' && !isEditMode) {
            e.preventDefault();
            scrollToTop();
            return;
        }

        // M-> - Go to end of buffer
        if (e.altKey && e.key === '>' && !isEditMode) {
            e.preventDefault();
            scrollToBottom();
            return;
        }

        // C-x C-s - Save buffer
        if (e.ctrlKey && e.key === 'x' && !isEditMode) {
            setTimeout(() => {
                document.addEventListener('keydown', function saveHandler(e2) {
                    if (e2.ctrlKey && e2.key === 's') {
                        e2.preventDefault();
                        saveCurrentBuffer();
                        document.removeEventListener('keydown', saveHandler);
                    }
                }, {once: true});
            }, 500);
            return;
        }

        // ESC or C-g - Close minibuffer or exit edit mode
        if (minibuffer.classList.contains('active')) {
            if (e.key === 'Escape' || (e.ctrlKey && e.key === 'g')) {
                e.preventDefault();
                closeMinibuffer();
                return;
            }

            // Enter - Execute selected completion
            if (e.key === 'Enter') {
                e.preventDefault();
                executeCompletion(selectedCompletionIndex);
                return;
            }

            // Up arrow - Move selection up
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedCompletionIndex = Math.max(0, selectedCompletionIndex - 1);
                updateCompletions(currentCompletions);
                return;
            }

            // Down arrow - Move selection down
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedCompletionIndex = Math.min(
                    currentCompletions.length - 1,
                    selectedCompletionIndex + 1
                );
                updateCompletions(currentCompletions);
                return;
            }

            // Tab - Auto-complete to selected item
            if (e.key === 'Tab') {
                e.preventDefault();
                if (currentCompletions[selectedCompletionIndex]) {
                    minibufferInput.value = currentCompletions[selectedCompletionIndex].name;
                }
                return;
            }
        }

        // C-x C-c - Try to quit (Easter egg)
        if (e.ctrlKey && e.key === 'x' && !isEditMode) {
            setTimeout(() => {
                document.addEventListener('keydown', function quitHandler(e2) {
                    if (e2.ctrlKey && e2.key === 'c') {
                        e2.preventDefault();
                        showMessage("Nice try! Use your browser's close button to quit. ;)");
                        document.removeEventListener('keydown', quitHandler);
                    }
                }, {once: true});
            }, 500);
        }
    });

    // Update completions on input
    minibufferInput.addEventListener('input', () => {
        selectedCompletionIndex = 0;
        showBufferList(); // Re-filter based on new input
    });

    // Update time in mode line
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeElement = document.getElementById('mode-line-time');
        if (timeElement) {
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    // Show message in minibuffer area
    function showMessage(text) {
        // Create message area if it doesn't exist
        let messageArea = document.querySelector('.message-area');
        if (!messageArea) {
            messageArea = document.createElement('div');
            messageArea.className = 'message-area';
            document.body.appendChild(messageArea);
        }

        messageArea.textContent = text;
        messageArea.classList.add('active');

        // Hide after 2 seconds
        setTimeout(() => {
            messageArea.classList.remove('active');
        }, 2000);
    }

    // Update time immediately and then every minute
    updateTime();
    setInterval(updateTime, 60000);

    // Initialize custom buffers
    initializeCustomBuffers();

    // Show welcome message
    setTimeout(() => {
        showMessage('Press M-x for commands. C-n=new C-e=edit C-d=delete');
    }, 1000);

    // Random line number updates (simulate activity)
    const lineNumberEl = document.getElementById('line-number');
    setInterval(() => {
        if (lineNumberEl && !minibuffer.classList.contains('active') && !isEditMode) {
            const randomLine = Math.floor(Math.random() * 100) + 1;
            lineNumberEl.textContent = randomLine;
        }
    }, 3000);
});
