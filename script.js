// Emacs-style Website JavaScript - M-x Command System

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const buffers = document.querySelectorAll('.buffer');
    const minibuffer = document.getElementById('minibuffer');
    const minibufferInput = document.getElementById('minibuffer-input');
    const completionsDiv = document.getElementById('minibuffer-completions');
    const modeLineBuffer = document.getElementById('mode-line-buffer');

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

    // Buffer switching function
    function switchBuffer(bufferName, displayName) {
        // Hide all buffers
        buffers.forEach(b => b.classList.remove('active'));

        // Show target buffer
        const targetBuffer = document.getElementById(bufferName);
        if (targetBuffer) {
            targetBuffer.classList.add('active');
            modeLineBuffer.textContent = displayName;
            closeMinibuffer();
            showMessage(`Switched to ${displayName}`);

            // Scroll to top
            targetBuffer.scrollTop = 0;
        }
    }

    // Show buffer list in minibuffer
    function showBufferList() {
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
        alert(`Available Commands:\n\n${helpText}\n\nPress M-x (Alt+x) to run a command`);
        closeMinibuffer();
    }

    // Open minibuffer with M-x
    function openMinibuffer() {
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
        // M-x (Alt+x or Option+x on Mac) - Open minibuffer
        if (e.altKey && e.key === 'x') {
            e.preventDefault();
            openMinibuffer();
            return;
        }

        // ESC or C-g - Close minibuffer
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
        if (e.ctrlKey && e.key === 'x') {
            setTimeout(() => {
                document.addEventListener('keydown', function quitHandler(e2) {
                    if (e2.ctrlKey && e2.key === 'c') {
                        e2.preventDefault();
                        showMessage("Nice try! Use your browser's close button to quit. ;)");
                        document.removeEventListener('keydown', quitHandler);
                    }
                });
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

    // Show welcome message
    setTimeout(() => {
        showMessage('Press M-x for commands (Alt+x or Option+x on Mac)');
    }, 1000);

    // Random line number updates (simulate activity)
    const lineNumberEl = document.getElementById('line-number');
    setInterval(() => {
        if (lineNumberEl && !minibuffer.classList.contains('active')) {
            const randomLine = Math.floor(Math.random() * 100) + 1;
            lineNumberEl.textContent = randomLine;
        }
    }, 3000);
});
