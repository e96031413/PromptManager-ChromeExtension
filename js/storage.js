class PromptStorage {
    constructor() {
        this.storageKey = 'cursorPrompts';
        this.versionKey = 'promptsVersion';
    }

    async getPrompts() {
        const result = await chrome.storage.local.get(this.storageKey);
        return result[this.storageKey] || [];
    }

    async savePrompt(prompt) {
        const prompts = await this.getPrompts();
        if (prompt.id) {
            const index = prompts.findIndex(p => p.id === prompt.id);
            if (index !== -1) {
                prompts[index] = { ...prompt, updatedAt: new Date().toISOString() };
            }
        } else {
            prompt.id = crypto.randomUUID();
            prompt.createdAt = new Date().toISOString();
            prompt.updatedAt = prompt.createdAt;
            prompts.push(prompt);
        }
        await this.incrementVersion();
        return chrome.storage.local.set({ [this.storageKey]: prompts });
    }

    async deletePrompt(id) {
        const prompts = await this.getPrompts();
        const filteredPrompts = prompts.filter(p => p.id !== id);
        await this.incrementVersion();
        return chrome.storage.local.set({ [this.storageKey]: filteredPrompts });
    }

    async getCategories() {
        const prompts = await this.getPrompts();
        return [...new Set(prompts.map(p => p.category).filter(Boolean))];
    }

    async searchPrompts(query, category = '') {
        const prompts = await this.getPrompts();
        return prompts.filter(p => {
            const matchesQuery = !query || 
                p.title.toLowerCase().includes(query.toLowerCase()) ||
                p.content.toLowerCase().includes(query.toLowerCase());
            const matchesCategory = !category || p.category === category;
            return matchesQuery && matchesCategory;
        });
    }

    async exportPrompts() {
        const prompts = await this.getPrompts();
        const version = await this.getCurrentVersion();
        return JSON.stringify({
            version,
            prompts,
            exportedAt: new Date().toISOString()
        });
    }

    async importPrompts(data) {
        try {
            const parsed = JSON.parse(data);
            await chrome.storage.local.set({
                [this.storageKey]: parsed.prompts,
                [this.versionKey]: parsed.version
            });
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    async getCurrentVersion() {
        const result = await chrome.storage.local.get(this.versionKey);
        return result[this.versionKey] || 0;
    }

    async incrementVersion() {
        const currentVersion = await this.getCurrentVersion();
        return chrome.storage.local.set({
            [this.versionKey]: currentVersion + 1
        });
    }
}
