import BlogAPI from '../api/BlogAPI.js';
import PostRenderer from '../components/PostRenderer.js';
import NotificationRenderer from '../components/NotificationRenderer.js';

export default class DashboardApp {
    constructor() {
        this.api = new BlogAPI();
        this.renderer = new PostRenderer();
        this.notifier = NotificationRenderer.getInstance();
        this.feedContainer = document.getElementById('feed-stream');
        this.loader = document.getElementById('loader');
    }

    async init() {
        this.setupTabs();
        this.setupSearch();
        this.listenForSidebarFiltering();
        await this.loadPosts();
    }

    setupSearch() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.loadPosts('For you', query);
            }, 300);
        });
    }

    listenForSidebarFiltering() {
        document.addEventListener('filter-posts', (e) => {
            const topic = e.detail;
            this.loadPosts(topic);
            // Optionally scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.textContent.trim();
                this.loadPosts(category);
            });
        });
    }

    async loadPosts(categoryFilter = 'For you', searchQuery = '') {
        this.feedContainer.innerHTML = ''; 
        this.loader.style.display = 'block';
        try {
            const posts = await this.api.getPosts();
            
            if (!posts || posts.length === 0) {
                this.feedContainer.innerHTML = `<div class="text-center py-5 text-muted">
                    <i class="bi bi-journal-x fs-1 d-block mb-3"></i>
                    No published posts found yet.
                </div>`;
                return;
            }
            
            // Filter posts
            let filteredPosts = posts;
            
            // 1. Category Filter
            if (categoryFilter !== 'For you' && categoryFilter !== 'Featured') {
                filteredPosts = filteredPosts.filter(p => p.category === categoryFilter);
            }

            // 2. Search Filter
            if (searchQuery) {
                filteredPosts = filteredPosts.filter(p => 
                    p.title.toLowerCase().includes(searchQuery) || 
                    p.content.toLowerCase().includes(searchQuery) ||
                    (p.author && p.author.username.toLowerCase().includes(searchQuery))
                );
            }

            if (filteredPosts.length === 0) {
                this.feedContainer.innerHTML = `<div class="text-center py-5 text-muted">
                    No results found for your criteria.
                </div>`;
                return;
            }

            for (const post of filteredPosts) {
                console.log('Post object for rendering:', post);
                const stats = {
                    likes: post.likeCount,
                    hasLiked: post.hasLiked,
                    hasSaved: post.hasSaved,
                    commentCount: post.commentCount
                };

                const el = this.renderer.createPostElement(post, stats, {
                    onLike: (id) => this.handleReaction(id, 'LIKE', categoryFilter),
                    onSave: (id) => this.handleReaction(id, 'SAVE', categoryFilter),
                    onLoadComments: (id, container) => this.handleLoadComments(id, container),
                    onPostComment: (id, content, container) => this.handlePostComment(id, content, container),
                    onEdit: (p) => this.handleEdit(p),
                    onDelete: (id) => this.handleDelete(id, categoryFilter),
                    onFollow: (username, action) => this.handleFollow(username, action)
                });
                this.feedContainer.appendChild(el);
            }
        } catch (error) {
            console.error(error);
            this.feedContainer.innerHTML = '<div class="text-center py-5 text-danger">Error loading posts.</div>';
        } finally {
            this.loader.style.display = 'none';
        }
    }

    async handleReaction(postId, type, currentFilter) {
        try {
            await this.api.toggleReaction(postId, type);
            this.loadPosts(currentFilter); 
        } catch (e) {
            if (e.message === 'Unauthorized') this.notifier.showToast('Please login to interact', 'error');
            else console.error(e);
        }
    }

    async handleLoadComments(postId, container) {
        const comments = await this.api.getComments(postId);
        container.innerHTML = this.renderer.renderComments(comments);
    }

    async handlePostComment(postId, content, container) {
        try {
            await this.api.addComment(postId, content);
            this.handleLoadComments(postId, container); // reload comments
            this.notifier.showToast('Response shared', 'success');
        } catch (e) {
             if (e.message === 'Unauthorized') this.notifier.showToast('Please login to comment', 'error');
             else console.error(e);
        }
    }
    
    handleEdit(post) {
        // Redirect to editor using localStorage to pass data or URL params
        sessionStorage.setItem('editPost', JSON.stringify(post));
        window.location.href = 'editor.html?mode=edit';
    }

    async handleDelete(postId, currentFilter) {
        const confirmed = await this.notifier.confirm('Are you sure you want to delete this post?');
        if (!confirmed) return;
        
        try {
            await this.api.deletePost(postId);
            this.notifier.showToast('Post deleted', 'success');
            this.loadPosts(currentFilter);
        } catch (e) {
             this.notifier.showToast('Failed to delete (Are you the owner?)', 'error');
        }
    }

    async handleFollow(username, action) {
        try {
            await this.api.toggleFollow(username, action);
            const msg = action === 'follow' ? `Following ${username}` : `Unfollowed ${username}`;
            this.notifier.showToast(msg, 'success');
        } catch (e) {
            console.error('Follow failed', e);
            if (e.message === 'Unauthorized') this.notifier.showToast('Please login to follow', 'error');
        }
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    const app = new DashboardApp();
    app.init();
});
