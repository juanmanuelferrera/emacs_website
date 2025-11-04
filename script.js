// Emacs-style Website JavaScript - M-x Command System with Content Creation

console.log('script.js loaded!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired!');

    // Get DOM elements
    const window_el = document.querySelector('.window');
    const minibuffer = document.getElementById('minibuffer');
    const minibufferInput = document.getElementById('minibuffer-input');
    const minibufferPrompt = document.querySelector('.minibuffer-prompt');
    const completionsDiv = document.getElementById('minibuffer-completions');
    const modeLineBuffer = document.getElementById('mode-line-buffer');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    console.log('Elements found:', {
        window_el: !!window_el,
        minibuffer: !!minibuffer,
        minibufferInput: !!minibufferInput,
        completionsDiv: !!completionsDiv
    });

    // Initialize or load buffers from localStorage
    let customBuffers = JSON.parse(localStorage.getItem('emacs-website-buffers')) || {};
    console.log('Loaded custom buffers from localStorage:', Object.keys(customBuffers).length, 'buffers');
    let currentBufferId = 'home';
    let isEditMode = false;
    let isSidebarOpen = false;
    let selectedSidebarIndex = 0;
    let sidebarItems = [];

    // Minibuffer state
    let minibufferMode = 'command'; // 'command' or 'input'
    let minibufferCallback = null; // Callback for text input mode

    // Default built-in buffers (read-only) with author info
    const builtInBuffers = ['home', 'scratch'];

    const bufferAuthors = {
        'home': 'Jagannath Mishra Dasa',
        'scratch': 'Public'
    };

    // Track viewed content for "recent/new" feature
    let viewedContent = JSON.parse(localStorage.getItem('emacs-website-viewed')) || {};
    let lastVisit = localStorage.getItem('emacs-website-last-visit') || new Date().toISOString();

    // Track command usage history for M-x
    let commandHistory = JSON.parse(localStorage.getItem('emacs-website-command-history')) || {};

    // Clean up cache from deleted buffers
    const deletedBuffers = ['research', 'philosophy', 'projects', 'espanol', 'writings', 'contact'];
    let cacheUpdated = false;

    // Remove deleted buffers from viewedContent
    deletedBuffers.forEach(bufferId => {
        if (viewedContent[bufferId]) {
            delete viewedContent[bufferId];
            cacheUpdated = true;
        }
    });

    // Remove deleted buffers from commandHistory
    deletedBuffers.forEach(bufferId => {
        if (commandHistory[bufferId]) {
            delete commandHistory[bufferId];
            cacheUpdated = true;
        }
    });

    // Save cleaned cache
    if (cacheUpdated) {
        localStorage.setItem('emacs-website-viewed', JSON.stringify(viewedContent));
        localStorage.setItem('emacs-website-command-history', JSON.stringify(commandHistory));
        console.log('Cleaned up cache for deleted buffers');
    }

    // Remove any DOM elements for deleted buffers
    deletedBuffers.forEach(bufferId => {
        const element = document.getElementById(bufferId);
        if (element) {
            element.remove();
            console.log(`Removed DOM element for deleted buffer: ${bufferId}`);
        }
    });

    // Initialize custom buffers on page load
    function initializeCustomBuffers() {
        console.log('Initializing custom buffers from localStorage:', Object.keys(customBuffers));
        Object.keys(customBuffers).forEach(bufferId => {
            const buffer = customBuffers[bufferId];
            console.log(`Loading buffer ${bufferId}: ${buffer.name}, content length: ${buffer.content?.length || 0}`);
            if (!document.getElementById(bufferId)) {
                createBufferElement(bufferId, buffer.name, buffer.content);
            }
        });
        updateSidebar();
    }

    // Show buffer list in main buffer area
    function showBufferListInBuffer() {
        closeMinibuffer();

        // Create buffers list buffer if it doesn't exist
        let buffersListBuffer = document.getElementById('buffers');
        if (!buffersListBuffer) {
            buffersListBuffer = createBufferElement('buffers', 'Buffers', '');
        }

        // Build the buffer list content
        let content = `;; Buffer List\n;; Press Enter on a buffer name to switch to it\n\n`;

        // Built-in buffers
        content += `* Built-in Buffers\n\n`;
        builtInBuffers.forEach(id => {
            const name = id === 'scratch' ? '*scratch*' : id.charAt(0).toUpperCase() + id.slice(1);
            const author = bufferAuthors[id] || 'Unknown';
            content += `  [[${id}][${name}]] -- ${author}\n`;
        });

        // Custom buffers
        if (Object.keys(customBuffers).length > 0) {
            content += `\n* Custom Buffers\n\n`;
            Object.keys(customBuffers).forEach(id => {
                const buffer = customBuffers[id];
                const author = buffer.author || 'Anonymous';
                const created = new Date(buffer.created).toLocaleDateString();
                content += `  [[${id}][${buffer.name}]] -- ${author} (created: ${created})\n`;
            });
        } else {
            content += `\n* Custom Buffers\n\n  (no custom buffers yet - press C-n to create one)\n`;
        }

        content += `\n\n;; Press M-b or ESC to close this buffer\n`;

        // Update content
        const contentDiv = buffersListBuffer.querySelector('.buffer-content');
        contentDiv.textContent = content;

        // Make buffer links clickable
        contentDiv.innerHTML = contentDiv.innerHTML.replace(
            /\[\[([^\]]+)\]\[([^\]]+)\]\]/g,
            '<a href="#" class="buffer-link" data-buffer="$1">$2</a>'
        );

        // Add click handlers to links
        contentDiv.querySelectorAll('.buffer-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const bufferId = link.dataset.buffer;
                const displayName = link.textContent;
                switchBuffer(bufferId, `*${displayName}*`);
            });
        });

        // Switch to buffers list
        switchBuffer('buffers', '*Buffers*');
        showMessage('Buffer list (press M-b or ESC to close)');
    }

    // Toggle sidebar - shows buffer list in sidebar overlay
    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;

        if (isSidebarOpen) {
            // Reset selection to first item
            selectedSidebarIndex = 0;

            // Update sidebar content before showing
            updateSidebar();
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            showMessage('Buffer list (arrow keys to navigate, Enter to select, ESC to close)');
        } else {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            showMessage('Buffer list closed');
        }
    }

    // Update sidebar with current buffers
    function updateSidebar() {
        const customBuffersSection = document.getElementById('custom-buffers-section');
        const customBuffersList = document.getElementById('custom-buffers-list');

        // Build sidebarItems array
        sidebarItems = [];
        builtInBuffers.forEach(id => {
            sidebarItems.push({
                id: id,
                display: id === 'scratch' ? '*scratch*' : '*' + id.charAt(0).toUpperCase() + id.slice(1) + '*',
                name: id === 'scratch' ? '*scratch*' : id.charAt(0).toUpperCase() + id.slice(1)
            });
        });
        Object.keys(customBuffers).forEach(bufferId => {
            const buffer = customBuffers[bufferId];
            sidebarItems.push({
                id: bufferId,
                display: '*' + buffer.name + '*',
                name: buffer.name
            });
        });

        // Update built-in buffers section
        const builtInSection = document.querySelector('.sidebar-section');
        if (builtInSection) {
            builtInSection.innerHTML = `
                <div class="sidebar-section-title">Buffers</div>
                ${builtInBuffers.map((id, index) => {
                    const isCurrentBuffer = currentBufferId === id;
                    const isSelected = index === selectedSidebarIndex;
                    return `
                    <div class="sidebar-item ${isCurrentBuffer ? 'current' : ''} ${isSelected ? 'selected' : ''}"
                         data-buffer="${id}"
                         data-display="${id === 'scratch' ? '*scratch*' : '*' + id.charAt(0).toUpperCase() + id.slice(1) + '*'}"
                         data-index="${index}">
                        ${id === 'scratch' ? '*scratch*' : id.charAt(0).toUpperCase() + id.slice(1)}
                    </div>
                `;
                }).join('')}
            `;
        }

        // Update custom buffers
        if (Object.keys(customBuffers).length > 0) {
            customBuffersSection.style.display = 'block';
            const customStartIndex = builtInBuffers.length;
            customBuffersList.innerHTML = Object.keys(customBuffers).map((bufferId, index) => {
                const buffer = customBuffers[bufferId];
                const globalIndex = customStartIndex + index;
                const isCurrentBuffer = currentBufferId === bufferId;
                const isSelected = globalIndex === selectedSidebarIndex;
                return `
                    <div class="sidebar-item ${isCurrentBuffer ? 'current' : ''} ${isSelected ? 'selected' : ''}"
                         data-buffer="${bufferId}"
                         data-display="*${buffer.name}*"
                         data-index="${globalIndex}">
                        ${buffer.name}
                    </div>
                `;
            }).join('');
        } else {
            customBuffersSection.style.display = 'none';
        }

        // Add click handlers to all sidebar items
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const bufferId = item.dataset.buffer;
                const displayName = item.dataset.display;
                switchBuffer(bufferId, displayName);
                toggleSidebar(); // Close sidebar after selection
            });
        });

        // Scroll selected item into view
        const selectedItem = document.querySelector('.sidebar-item.selected');
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest' });
        }
    }

    // Update sidebar to show current buffer highlighted
    function updateSidebarHighlight() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            if (item.dataset.buffer === currentBufferId) {
                item.classList.add('current');
            } else {
                item.classList.remove('current');
            }
        });
    }

    // Sidebar overlay click handler - close sidebar when clicking outside
    sidebarOverlay.addEventListener('click', () => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
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
            desc: 'Show/hide buffer list (M-b)'
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
        },
        'register': {
            func: () => registerUser(),
            desc: 'Register new account (shared password required)'
        },
        'register-user': {
            func: () => registerUser(),
            desc: 'Register new user (password emailed)'
        },
        'login': {
            func: () => loginUser(),
            desc: 'Login with username and password'
        },
        'logout': {
            func: () => logoutUser(),
            desc: 'Logout and return to authentication screen'
        },
        'filter-by-author': {
            func: () => filterByAuthor(),
            desc: 'View content from a specific author'
        },
        'toggle-folding': {
            func: () => toggleAllFolds(),
            desc: 'Toggle all folds (Shift+TAB)'
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
    // Prompt for input in minibuffer
    function promptInMinibuffer(prompt, defaultValue, callback) {
        if (isEditMode) {
            showMessage('Exit edit mode first (ESC or C-x C-s)');
            return;
        }

        minibufferMode = 'input';
        minibufferCallback = callback;
        minibuffer.classList.add('active');
        minibufferPrompt.textContent = prompt;
        minibufferInput.value = defaultValue || '';
        minibufferInput.focus();
        completionsDiv.classList.remove('active');
    }

    // Confirm yes/no in minibuffer
    function confirmInMinibuffer(prompt, callback) {
        if (isEditMode) {
            showMessage('Exit edit mode first (ESC or C-x C-s)');
            return;
        }

        showMessage(`${prompt} (y/n)`);
        promptInMinibuffer(`${prompt} (y/n): `, '', (answer) => {
            const normalized = answer.toLowerCase().trim();
            if (normalized === 'y' || normalized === 'yes') {
                callback(true);
            } else if (normalized === 'n' || normalized === 'no') {
                callback(false);
            } else {
                showMessage('Please answer y or n');
                setTimeout(() => confirmInMinibuffer(prompt, callback), 500);
            }
        });
    }

    function createNewBuffer() {
        promptInMinibuffer('Buffer name: ', '', (name) => {
            if (!name || name.trim() === '') {
                showMessage('Buffer name cannot be empty');
                return;
            }

            name = name.trim();
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
        });
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
    async function exitEditMode(save = false) {
        isEditMode = false;
        const currentBuffer = document.getElementById(currentBufferId);
        const content = currentBuffer.querySelector('.buffer-content');

        if (save && !builtInBuffers.includes(currentBufferId)) {
            // Save content locally
            const newContent = content.innerHTML;
            console.log(`Saving buffer ${currentBufferId}, content length: ${newContent.length}`);
            customBuffers[currentBufferId].content = newContent;
            customBuffers[currentBufferId].updated = new Date().toISOString();
            localStorage.setItem('emacs-website-buffers', JSON.stringify(customBuffers));
            console.log('Saved to localStorage:', Object.keys(customBuffers));

            // Save to API if logged in
            const token = localStorage.getItem('emacs-website-token');
            if (token) {
                try {
                    const API_URL = 'https://emacs-website.joanmanelferrera-400.workers.dev';

                    // Try to update existing buffer first
                    let response = await fetch(`${API_URL}/api/buffers/${currentBufferId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            content: content.innerHTML
                        })
                    });

                    // If buffer doesn't exist (404 or 403), create it
                    if (response.status === 404 || response.status === 403) {
                        console.log('Buffer not found, creating new one...');
                        response = await fetch(`${API_URL}/api/buffers`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                name: customBuffers[currentBufferId].name,
                                content: content.innerHTML
                            })
                        });

                        if (response.ok) {
                            console.log('Buffer created successfully');
                            showMessage('✓ Buffer created and saved to cloud');
                        } else {
                            const error = await response.json();
                            console.error('Buffer creation failed:', error);
                            showMessage(`✗ Buffer saved locally only (${error.error || 'creation failed'})`);
                        }
                    } else if (response.ok) {
                        console.log('Buffer updated successfully');
                        showMessage('✓ Buffer saved to cloud');
                    } else {
                        const error = await response.json();
                        console.error('Buffer update failed:', error);
                        showMessage(`✗ Buffer saved locally only (${error.error || 'cloud save failed'})`);
                    }
                } catch (error) {
                    showMessage('Buffer saved locally (offline)');
                }
            } else {
                showMessage('Buffer saved locally (not logged in)');
            }
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

        // Re-apply org-mode parsing after editing
        applyOrgMode(currentBufferId);
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
        const bufferIdToDelete = currentBufferId;

        confirmInMinibuffer(`Delete buffer *${bufferName}*?`, (confirmed) => {
            if (!confirmed) {
                showMessage('Delete cancelled');
                return;
            }

            // Remove from DOM
            const bufferElement = document.getElementById(bufferIdToDelete);
            if (bufferElement) {
                bufferElement.remove();
            }

            // Remove from storage
            delete customBuffers[bufferIdToDelete];
            localStorage.setItem('emacs-website-buffers', JSON.stringify(customBuffers));

            // Switch to home
            switchBuffer('home', '*Home*');
            showMessage(`Deleted buffer: *${bufferName}*`);
        });
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

            // Apply org-mode folding automatically
            applyOrgMode(bufferName);

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
        const bufferList = builtInBuffers.map(id => ({
            name: id,
            display: id === 'scratch' ? '*scratch*' : `*${id.charAt(0).toUpperCase() + id.slice(1)}*`
        }));

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
  M-b         : Toggle sidebar menu (buffers)
  C-n         : Create new buffer
  C-e         : Edit current buffer
  C-d         : Delete current buffer
  C-s         : Save buffer
  C-f         : Search in current buffer
  C-l         : List all buffers
  C-h         : Show this help
  C-r         : Reload page
  C-k         : Clear scratch buffer
  M-w         : Copy buffer content
  C-x C-w     : Export buffer to file
  M-<         : Go to beginning
  M->         : Go to end
  ESC         : Cancel operation
  C-g         : Cancel operation
`;

        closeMinibuffer();

        // Create or update help buffer
        const helpBufferId = 'help';
        let helpBuffer = document.getElementById(helpBufferId);

        if (!helpBuffer) {
            helpBuffer = createBufferElement(helpBufferId, 'Help', '');
        }

        const content = helpBuffer.querySelector('.buffer-content');
        content.textContent = `;; Emacs Website Help\n;; Press ESC or M-x to exit\n\nAvailable Commands:\n\n${helpText}\n${keyboardShortcuts}`;

        switchBuffer(helpBufferId, '*Help*');
        showMessage('Showing help. Press ESC to return.');
    }

    // Search in current buffer
    function searchInBuffer() {
        promptInMinibuffer('Search for: ', '', (searchTerm) => {
            if (!searchTerm || searchTerm.trim() === '') {
                showMessage('Search cancelled');
                return;
            }

            searchTerm = searchTerm.trim();
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
        });
    }

    // Clear scratch buffer
    function clearScratchBuffer() {
        if (currentBufferId !== 'scratch') {
            showMessage('C-k only works in *scratch* buffer');
            return;
        }

        confirmInMinibuffer('Clear *scratch* buffer?', (confirmed) => {
            if (!confirmed) {
                showMessage('Clear cancelled');
                return;
            }

            const scratchBuffer = document.getElementById('scratch');
            const content = scratchBuffer.querySelector('.buffer-content');
            content.textContent = ';; This buffer is for notes that are not saved.\n;; Press M-x for available commands\n\n';
            showMessage('*scratch* buffer cleared');
        });
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
        closeMinibuffer();

        const author = bufferAuthors[currentBufferId] || customBuffers[currentBufferId]?.author || 'Unknown';
        const bufferName = modeLineBuffer.textContent;
        const created = customBuffers[currentBufferId]?.created || 'Built-in';
        const modified = customBuffers[currentBufferId]?.modified || 'N/A';

        let info = `;; Buffer Information\n;; Press ESC to return\n\nBuffer: ${bufferName}\nAuthor: ${author}`;
        if (created !== 'Built-in') {
            info += `\nCreated: ${new Date(created).toLocaleString()}`;
            if (modified !== 'N/A') {
                info += `\nModified: ${new Date(modified).toLocaleString()}`;
            }
        }

        // Show info in message area
        showMessage(info);
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

        // Show recent content in minibuffer
        showMessage(`Found ${newContent.length} new/unread buffer${newContent.length > 1 ? 's' : ''}`);
        openMinibuffer();
        updateCompletions(newContent.map(b => ({
            name: b.id,
            desc: `${b.name} ${b.isNew ? '(NEW)' : '(unread)'}`,
            func: () => switchBuffer(b.id, `*${b.name}*`)
        })));
    }

    // Mark buffer as viewed
    function markBufferViewed(bufferId) {
        viewedContent[bufferId] = new Date().toISOString();
        localStorage.setItem('emacs-website-viewed', JSON.stringify(viewedContent));
        localStorage.setItem('emacs-website-last-visit', new Date().toISOString());
    }

    // Register new user (Emacs-style)
    async function registerUser() {
        showMessage('Registration: Enter shared password (ESC to cancel)');

        // Step 1: Ask for registration password
        promptInMinibuffer('Registration password: ', '', async (sharedPassword) => {
            if (!sharedPassword || sharedPassword.trim() === '') {
                showMessage('Registration cancelled');
                return;
            }

            // Verify registration code with server
            const API_URL = 'https://emacs-website.joanmanelferrera-400.workers.dev';
            try {
                const verifyResponse = await fetch(`${API_URL}/api/auth/verify-registration-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: sharedPassword.trim() })
                });

                const verifyData = await verifyResponse.json();

                if (!verifyResponse.ok) {
                    showMessage('✗ Incorrect registration password');
                    return;
                }
            } catch (error) {
                showMessage('✗ Error verifying registration code');
                console.error('Registration code verification error:', error);
                return;
            }

            // Step 2: Ask for email
            showMessage('Password verified! Enter your email...');
            promptInMinibuffer('Email (username): ', '', async (email) => {
                if (!email || email.trim() === '' || !email.includes('@')) {
                    showMessage('✗ Valid email address is required');
                    return;
                }

                email = email.trim();

                // Step 3: Ask for password (min 6 chars)
                showMessage('Choose your password (min 6 characters)...');
                promptInMinibuffer('Password: ', '', async (password) => {
                    if (!password || password.length < 6) {
                        showMessage('✗ Password must be at least 6 characters');
                        return;
                    }

                    showMessage('Registering...');

                    try {
                        const API_URL = 'https://emacs-website.joanmanelferrera-400.workers.dev';

                        const response = await fetch(`${API_URL}/api/auth/register`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username: email,
                                email: email,
                                password: password
                            })
                        });

                        const data = await response.json();

                        if (response.ok) {
                            // Store token and username for immediate login
                            localStorage.setItem('emacs-website-token', data.token);
                            localStorage.setItem('emacs-website-username', data.username);
                            showMessage(`✓ Success! Logged in as ${email}`);
                            // Reload to show content
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        } else {
                            showMessage(`✗ ${data.error || 'Registration failed'}`);
                        }
                    } catch (error) {
                        showMessage('✗ Network error. Please try again.');
                    }
                });
            });
        });
    }

    // Old dialog-based registerUser (now replaced with minibuffer version above)
    async function registerUserOld() {
        closeMinibuffer();

        let passwordVerified = false;

        // Create custom registration dialog (Emacs-style)
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-dim);
            border: 2px solid var(--cyan);
            padding: 30px;
            z-index: 2000;
            font-family: "iA Writer Mono S", "Menlo", "Monaco", monospace;
            width: 500px;
            max-width: 90%;
            box-shadow: 0 4px 20px rgba(0, 215, 208, 0.2);
        `;

        dialog.innerHTML = `
            <div style="color: var(--cyan); font-size: 18px; margin-bottom: 8px; font-weight: bold;">
                ;; Register New Account
            </div>
            <div style="color: var(--fg-dim); font-size: 13px; margin-bottom: 25px; line-height: 1.5;">
                This is a private community. Registration requires knowing the shared password.
            </div>

            <!-- Registration Password Section -->
            <div id="password-section" style="border: 2px solid var(--yellow); padding: 15px; margin-bottom: 20px; background: rgba(208, 188, 0, 0.05);">
                <div style="color: var(--yellow); font-size: 12px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">
                    ⚠ Step 1: Enter Registration Password
                </div>
                <div style="color: var(--fg-dim); font-size: 11px; margin-bottom: 10px;">
                    You must know the shared registration password to proceed.
                </div>
                <input type="password" id="reg-shared-password" style="
                    width: 100%;
                    background: var(--bg-main);
                    border: 2px solid var(--yellow);
                    color: var(--fg-main);
                    padding: 10px;
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: bold;
                " placeholder="Enter registration password..." autofocus>
                <button id="verify-password-btn" style="
                    width: 100%;
                    margin-top: 10px;
                    background: var(--yellow);
                    color: var(--bg-main);
                    border: none;
                    padding: 10px;
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                ">Verify Password</button>
            </div>

            <!-- Email Section (hidden until password verified) -->
            <div id="email-section" style="display: none; border-left: 3px solid var(--green); padding-left: 15px; margin-bottom: 20px;">
                <div style="color: var(--green); font-size: 12px; font-weight: bold; margin-bottom: 12px;">
                    ✓ Password Verified - Step 2: Enter Email
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="color: var(--fg-dim); display: block; margin-bottom: 5px; font-size: 11px;">
                        Email (will be your username):
                    </label>
                    <input type="email" id="reg-email" style="
                        width: 100%;
                        background: var(--bg-main);
                        border: 1px solid var(--bg-active);
                        color: var(--fg-main);
                        padding: 10px;
                        font-family: inherit;
                        font-size: 14px;
                    " placeholder="your.email@example.com">
                </div>
                <div style="color: var(--cyan); font-size: 11px; margin-top: 8px; font-style: italic;">
                    ✓ A secure random password will be generated and emailed to you
                </div>
            </div>

            <div style="display: flex; gap: 10px;">
                <button id="reg-submit" style="
                    flex: 1;
                    background: var(--cyan);
                    color: var(--bg-main);
                    border: none;
                    padding: 10px;
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    display: none;
                ">Register</button>
                <button id="reg-cancel" style="
                    flex: 1;
                    background: var(--bg-active);
                    color: var(--fg-main);
                    border: 1px solid var(--fg-dim);
                    padding: 10px;
                    font-family: inherit;
                    font-size: 14px;
                    cursor: pointer;
                ">Cancel (ESC)</button>
            </div>
            <div id="reg-message" style="
                margin-top: 15px;
                padding: 10px;
                font-size: 12px;
                display: none;
            "></div>
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1999;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        const passwordSection = document.getElementById('password-section');
        const emailSection = document.getElementById('email-section');
        const sharedPasswordInput = document.getElementById('reg-shared-password');
        const verifyPasswordBtn = document.getElementById('verify-password-btn');
        const emailInput = document.getElementById('reg-email');
        const submitBtn = document.getElementById('reg-submit');
        const cancelBtn = document.getElementById('reg-cancel');
        const messageDiv = document.getElementById('reg-message');

        sharedPasswordInput.focus();

        // Verify password button
        verifyPasswordBtn.addEventListener('click', async () => {
            const sharedPassword = sharedPasswordInput.value.trim();

            // Verify registration code with server
            const API_URL = 'https://emacs-website.joanmanelferrera-400.workers.dev';
            verifyPasswordBtn.disabled = true;
            verifyPasswordBtn.textContent = 'Verifying...';

            try {
                const verifyResponse = await fetch(`${API_URL}/api/auth/verify-registration-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: sharedPassword })
                });

                const verifyData = await verifyResponse.json();

                if (!verifyResponse.ok) {
                    messageDiv.textContent = '✗ Incorrect registration password';
                    messageDiv.style.display = 'block';
                    messageDiv.style.background = 'rgba(255, 95, 89, 0.2)';
                    messageDiv.style.border = '2px solid var(--red)';
                    messageDiv.style.color = 'var(--red)';
                    messageDiv.style.fontWeight = 'bold';
                    sharedPasswordInput.value = '';
                    sharedPasswordInput.focus();
                    verifyPasswordBtn.disabled = false;
                    verifyPasswordBtn.textContent = 'Verify Password';
                    return;
                }

                // Password correct - show email section
                passwordVerified = true;
                passwordSection.style.display = 'none';
                emailSection.style.display = 'block';
                submitBtn.style.display = 'block';
                messageDiv.style.display = 'none';
                emailInput.focus();
            } catch (error) {
                messageDiv.textContent = '✗ Error verifying registration code';
                messageDiv.style.display = 'block';
                messageDiv.style.background = 'rgba(255, 95, 89, 0.2)';
                messageDiv.style.border = '2px solid var(--red)';
                messageDiv.style.color = 'var(--red)';
                console.error('Registration code verification error:', error);
                verifyPasswordBtn.disabled = false;
                verifyPasswordBtn.textContent = 'Verify Password';
            }
        });

        // Allow Enter key to verify password
        sharedPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyPasswordBtn.click();
            }
        });

        // Handle final submission
        const handleSubmit = async () => {
            if (!passwordVerified) {
                messageDiv.textContent = '✗ Please verify password first';
                messageDiv.style.display = 'block';
                messageDiv.style.background = 'rgba(255, 95, 89, 0.2)';
                messageDiv.style.border = '2px solid var(--red)';
                messageDiv.style.color = 'var(--red)';
                return;
            }

            const email = emailInput.value.trim();

            if (!email || !email.includes('@')) {
                messageDiv.textContent = '✗ Error: Valid email address is required';
                messageDiv.style.display = 'block';
                messageDiv.style.background = 'rgba(255, 95, 89, 0.2)';
                messageDiv.style.border = '2px solid var(--red)';
                messageDiv.style.color = 'var(--red)';
                messageDiv.style.fontWeight = 'bold';
                return;
            }

            submitBtn.textContent = 'Registering...';
            submitBtn.disabled = true;

            try {
                const API_URL = 'https://emacs-website.joanmanelferrera-400.workers.dev';

                const response = await fetch(`${API_URL}/api/auth/register-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: email,
                        email: email
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = `✓ Success! Password has been emailed to ${email}`;
                    messageDiv.style.display = 'block';
                    messageDiv.style.background = 'rgba(68, 188, 68, 0.2)';
                    messageDiv.style.border = '2px solid var(--green)';
                    messageDiv.style.color = 'var(--green)';
                    messageDiv.style.fontWeight = 'bold';

                    setTimeout(() => {
                        overlay.remove();
                        dialog.remove();
                        showMessage(`Registration successful! Check ${email} for password`);
                    }, 3000);
                } else {
                    messageDiv.textContent = `✗ ${data.error || 'Registration failed'}`;
                    messageDiv.style.display = 'block';
                    messageDiv.style.background = 'rgba(255, 95, 89, 0.2)';
                    messageDiv.style.border = '2px solid var(--red)';
                    messageDiv.style.color = 'var(--red)';
                    messageDiv.style.fontWeight = 'bold';
                    submitBtn.textContent = 'Register';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                messageDiv.textContent = '✗ Network error. Please try again.';
                messageDiv.style.display = 'block';
                messageDiv.style.background = 'rgba(255, 95, 89, 0.2)';
                messageDiv.style.border = '2px solid var(--red)';
                messageDiv.style.color = 'var(--red)';
                messageDiv.style.fontWeight = 'bold';
                submitBtn.textContent = 'Register';
                submitBtn.disabled = false;
            }
        };

        const handleCancel = () => {
            overlay.remove();
            dialog.remove();
            showMessage('Registration cancelled');
        };

        submitBtn.addEventListener('click', handleSubmit);
        cancelBtn.addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleCancel);

        // Keyboard shortcuts
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
            if (e.ctrlKey && e.key === 'c') {
                setTimeout(() => {
                    document.addEventListener('keydown', function ccHandler(e2) {
                        if (e2.ctrlKey && e2.key === 'c') {
                            e2.preventDefault();
                            handleSubmit();
                            document.removeEventListener('keydown', ccHandler);
                        }
                    }, { once: true });
                }, 500);
            }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
            }
        });
    }

    // Login user
    async function loginUser() {
        showMessage('Login: Enter your email (ESC to cancel)');

        // Step 1: Ask for username (email)
        promptInMinibuffer('Email (username): ', '', (username) => {
            if (!username || username.trim() === '') {
                showMessage('Login cancelled');
                return;
            }

            username = username.trim();

            // Step 2: Ask for password
            showMessage('Enter your password...');
            promptInMinibuffer('Password: ', '', async (password) => {
                if (!password || password.trim() === '') {
                    showMessage('Login cancelled');
                    return;
                }

                showMessage('Logging in...');

                try {
                    const API_URL = 'https://emacs-website.joanmanelferrera-400.workers.dev';

                    const response = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password: password.trim() })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        localStorage.setItem('emacs-website-token', data.token);
                        localStorage.setItem('emacs-website-username', data.username);
                        showMessage(`✓ Logged in as ${data.username}`);
                        // Reload to show content
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        showMessage(`✗ Login failed: ${data.error}`);
                    }
                } catch (error) {
                    showMessage('✗ Login failed: Network error');
                }
            });
        });
    }

    // Logout user
    function logoutUser() {
        closeMinibuffer();

        const username = localStorage.getItem('emacs-website-username');
        if (!username) {
            showMessage('Not logged in');
            return;
        }

        // Clear authentication
        localStorage.removeItem('emacs-website-token');
        localStorage.removeItem('emacs-website-username');

        showMessage(`Logged out ${username}`);

        // Reload to show auth screen
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    // Apply org-mode folding automatically to current buffer
    function applyOrgMode(bufferId) {
        const targetBuffer = document.getElementById(bufferId || currentBufferId);
        if (!targetBuffer) return;

        const content = targetBuffer.querySelector('.buffer-content');
        if (!content) return;

        // Get plain text content (stripping any existing org-mode markup)
        const text = content.textContent || content.innerText;

        // Only process if there are org-mode headings (lines starting with *)
        if (!text.match(/^\*+\s+/m)) return;
        const lines = text.split('\n');
        let result = [];
        let currentLevel = 0;
        let contentBuffer = [];

        lines.forEach(line => {
            const match = line.match(/^(\*+)\s+(.+)$/);

            if (match) {
                // Close previous section
                if (contentBuffer.length > 0) {
                    result.push(`<div class="org-content">${contentBuffer.join('\n')}</div>`);
                    contentBuffer = [];
                }

                const level = match[1].length;
                const heading = match[2];
                result.push(`<div class="org-heading org-level-${level}" data-level="${level}">${heading}</div>`);
                currentLevel = level;
            } else {
                contentBuffer.push(line);
            }
        });

        // Close final section
        if (contentBuffer.length > 0) {
            result.push(`<div class="org-content">${contentBuffer.join('\n')}</div>`);
        }

        content.innerHTML = result.join('\n');

        // Add click handlers
        content.querySelectorAll('.org-heading').forEach(heading => {
            heading.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleFold(this);
            });
        });

        // Calculate max heights
        content.querySelectorAll('.org-content').forEach(content => {
            content.style.maxHeight = content.scrollHeight + 'px';
        });
    }

    // Toggle a specific fold
    function toggleFold(heading) {
        const nextElement = heading.nextElementSibling;
        if (nextElement && nextElement.classList.contains('org-content')) {
            heading.classList.toggle('collapsed');
            nextElement.classList.toggle('collapsed');
        }
    }

    // Toggle all folds (Shift+TAB)
    function toggleAllFolds() {
        const currentBuffer = document.getElementById(currentBufferId);
        const headings = currentBuffer.querySelectorAll('.org-heading');

        if (headings.length === 0) {
            showMessage('No org-mode headings found in current buffer.');
            return;
        }

        // Check if any are collapsed
        const anyCollapsed = Array.from(headings).some(h => h.classList.contains('collapsed'));

        headings.forEach(heading => {
            const nextElement = heading.nextElementSibling;
            if (nextElement && nextElement.classList.contains('org-content')) {
                if (anyCollapsed) {
                    // Expand all
                    heading.classList.remove('collapsed');
                    nextElement.classList.remove('collapsed');
                } else {
                    // Collapse all
                    heading.classList.add('collapsed');
                    nextElement.classList.add('collapsed');
                }
            }
        });

        showMessage(anyCollapsed ? 'Expanded all sections' : 'Collapsed all sections');
    }

    // Filter content by author
    function filterByAuthor() {
        promptInMinibuffer('Author name: ', '', (author) => {
            if (!author || author.trim() === '') {
                showMessage('Filter cancelled');
                return;
            }

            author = author.trim();

        // Find all buffers by this author
        const matchingBuffers = [];

        // Check built-in buffers
        builtInBuffers.forEach(bufferId => {
            const bufferAuthor = bufferAuthors[bufferId];
            if (bufferAuthor && (
                bufferAuthor.toLowerCase().includes(author.toLowerCase()) ||
                bufferId.toLowerCase().includes(author.toLowerCase())
            )) {
                matchingBuffers.push({
                    id: bufferId,
                    name: bufferId.charAt(0).toUpperCase() + bufferId.slice(1),
                    author: bufferAuthor,
                    display: `*${bufferId.charAt(0).toUpperCase() + bufferId.slice(1)}*`
                });
            }
        });

        // Check custom buffers
        Object.keys(customBuffers).forEach(bufferId => {
            const buffer = customBuffers[bufferId];
            const bufferAuthor = buffer.author || 'Anonymous';
            if (bufferAuthor.toLowerCase().includes(author.toLowerCase()) ||
                buffer.name.toLowerCase().includes(author.toLowerCase())) {
                matchingBuffers.push({
                    id: bufferId,
                    name: buffer.name,
                    author: bufferAuthor,
                    display: `*${buffer.name}*`
                });
            }
        });

        if (matchingBuffers.length === 0) {
            showMessage(`No content found by author: ${author}`);
            return;
        }

            // Show results
            if (matchingBuffers.length === 0) {
                showMessage(`No buffers found by author: ${author}`);
                return;
            }

            showMessage(`Found ${matchingBuffers.length} buffer${matchingBuffers.length > 1 ? 's' : ''} by "${author}"`);

            // Open minibuffer with filtered list
            openMinibuffer();
            updateCompletions(matchingBuffers.map(b => ({
                name: b.id,
                desc: `${b.name} by ${b.author}`,
                func: () => switchBuffer(b.id, b.display)
            })));
        });
    }

    // Open minibuffer with M-x
    function openMinibuffer() {
        console.log('openMinibuffer called');
        if (isEditMode) {
            showMessage('Exit edit mode first (ESC or C-x C-s)');
            return;
        }

        minibuffer.classList.add('active');
        minibufferInput.value = '';
        minibufferInput.focus();

        // Get all commands and sort by usage history
        const commandList = Object.keys(commands).map(cmd => ({
            name: cmd,
            desc: commands[cmd].desc,
            func: commands[cmd].func,
            usage: commandHistory[cmd] || { count: 0, lastUsed: null }
        }));

        // Sort commands:
        // 1. Recently used (within last 5 minutes) at top
        // 2. Then by total usage count
        // 3. Then alphabetically
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        commandList.sort((a, b) => {
            const aRecent = a.usage.lastUsed && new Date(a.usage.lastUsed).getTime() > fiveMinutesAgo;
            const bRecent = b.usage.lastUsed && new Date(b.usage.lastUsed).getTime() > fiveMinutesAgo;

            // Recently used commands first
            if (aRecent && !bRecent) return -1;
            if (!aRecent && bRecent) return 1;

            // If both recent or both not recent, sort by count
            if (a.usage.count !== b.usage.count) {
                return b.usage.count - a.usage.count;
            }

            // If same count, sort alphabetically
            return a.name.localeCompare(b.name);
        });

        updateCompletions(commandList);
    }

    // Close minibuffer
    function closeMinibuffer() {
        minibuffer.classList.remove('active');
        completionsDiv.classList.remove('active');
        minibufferInput.value = '';
        currentCompletions = [];
        selectedCompletionIndex = 0;
        minibufferMode = 'command';
        minibufferCallback = null;
        minibufferPrompt.textContent = 'M-x ';
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
            const commandName = currentCompletions[index].name;

            // Track command usage
            if (!commandHistory[commandName]) {
                commandHistory[commandName] = {
                    count: 0,
                    lastUsed: null
                };
            }
            commandHistory[commandName].count++;
            commandHistory[commandName].lastUsed = new Date().toISOString();

            // Save to localStorage
            localStorage.setItem('emacs-website-command-history', JSON.stringify(commandHistory));

            // Execute the command
            currentCompletions[index].func();
        }
    }

    // Global keyboard shortcuts
    console.log('Attaching keydown event listener...');

    const keydownHandler = (e) => {
        console.log('🔑 Keydown event:', {
            key: e.key,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            isEditMode: isEditMode,
            target: e.target.tagName
        });

        // Don't intercept if we're in a contenteditable in edit mode
        if (isEditMode && e.target.contentEditable === 'true') {
            // C-s - Save and exit edit mode
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                exitEditMode(true);
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

        // M-x (Alt+x, Option+x, or Command+x on Mac) - Open minibuffer
        if ((e.altKey || e.metaKey) && e.key === 'x') {
            console.log('M-x detected!');
            e.preventDefault();
            openMinibuffer();
            return;
        }

        // M-b (Alt+b or Command+b on Mac) - Toggle sidebar (buffers)
        if ((e.altKey || e.metaKey) && e.key === 'b' && !isEditMode) {
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

        // C-s - Save buffer (simplified from C-x C-s)
        if (e.ctrlKey && e.key === 's' && !isEditMode) {
            e.preventDefault();
            saveCurrentBuffer();
            return;
        }

        // C-f - Search in current buffer (changed from C-s)
        if (e.ctrlKey && e.key === 'f' && !isEditMode) {
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

        // C-x w - Export/save buffer to file (Emacs-style: press C-x, release, then press w)
        if (e.ctrlKey && e.key === 'x' && !isEditMode) {
            setTimeout(() => {
                document.addEventListener('keydown', function exportHandler(e2) {
                    if (e2.key === 'w') {
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

        // TAB - Toggle fold at cursor / on clicked heading
        if (e.key === 'Tab' && !isEditMode && !minibuffer.classList.contains('active')) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let node = selection.anchorNode;
                // Find parent org-heading
                while (node && node !== document.body) {
                    if (node.classList && node.classList.contains('org-heading')) {
                        e.preventDefault();
                        toggleFold(node);
                        return;
                    }
                    node = node.parentNode;
                }
            }
        }

        // Shift+TAB - Toggle all folds
        if (e.shiftKey && e.key === 'Tab' && !isEditMode && !minibuffer.classList.contains('active')) {
            e.preventDefault();
            toggleAllFolds();
            return;
        }

        // ESC or C-g - Close sidebar, minibuffer, or exit edit mode
        if (e.key === 'Escape' || (e.ctrlKey && e.key === 'g')) {
            // First priority: close sidebar if open
            if (isSidebarOpen) {
                e.preventDefault();
                toggleSidebar();
                return;
            }

            // Second priority: close minibuffer if open
            if (minibuffer.classList.contains('active')) {
                e.preventDefault();
                closeMinibuffer();
                return;
            }
        }

        // Sidebar keyboard navigation
        if (isSidebarOpen) {
            // Arrow Down - Navigate to next buffer
            if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
                e.preventDefault();
                selectedSidebarIndex = (selectedSidebarIndex + 1) % sidebarItems.length;
                updateSidebar();
                return;
            }

            // Arrow Up - Navigate to previous buffer
            if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
                e.preventDefault();
                selectedSidebarIndex = selectedSidebarIndex === 0
                    ? sidebarItems.length - 1
                    : selectedSidebarIndex - 1;
                updateSidebar();
                return;
            }

            // Enter - Select highlighted buffer
            if (e.key === 'Enter') {
                e.preventDefault();
                if (sidebarItems[selectedSidebarIndex]) {
                    const selectedItem = sidebarItems[selectedSidebarIndex];
                    switchBuffer(selectedItem.id, selectedItem.display);
                    toggleSidebar();
                }
                return;
            }

            // Don't process other keys while sidebar is open
            return;
        }

        // Other minibuffer key handlers
        if (minibuffer.classList.contains('active')) {

            // Enter - Execute selected completion or accept input
            if (e.key === 'Enter') {
                e.preventDefault();
                if (minibufferMode === 'input') {
                    // Text input mode - call callback with the input value
                    const value = minibufferInput.value;
                    const callback = minibufferCallback;
                    closeMinibuffer();
                    if (callback) {
                        callback(value);
                    }
                } else {
                    // Command mode - execute selected completion
                    executeCompletion(selectedCompletionIndex);
                }
                return;
            }

            // Up arrow - Move selection up (command mode only)
            if (e.key === 'ArrowUp' && minibufferMode === 'command') {
                e.preventDefault();
                selectedCompletionIndex = Math.max(0, selectedCompletionIndex - 1);
                updateCompletions(currentCompletions);
                return;
            }

            // Down arrow - Move selection down (command mode only)
            if (e.key === 'ArrowDown' && minibufferMode === 'command') {
                e.preventDefault();
                selectedCompletionIndex = Math.min(
                    currentCompletions.length - 1,
                    selectedCompletionIndex + 1
                );
                updateCompletions(currentCompletions);
                return;
            }

            // Tab - Auto-complete to selected item (command mode only)
            if (e.key === 'Tab' && minibufferMode === 'command') {
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
    };

    // Attach the keydown handler to the document
    document.addEventListener('keydown', keydownHandler);

    // Update completions on input (command mode only)
    minibufferInput.addEventListener('input', () => {
        if (minibufferMode === 'command') {
            selectedCompletionIndex = 0;

            // Re-filter commands based on new input, preserving usage history for sorting
            const commandList = Object.keys(commands).map(cmd => ({
                name: cmd,
                desc: commands[cmd].desc,
                func: commands[cmd].func,
                usage: commandHistory[cmd] || { count: 0, lastUsed: null }
            }));

            // Sort by usage history (same logic as openMinibuffer)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            commandList.sort((a, b) => {
                const aRecent = a.usage.lastUsed && new Date(a.usage.lastUsed).getTime() > fiveMinutesAgo;
                const bRecent = b.usage.lastUsed && new Date(b.usage.lastUsed).getTime() > fiveMinutesAgo;

                if (aRecent && !bRecent) return -1;
                if (!aRecent && bRecent) return 1;
                if (a.usage.count !== b.usage.count) {
                    return b.usage.count - a.usage.count;
                }
                return a.name.localeCompare(b.name);
            });

            updateCompletions(commandList);
        }
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

    // Check and display login status - REQUIRE LOGIN TO VIEW CONTENT
    const token = localStorage.getItem('emacs-website-token');
    const username = localStorage.getItem('emacs-website-username');

    function showAuthRequired() {
        // Hide all buffers
        document.querySelectorAll('.buffer').forEach(buf => {
            buf.style.display = 'none';
        });

        // Hide sidebar
        sidebar.style.display = 'none';

        // Show authentication required message
        const authBuffer = document.createElement('div');
        authBuffer.className = 'buffer active';
        authBuffer.id = 'auth-required';
        authBuffer.innerHTML = `
            <div class="buffer-content" style="max-width: 600px; margin: 50px auto; text-align: center;">
                <div style="margin-bottom: 30px;">
                    <div style="font-size: 48px; color: var(--cyan); margin-bottom: 20px;">🔒</div>
                    <h1 style="color: var(--cyan); font-size: 28px; margin-bottom: 10px;">
                        ;; Authentication Required
                    </h1>
                    <p style="color: var(--fg-dim); font-size: 16px; line-height: 1.6;">
                        This content is private. You must be logged in to view.
                    </p>
                </div>

                <div style="background: var(--bg-dim); border: 2px solid var(--cyan); padding: 30px; margin-bottom: 25px;">
                    <h2 style="color: var(--green); font-size: 18px; margin-bottom: 15px;">Emacs-Style Commands</h2>
                    <div style="text-align: left; display: inline-block;">
                        <p style="color: var(--fg-main); margin: 10px 0;">
                            <code style="background: var(--bg-main); padding: 4px 8px; color: var(--cyan);">M-x register-user</code>
                            <span style="color: var(--fg-dim); margin-left: 10px;">→ Create new account</span>
                        </p>
                        <p style="color: var(--fg-main); margin: 10px 0;">
                            <code style="background: var(--bg-main); padding: 4px 8px; color: var(--cyan);">M-x login</code>
                            <span style="color: var(--fg-dim); margin-left: 10px;">→ Login to existing account</span>
                        </p>
                    </div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--bg-active);">
                        <p style="color: var(--fg-dim); font-size: 13px; font-style: italic;">
                            Press <strong style="color: var(--yellow);">M-x</strong> (Alt+x or Cmd+x on Mac) to open command palette
                        </p>
                    </div>
                </div>

                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
                    <a href="/register.html" style="
                        background: var(--cyan);
                        color: var(--bg-main);
                        border: none;
                        padding: 15px 30px;
                        font-family: inherit;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                    ">Register →</a>
                    <a href="/login.html" style="
                        background: var(--bg-active);
                        color: var(--fg-main);
                        border: 2px solid var(--cyan);
                        padding: 15px 30px;
                        font-family: inherit;
                        font-size: 16px;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                    ">Login</a>
                </div>
            </div>
        `;
        window_el.appendChild(authBuffer);
        modeLineBuffer.textContent = '*Authentication Required*';
    }

    if (token && username) {
        console.log(`Logged in as: ${username}`);
        // Add user indicator to mode line
        const modeLineTime = document.getElementById('mode-line-time');
        if (modeLineTime) {
            const userIndicator = document.createElement('span');
            userIndicator.style.cssText = 'color: var(--green); margin-right: 15px;';
            userIndicator.textContent = `✓ ${username}`;
            modeLineTime.parentNode.insertBefore(userIndicator, modeLineTime);
        }

        // Apply org-mode folding to all buffers on page load
        builtInBuffers.forEach(bufferId => {
            applyOrgMode(bufferId);
        });
        Object.keys(customBuffers).forEach(bufferId => {
            applyOrgMode(bufferId);
        });

        setTimeout(() => {
            showMessage(`Logged in as ${username}. Press M-x for commands.`);
        }, 500);
    } else {
        console.log('Not logged in. Showing authentication required.');
        showAuthRequired();
        setTimeout(() => {
            showMessage('Authentication required. Press M-x to login or register.');
        }, 500);
    }

    // Random line number updates (simulate activity)
    const lineNumberEl = document.getElementById('line-number');
    setInterval(() => {
        if (lineNumberEl && !minibuffer.classList.contains('active') && !isEditMode) {
            const randomLine = Math.floor(Math.random() * 100) + 1;
            lineNumberEl.textContent = randomLine;
        }
    }, 3000);
});
