
import BlogAPI from '../api/BlogAPI.js';
import PostRenderer from '../components/PostRenderer.js';

export default class StoriesApp {
    constructor() {
        this.api = new BlogAPI();
        this.renderer = new PostRenderer();
        this.mainContent = document.querySelector('.main-content');
        this.tabs = document.querySelectorAll('.dash-tab');
    }

    async init() {
        this.setupTabs();
        this.setupImport();
        
        // Load initial data
        const user = await this.api.getCurrentUser();
        if (user) {
            await this.updateCounts(user.username);
            await this.loadStories('DRAFT'); // Default to DRAFT
            
            // Activate Drafts tab visually if not already
            this.tabs.forEach(t => t.classList.remove('active'));
            this.tabs[0].classList.add('active'); // Assume first is Drafts
        } else {
            this.showEmptyState('Please login to see your stories.');
        }
    }

    setupTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', async (e) => {
                e.preventDefault();
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.textContent.trim().split(' ')[0];
                let status = 'DRAFT';
                if (tabName === 'Published') status = 'PUBLISHED';
                else if (tabName === 'Unlisted') status = 'UNLISTED'; 
                else if (tabName === 'Scheduled') status = 'SCHEDULED';

                await this.loadStories(status);
            });
        });
    }

    setupImport() {
        const fileInput = document.getElementById('import-file');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target.result;
                const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

                try {
                    const postData = {
                        title: title,
                        content: content,
                        status: 'DRAFT',
                        category: 'Uncategorized'
                    };

                    const result = await this.api.createPost(postData);
                    if (result && result.id) {
                        // Redirect to editor
                        const newPost = { ...postData, id: result.id };
                        sessionStorage.setItem('editPost', JSON.stringify(newPost));
                        window.location.href = 'editor.html?mode=edit';
                    } else {
                        alert('Failed to import story');
                    }
                } catch (err) {
                    console.error('Import failed', err);
                    alert('Error importing story');
                }
            };
            reader.readAsText(file);
        });
    }

    async updateCounts(username) {
        try {
            // Parallel fetch for counts
            // Note: getUserPosts returns arrays. We just need lengths.
            const [drafts, published, scheduled] = await Promise.all([
                this.api.getUserPosts(username, 'DRAFT'),
                this.api.getUserPosts(username, 'PUBLISHED'),
                this.api.getUserPosts(username, 'SCHEDULED')
            ]);

            const counts = {
                'Published': published ? published.length : 0,
                'Drafts': drafts ? drafts.length : 0,
                'Scheduled': scheduled ? scheduled.length : 0
            };

            // Generic update for any tab with matching name
            this.tabs.forEach(tab => {
                const tabName = tab.textContent.trim().split(' ')[0]; // "Drafts", "Published", etc.
                const count = counts[tabName];
                
                if (count !== undefined) {
                    const countSpan = tab.querySelector('.dash-count');
                    
                    if (count > 0 || tabName === 'Published') { // Keep 0 for Published if preferred, or hide
                        if (countSpan) countSpan.textContent = count;
                        else tab.innerHTML = `${tabName} <span class="dash-count">${count}</span>`;
                    } else {
                        // If 0, remove badge? Or show 0? 
                        // User request: "make the number... dynamic". Cleanest is usually showing nothing for 0 drafts/scheduled.
                        // But finding tab by textContent becomes tricky if we change innerHTML.
                        // Wait, tabName logic relies on textContent. If I change innerHTML to `${tabName}`, it stays safe.
                        tab.innerHTML = `${tabName}`;
                    }
                }
            });

        } catch (e) {
            console.error('Failed to update counts', e);
        }
    }

    async loadStories(status) {
        this.showLoading();
        try {
            const user = await this.api.getCurrentUser();
            if (!user) {
                this.showEmptyState('Please login to see your stories.');
                return;
            }

            // Refresh counts whenever we load a list
            this.updateCounts(user.username);

            const stories = await this.api.getUserPosts(user.username, status);
            this.clearStories();

            if (!stories || stories.length === 0) {
                this.showEmptyState(`You haven't any ${status.toLowerCase()} stories yet.`);
                return;
            }

            const list = document.createElement('div');
            list.className = 'mt-4';
            list.style.maxWidth = '1000px';

            for (const story of stories) {
                const stats = {
                    likes: story.likeCount,
                    hasLiked: story.hasLiked,
                    hasSaved: story.hasSaved,
                    commentCount: story.commentCount
                };

                const el = this.renderer.createPostElement(story, stats, {
                    onLike: (id) => this.handleReaction(id, 'LIKE', status),
                    onSave: (id) => this.handleReaction(id, 'SAVE', status),
                    onLoadComments: (id, container) => this.handleLoadComments(id, container),
                    onPostComment: (id, content, container) => this.handlePostComment(id, content, container),
                    onEdit: (p) => { 
                        sessionStorage.setItem('editPost', JSON.stringify(p));
                        window.location.href = 'editor.html?mode=edit';
                    },
                    onDelete: (id) => this.handleDelete(id, status)
                });
                list.appendChild(el);
            }
            this.mainContent.appendChild(list);

        } catch (error) {
            console.error(error);
            this.showEmptyState('Error loading stories.');
        }
    }

    async handleReaction(postId, type, status) {
        try {
            await this.api.toggleReaction(postId, type);
            await this.loadStories(status);
        } catch (e) {
            console.error(e);
        }
    }

    async handleLoadComments(postId, container) {
        const comments = await this.api.getComments(postId);
        container.innerHTML = this.renderer.renderComments(comments);
    }

    async handlePostComment(postId, content, container) {
        try {
            await this.api.addComment(postId, content);
            this.handleLoadComments(postId, container);
        } catch (e) {
             console.error(e);
        }
    }

    async handleDelete(postId, status) {
        if (!confirm('Permanently delete this story?')) return;
        await this.api.deletePost(postId);
        await this.loadStories(status);
    }

    clearStories() {
        const existingList = this.mainContent.querySelector('.mt-4');
        if (existingList) existingList.remove();
        const emptyState = this.mainContent.querySelector('.text-center');
        if (emptyState) emptyState.remove();
        const loader = this.mainContent.querySelector('.spinner-border');
        if (loader && loader.parentElement) loader.parentElement.remove();
    }

    showEmptyState(message) {
        this.clearStories();
        const empty = document.createElement('div');
        empty.className = 'text-center mt-5 pt-5';
        empty.style.maxWidth = '1000px';
        empty.innerHTML = `
            <p class="fs-5 mb-1 text-dark">${message}</p>
            <p class="text-muted">Why not <a href="editor.html" class="text-dark text-decoration-underline">start writing one?</a></p>
        `;
        this.mainContent.appendChild(empty);
    }

    showLoading() {
        this.clearStories();
        const loader = document.createElement('div');
        loader.className = 'text-center py-5 mt-4';
        loader.style.maxWidth = '1000px';
        loader.innerHTML = '<div class="spinner-border text-success" role="status"></div>';
        this.mainContent.appendChild(loader);
    }
}
