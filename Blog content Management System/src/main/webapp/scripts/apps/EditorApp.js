import BlogAPI from '../api/BlogAPI.js';
import NotificationRenderer from '../components/NotificationRenderer.js';

export default class EditorApp {
    constructor() {
        this.api = new BlogAPI();
        this.notifier = NotificationRenderer.getInstance();
        
        // UI Elements
        this.publishBtn = document.querySelector('.btn-pill-green');
        this.titleInput = document.getElementById('post-title');
        this.bodyInput = document.getElementById('post-body');
        this.categorySelect = document.getElementById('post-category');
        
        this.currentPostId = null;
        this.isEditMode = false;
        this.autoSaveTimeout = null;
        
        // Setup save indicator
        this.saveIndicator = document.createElement('span');
        this.saveIndicator.className = 'text-muted small ms-3';
        this.publishBtn.parentNode.insertBefore(this.saveIndicator, this.publishBtn);
    }

    async init() {
        await this.checkAuth();
        this.setupListeners();
        this.loadExistingData();
    }

    async checkAuth() {
        const user = await this.api.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
        }
    }

    setupListeners() {
        // Auto-resize textarea
        this.bodyInput.addEventListener('input', () => {
            this.bodyInput.style.height = '';
            this.bodyInput.style.height = this.bodyInput.scrollHeight + 'px';
        });

        // Auto-save on input
        const debounceSave = () => {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => this.autoSave(), 2000);
        };

        this.titleInput.addEventListener('input', debounceSave);
        this.bodyInput.addEventListener('input', debounceSave);
        this.categorySelect.addEventListener('change', debounceSave);

        // Publish
        this.publishBtn.addEventListener('click', () => this.handlePublish());
    }

    loadExistingData() {
        const urlParams = new URLSearchParams(window.location.search);
        this.isEditMode = urlParams.get('mode') === 'edit';
        
        if (this.isEditMode) {
            const savedPost = sessionStorage.getItem('editPost');
            if (savedPost) {
                const post = JSON.parse(savedPost);
                this.currentPostId = post.id;
                this.titleInput.value = post.title;
                this.bodyInput.value = post.content;
                if (post.category) this.categorySelect.value = post.category;
                
                this.publishBtn.textContent = 'Update';
                this.bodyInput.style.height = this.bodyInput.scrollHeight + 'px';
            }
        }
    }

    async autoSave() {
        const title = this.titleInput.value.trim();
        const content = this.bodyInput.value.trim();
        const category = this.categorySelect.value;
        
        if (!title && !content) return;

        this.saveIndicator.textContent = 'Saving...';
        
        try {
            const postData = {
                title: title || 'Untitled Draft',
                content: content,
                category: category,
                status: 'DRAFT'
            };

            let result;
            if (this.currentPostId) {
                postData.id = this.currentPostId;
                result = await fetch(`${this.api.baseUrl}/api/posts`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            } else {
                result = await fetch(`${this.api.baseUrl}/api/posts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            }

            if (result.ok) {
                const data = await result.json();
                if (data.id && !this.currentPostId) this.currentPostId = data.id;
                this.saveIndicator.textContent = 'Saved to Drafts';
            } else {
                this.saveIndicator.textContent = 'Error saving';
            }
        } catch (e) {
            this.saveIndicator.textContent = 'Offline';
        }
    }

    async handlePublish() {
        const title = this.titleInput.value.trim();
        const content = this.bodyInput.value.trim();
        const category = this.categorySelect.value;

        if (!title || !content) {
            this.notifier.showToast('Title and content are required', 'error');
            return;
        }

        this.publishBtn.disabled = true;
        this.publishBtn.textContent = this.isEditMode ? 'Updating...' : 'Publishing...';

        try {
            const postData = {
                id: this.currentPostId,
                title,
                content,
                category,
                status: 'PUBLISHED'
            };

            // Cancel any pending autosave to prevent conflict
            clearTimeout(this.autoSaveTimeout);

            const method = this.currentPostId ? 'PUT' : 'POST';
            const response = await fetch(`${this.api.baseUrl}/api/posts`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (response.status === 404 && method === 'PUT') {
                const confirmed = await this.notifier.confirm("This post was deleted on the server. Publish it as a new post instead?");
                if (confirmed) {
                    this.currentPostId = null;
                    postData.id = null;
                    response = await fetch(`${this.api.baseUrl}/api/posts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(postData)
                    });
                }
            }

            if (response.ok) {
                sessionStorage.removeItem('editPost');
                // We'll redirect after a short delay so user can see the success toast if we had one
                // but usually redirect happens immediately. Let's add a success toast on next page or use a delay.
                // For now, let's just redirect as it's the standard flow.
                window.location.href = 'index.html';
            } else {
                const errText = await response.text();
                this.notifier.showToast(`Failed to publish: ${errText}`, 'error');
                this.publishBtn.disabled = false;
                this.publishBtn.textContent = this.isEditMode ? 'Update' : 'Publish';
            }
        } catch (e) {
            alert('An error occurred');
            this.publishBtn.disabled = false;
        }
    }
}
