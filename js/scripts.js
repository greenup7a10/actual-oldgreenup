// Global variables
let currentPanel = 'console';
let fileName = 'main.js';

// Initialize the IDE
document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    initializeEventListeners();
});

// Initialize editor features
function initializeEditor() {
    const editor = document.getElementById('code-editor');
    
    // Track cursor position
    editor.addEventListener('keyup', updateCursorPosition);
    editor.addEventListener('mouseup', updateCursorPosition);
    
    // Tab key support for indentation
    editor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;
            
            // Insert tab at cursor position
            this.value = value.substring(0, start) + '  ' + value.substring(end);
            this.selectionStart = this.selectionEnd = start + 2;
        }
    });
}

// Initialize all event listeners
function initializeEventListeners() {
    // File explorer items
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', function() {
            if (!this.classList.contains('folder')) {
                selectFile(this);
            }
        });
    });
}

// Select file in explorer
function selectFile(element) {
    // Remove active class from all items
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    element.classList.add('active');
    
    // Update file name if it has a data-file attribute
    if (element.dataset.file) {
        fileName = element.dataset.file;
        document.getElementById('file-name-display').textContent = fileName;
        document.getElementById('tab-name').textContent = fileName;
    }
}

// Update cursor position in status bar
function updateCursorPosition() {
    const editor = document.getElementById('code-editor');
    const text = editor.value.substring(0, editor.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    document.getElementById('cursor-position').textContent = `Ln ${line}, Col ${col}`;
}

// Switch between bottom panel tabs
function switchPanel(panelName) {
    currentPanel = panelName;
    
    // Update active tab
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.panel === panelName) {
            tab.classList.add('active');
        }
    });
    
    // Update panel content based on selected tab
    const output = document.getElementById('output-display');
    if (panelName === 'problems') {
        output.textContent = 'No problems detected.';
    } else if (panelName === 'output') {
        output.textContent = 'Build output will appear here...';
    }
}

// Run the code
function runCode() {
    const editor = document.getElementById('code-editor');
    const code = editor.value;
    const outputDisplay = document.getElementById('output-display');
    
    // Switch to console tab
    switchPanel('console');
    
    // Clear previous output
    outputDisplay.textContent = '';
    
    try {
        // Capture console.log output
        const logs = [];
        const originalLog = console.log;
        
        console.log = function(...args) {
            logs.push(args.map(arg => {
                if (typeof arg === 'object') {
                    return JSON.stringify(arg, null, 2);
                }
                return String(arg);
            }).join(' '));
            originalLog.apply(console, args);
        };
        
        // Execute the code
        eval(code);
        
        // Restore original console.log
        console.log = originalLog;
        
        // Display output
        if (logs.length > 0) {
            outputDisplay.textContent = logs.join('\n');
        } else {
            outputDisplay.textContent = 'Code executed successfully (no output)';
        }
        
    } catch (error) {
        // Display error
        outputDisplay.textContent = `Error: ${error.message}\n\nStack trace:\n${error.stack}`;
        outputDisplay.style.color = '#ff6b6b';
        
        // Reset color after a moment
        setTimeout(() => {
            outputDisplay.style.color = '#DFECC6';
        }, 100);
    }
}

// Save the file
function saveFile() {
    const outputDisplay = document.getElementById('output-display');
    const editor = document.getElementById('code-editor');
    
    // Switch to console tab
    switchPanel('console');
    
    // Simulate save operation
    outputDisplay.textContent = `File "${fileName}" saved successfully at ${new Date().toLocaleTimeString()}`;
    
    // Optional: You could implement actual file saving here
    // For example, using localStorage:
    try {
        const fileContent = editor.value;
        // Note: In a real application, you'd use a backend API
        // This is just a demonstration
        console.log('File content saved:', fileContent.substring(0, 50) + '...');
    } catch (error) {
        outputDisplay.textContent = `Error saving file: ${error.message}`;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
    }
    
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
    }
    
    // Ctrl/Cmd + ` to toggle console
    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        const panel = document.querySelector('.bottom-panel');
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    }
});

// Auto-save functionality (optional)
let autoSaveTimer;
const editor = document.getElementById('code-editor');

if (editor) {
    editor.addEventListener('input', function() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            // Auto-save after 2 seconds of inactivity
            console.log('Auto-saving...');
            // You could implement auto-save here
        }, 2000);
    });
}

// Syntax highlighting helper (basic)
function highlightSyntax(code) {
    // This is a very basic example - for production use a library like Prism.js or CodeMirror
    return code
        .replace(/\b(function|const|let|var|return|if|else|for|while|class)\b/g, '<span class="keyword">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
        .replace(/(["'`])(.*?)\1/g, '<span class="string">$1$2$1</span>');
}

// Console commands
window.clearConsole = function() {
    document.getElementById('output-display').textContent = '';
};

// Export functions for external use
window.ideAPI = {
    runCode,
    saveFile,
    switchPanel,
    clearConsole
};