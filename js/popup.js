document.addEventListener('DOMContentLoaded', async () => {
    const storage = new PromptStorage();
    const ui = new PromptUI(storage);
    
    // Initialize the UI
    await ui.refreshPromptsList();
    await ui.refreshCategoryFilter();

    // 直接在這裡設置表單提交事件監聽
    const form = document.getElementById('promptForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const promptData = {
            id: form.dataset.promptId || '',
            title: form.elements.promptTitle.value.trim(),
            content: form.elements.promptContent.value.trim(),
            category: form.elements.promptCategory.value.trim()
        };

        if (!promptData.title || !promptData.content) {
            alert('Please fill in both title and content');
            return;
        }

        try {
            await storage.savePrompt(promptData);
            ui.hidePromptModal();
            await ui.refreshPromptsList();
            await ui.refreshCategoryFilter();
            form.reset();
        } catch (error) {
            console.error('Error saving prompt:', error);
            alert('Failed to save prompt. Please try again.');
        }
    });
});

// Add auto-complete functionality
const promptTitleInput = document.getElementById('promptTitle');
if (promptTitleInput) {
    promptTitleInput.addEventListener('input', async (e) => {
        const storage = new PromptStorage();
        const query = e.target.value;
        if (query.length >= 2) {
            const suggestions = await storage.searchPrompts(query);
            showAutoComplete(suggestions.map(s => s.title));
        }
    });
}

function showAutoComplete(suggestions) {
    let autoComplete = document.getElementById('autoComplete');
    if (!autoComplete) {
        autoComplete = document.createElement('div');
        autoComplete.id = 'autoComplete';
        autoComplete.className = 'auto-complete';
        promptTitleInput.parentNode.appendChild(autoComplete);
    }

    if (suggestions.length > 0) {
        autoComplete.innerHTML = suggestions
            .slice(0, 5)
            .map(s => `<div class="suggestion">${s}</div>`)
            .join('');
        autoComplete.style.display = 'block';

        // Add click handlers
        autoComplete.querySelectorAll('.suggestion').forEach(div => {
            div.addEventListener('click', () => {
                promptTitleInput.value = div.textContent;
                autoComplete.style.display = 'none';
            });
        });
    } else {
        autoComplete.style.display = 'none';
    }
}

// Hide auto-complete when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#autoComplete') && !e.target.closest('#promptTitle')) {
        const autoComplete = document.getElementById('autoComplete');
        if (autoComplete) {
            autoComplete.style.display = 'none';
        }
    }
});
