import BlogAPI from '../api/BlogAPI.js';
import PostRenderer from '../components/PostRenderer.js';

export default class LibraryApp {
    constructor() {
        this.api = new BlogAPI();
        this.renderer = new PostRenderer();
        this.contentContainer = document.querySelector('.library-grid');
        this.tabs = document.querySelectorAll('.lib-tab');
    }

    async init() {
        this.setupTabs();
        this.bindEvents(); // New list button
        await this.loadUserLists(); // Default view is list of lists
    }

    bindEvents() {
        const newListBtn = document.querySelector('.btn-new-list');
        const startListBtn = document.querySelector('.btn-start-list');
        
        [newListBtn, startListBtn].forEach(btn => {
            if (btn) btn.addEventListener('click', () => this.handleCreateList());
        });
    }

    setupTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', async (e) => {
                e.preventDefault();
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const view = tab.textContent.trim();
                if (view === 'Your lists') {
                    await this.loadUserLists();
                } else if (view === 'Saved lists') {
                    await this.loadSavedPosts();
                } else if (view === 'Responses') {
                    await this.loadResponses();
                } else {
                    this.showEmptyState(`No content in <strong>${view}</strong> yet.`);
                }
            });
        });
    }

    async handleCreateList() {
        const name = prompt("Enter list name:");
        if (!name) return;
        const description = prompt("Enter description (optional):") || "";
        
        try {
            const res = await this.api.createList(name, description);
            if (res && res.success) {
                await this.loadUserLists();
            } else {
                alert('Failed to create list');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating list');
        }
    }

    async loadUserLists() {
        this.showLoading();
        try {
            const lists = await this.api.getUserLists();
            const user = await this.api.getCurrentUser();
            
            // Clear content
            this.clearContentBelowTabs();
            
            const listContainer = document.createElement('div');
            listContainer.className = 'mt-4';
            
            // 1. Reading List Card (Static / Default)
            const readingListCard = this.createListCard({
                name: 'Reading list',
                storyCount: 'Saved stories', 
                isPrivate: true,
                id: 'saved' // Special ID
            }, user);
            listContainer.appendChild(readingListCard);

            // 2. Custom Lists
            if (lists && lists.length > 0) {
                lists.forEach(list => {
                    listContainer.appendChild(this.createListCard(list, user));
                });
            }

            this.contentContainer.appendChild(listContainer);
        } catch (e) {
            console.error(e);
            this.showEmptyState('Error loading lists.');
        }
    }

    createListCard(list, user) {
        const card = document.createElement('div');
        card.className = 'list-card-wrapper mb-4';
        
        // Random bg for visual variance or just default
        const countText = list.id === 'saved' ? list.storyCount : `${list.storyCount || 0} stories`;
        const lockIcon = list.isPrivate || list.id === 'saved' ? '<i class="bi bi-lock-fill text-muted" style="font-size: 0.8rem;"></i>' : '';

        card.innerHTML = `
            <div class="list-content-left">
                <div>
                    <div class="user-row">
                        <img src="${user ? (user.profileImage || `https://ui-avatars.com/api/?name=${user.username}`) : ''}" class="user-avatar rounded-circle me-2" width="20">
                        <span>${user ? user.username : 'User'}</span>
                    </div>
                    <h3 class="list-card-title serif-font">${list.name}</h3>
                </div>
                
                <div class="list-card-footer">
                    <div class="d-flex align-items-center gap-2">
                        <span>${countText}</span>
                        ${lockIcon}
                    </div>
                    <i class="bi bi-three-dots"></i>
                </div>
            </div>
            <div class="list-visual-right">
                <div class="visual-spine-1"></div>
                <div class="visual-spine-2"></div>
            </div>
        `;
        
        card.addEventListener('click', () => {
             if (list.id === 'saved') this.loadSavedPosts();
             else this.loadListContent(list);
        });

        return card;
    }

    async loadListContent(list) {
        this.showLoading();
        try {
             // Fetch posts for this list
             const posts = await this.api.getListPosts(list.id);
             
             this.clearContentBelowTabs();
             
             // Header for list view
             const header = document.createElement('div');
             header.className = 'mb-4';
             header.innerHTML = `
                <div class="d-flex align-items-center gap-2 mb-2">
                    <button class="btn btn-sm btn-outline-secondary back-to-lists"><i class="bi bi-arrow-left"></i> Back</button>
                    ${list.id !== 'saved' ? `<button class="btn btn-sm btn-outline-danger delete-list" data-id="${list.id}">Delete List</button>` : ''}
                </div>
                <h2 class="serif-font">${list.name}</h2>
                <p class="text-muted">${list.description || ''}</p>
             `;
             
             header.querySelector('.back-to-lists').onclick = () => this.loadUserLists();
             if (header.querySelector('.delete-list')) {
                 header.querySelector('.delete-list').onclick = async () => {
                     if (confirm('Delete this list?')) {
                         await this.api.deleteList(list.id);
                         this.loadUserLists();
                     }
                 };
             }
             
             this.contentContainer.appendChild(header);

             if (!posts || posts.length === 0) {
                 this.contentContainer.appendChild(this.createEmptyMessage('No stories in this list.'));
                 return;
             }

             // Render posts
             posts.forEach(post => {
                const stats = {
                    likes: post.likeCount,
                    hasLiked: post.hasLiked,
                    hasSaved: post.hasSaved,
                    commentCount: post.commentCount
                };
                const el = this.renderer.createPostElement(post, stats, {
                    onLike: (id) => this.handleReaction(id, 'LIKE'),
                    onSave: (id) => this.handleReaction(id, 'SAVE'), // This just saves to "Saved Posts", not specific list logic yet (complex)
                    onLoadComments: (id, container) => this.handleLoadComments(id, container),
                    onPostComment: (id, content, container) => this.handlePostComment(id, content, container),
                    onEdit: (p) => { 
                        sessionStorage.setItem('editPost', JSON.stringify(p));
                        window.location.href = 'editor.html?mode=edit';
                    },
                    onDelete: (id) => this.handleDelete(id)
                });
                this.contentContainer.appendChild(el);
             });

        } catch (e) {
            console.error(e);
            this.showEmptyState('Error loading list content.');
        }
    }

    createEmptyMessage(msg) {
        const div = document.createElement('div');
        div.className = 'text-center py-5 text-muted';
        div.textContent = msg;
        return div;
    }

    async loadSavedPosts() {
        this.showLoading();
        try {
            const posts = await this.api.getSavedPosts();
            if (!posts || posts.length === 0) {
                this.showEmptyState('You haven\'t saved any stories yet.');
                return;
            }

            // Keep the title row and tabs, but clear the rest
            this.clearContentBelowTabs();
            
            const listContainer = document.createElement('div');
            listContainer.className = 'mt-4';
            
            for (const post of posts) {
                const stats = {
                    likes: post.likeCount,
                    hasLiked: post.hasLiked,
                    hasSaved: post.hasSaved,
                    commentCount: post.commentCount
                };

                const el = this.renderer.createPostElement(post, stats, {
                    onLike: (id) => this.handleReaction(id, 'LIKE', 'Saved posts'),
                    onSave: (id) => this.handleReaction(id, 'SAVE', 'Saved posts'),
                    onLoadComments: (id, container) => this.handleLoadComments(id, container),
                    onPostComment: (id, content, container) => this.handlePostComment(id, content, container),
                    onEdit: (p) => { 
                        sessionStorage.setItem('editPost', JSON.stringify(p));
                        window.location.href = 'editor.html?mode=edit';
                    },
                    onDelete: (id) => this.handleDelete(id)
                });
                listContainer.appendChild(el);
            }
            this.contentContainer.appendChild(listContainer);

        } catch (error) {
            console.error(error);
            this.showEmptyState('Error loading saved posts.');
        }
    }

    async loadResponses() {
        this.showLoading();
        try {
            const user = await this.api.getCurrentUser();
            if (!user) {
                this.showEmptyState('Please login to see your responses.');
                return;
            }

            const comments = await this.api.getUserComments(user.username);
            this.clearContentBelowTabs();

            if (!comments || comments.length === 0) {
                this.showEmptyState('You haven\'t responded to any stories yet.');
                return;
            }

            const responsesContainer = document.createElement('div');
            responsesContainer.className = 'responses-list mt-4';
            
            for (const comment of comments) {
                // Fetch the post title for context
                const post = await this.api.getPost(comment.postId).catch(() => null);
                const postTitle = post ? post.title : 'Deleted Post';

                const item = document.createElement('div');
                item.className = 'response-card mb-4 p-4 bg-white border rounded shadow-sm';
                item.innerHTML = `
                    <div class="small text-muted mb-2">
                        Responded to <strong class="text-dark">${postTitle}</strong>
                        <span class="mx-2">·</span> ${new Date(comment.createdAt).toLocaleDateString()}
                    </div>
                    <p class="mb-0 serif-font" style="font-size: 1.1rem; line-height: 1.6;">"${comment.content}"</p>
                `;
                responsesContainer.appendChild(item);
            }
            this.contentContainer.appendChild(responsesContainer);

        } catch (error) {
            console.error(error);
            this.showEmptyState('Error loading responses.');
        }
    }

    async handleReaction(postId, type, view) {
        try {
            await this.api.toggleReaction(postId, type);
            if (view === 'Saved posts') await this.loadSavedPosts();
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

    async handleDelete(postId) {
        if (!confirm('Permanently delete this story?')) return;
        await this.api.deletePost(postId);
        await this.loadSavedPosts();
    }

    clearContentBelowTabs() {
        // Remove everything after the .library-tabs
        let element = document.querySelector('.library-tabs').nextElementSibling;
        while (element) {
            const next = element.nextElementSibling;
            element.remove();
            element = next;
        }
    }

    showEmptyState(message) {
        this.clearContentBelowTabs();
        const empty = document.createElement('div');
        empty.className = 'text-center py-5 mt-4';
        empty.innerHTML = `
            <i class="bi bi-bookmarks text-muted mb-3" style="font-size: 3rem; opacity: 0.3; display: block;"></i>
            <p class="text-muted fs-5">${message}</p>
        `;
        this.contentContainer.appendChild(empty);
    }

    showLoading() {
        this.clearContentBelowTabs();
        const loader = document.createElement('div');
        loader.className = 'text-center py-5 mt-4';
        loader.innerHTML = '<div class="spinner-border text-success" role="status"></div>';
        this.contentContainer.appendChild(loader);
    }
}
