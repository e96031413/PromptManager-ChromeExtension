class PromptUI {
    constructor(storage) {
        this.storage = storage;
        this.themeKey = 'theme';
        this.setupEventListeners();
        this.loadTheme();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Import/Export
        const importExport = document.getElementById('importExport');
        if (importExport) {
            importExport.addEventListener('click', () => this.handleImportExport());
        }

        // Search and filter
        const searchInput = document.getElementById('searchPrompts');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.handleSearch());
        }

        // Add prompt button
        const addPrompt = document.getElementById('addPrompt');
        if (addPrompt) {
            addPrompt.addEventListener('click', () => this.showPromptModal());
        }

        // Cancel button
        const cancelPrompt = document.getElementById('cancelPrompt');
        if (cancelPrompt) {
            cancelPrompt.addEventListener('click', () => this.hidePromptModal());
        }

        // Modal form
        const promptForm = document.getElementById('promptForm');
        if (promptForm) {
            promptForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handlePromptSubmit(e);
            });
        }
    }

    async loadTheme() {
        const result = await chrome.storage.local.get(this.themeKey);
        const theme = result[this.themeKey] || 'light';
        document.body.setAttribute('data-theme', theme);
    }

    async toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        await chrome.storage.local.set({ [this.themeKey]: newTheme });
    }

    async refreshPromptsList() {
        const searchQuery = document.getElementById('searchPrompts')?.value || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const prompts = await this.storage.searchPrompts(searchQuery, categoryFilter);
        
        const promptsList = document.getElementById('promptsList');
        if (!promptsList) return;

        promptsList.innerHTML = '';

        prompts.forEach(prompt => {
            const promptElement = this.createPromptElement(prompt);
            promptsList.appendChild(promptElement);
        });
    }

    createPromptElement(prompt) {
        const div = document.createElement('div');
        div.className = 'prompt-item';
        div.innerHTML = `
            <h3>${prompt.title}</h3>
            ${prompt.category ? `<span class="category">${prompt.category}</span>` : ''}
            <div class="actions">
                <button class="edit">✏️</button>
                <button class="delete">🗑️</button>
            </div>
        `;

        div.querySelector('.edit').addEventListener('click', () => this.showPromptModal(prompt));
        div.querySelector('.delete').addEventListener('click', () => this.deletePrompt(prompt.id));

        return div;
    }

    async refreshCategoryFilter() {
        const categories = await this.storage.getCategories();
        const select = document.getElementById('categoryFilter');
        if (!select) return;

        const currentValue = select.value;

        select.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });

        select.value = currentValue;
    }

    showPromptModal(prompt = null) {
        const modal = document.getElementById('promptModal');
        const form = document.getElementById('promptForm');
        const title = document.getElementById('modalTitle');

        if (!modal || !form || !title) return;

        title.textContent = prompt ? 'Edit Prompt' : 'Add New Prompt';
        form.elements.promptTitle.value = prompt?.title || '';
        form.elements.promptContent.value = prompt?.content || '';
        form.elements.promptCategory.value = prompt?.category || '';
        form.dataset.promptId = prompt?.id || '';

        modal.style.display = 'block';
    }

    hidePromptModal() {
        const modal = document.getElementById('promptModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handlePromptSubmit(e) {
        const form = e.target;
        const promptData = {
            id: form.dataset.promptId,
            title: form.elements.promptTitle.value,
            content: form.elements.promptContent.value,
            category: form.elements.promptCategory.value
        };

        await this.storage.savePrompt(promptData);
        this.hidePromptModal();
        await this.refreshPromptsList();
        await this.refreshCategoryFilter();
    }

    async deletePrompt(id) {
        if (confirm('Are you sure you want to delete this prompt?')) {
            await this.storage.deletePrompt(id);
            await this.refreshPromptsList();
            await this.refreshCategoryFilter();
        }
    }

    async handleSearch() {
        await this.refreshPromptsList();
    }

    async handleImportExport() {
        const action = confirm('Click OK to export prompts, or Cancel to import prompts');
        if (action) {
            // Export
            const data = await this.storage.exportPrompts();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cursor-prompts-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // Import
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const success = await this.storage.importPrompts(e.target.result);
                    if (success) {
                        alert('Prompts imported successfully!');
                        await this.refreshPromptsList();
                        await this.refreshCategoryFilter();
                    } else {
                        alert('Failed to import prompts. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
    }
}
