import BlogAPI from '../api/BlogAPI.js';
import PostRenderer from '../components/PostRenderer.js';
import { getContextPath } from '../utils/UrlUtil.js';

export default class ProfileApp {
    constructor() {
        this.api = new BlogAPI();
        this.renderer = new PostRenderer();
        
        // UI Elements
        this.profileName = document.querySelector('.profile-name-big');
        this.sidebarName = document.querySelector('.sidebar-name');
        this.avatarLg = document.querySelector('.profile-avatar-lg');
        this.feedContainer = document.querySelector('.profile-feed-content');
        this.tabs = document.querySelectorAll('.p-tab');
        
        this.currentUsername = new URLSearchParams(window.location.search).get('username');
        this.isOwnProfile = false;
    }

    async init() {
        await this.loadProfile();
        this.setupTabs();
        this.setupEditModal();
        await this.loadContent('Home');
    }

    async loadProfile() {
        try {
            const profile = await this.api.getProfile(this.currentUsername);
            this.isOwnProfile = profile.isOwnProfile;

            document.title = `${profile.fullName || profile.username} - NeuraNotes`;
            this.profileName.textContent = profile.username;
            this.sidebarName.textContent = profile.fullName || profile.username;
            
            if (this.avatarLg) {
                this.avatarLg.src = profile.profileImage || `https://ui-avatars.com/api/?name=${profile.username}&background=random&size=128`;
            }

            // Bio
            const sidebar = document.querySelector('.profile-sidebar-right');
            let bioEl = sidebar.querySelector('.sidebar-bio');
            if (!bioEl) {
                bioEl = document.createElement('p');
                bioEl.className = 'sidebar-bio text-muted small mt-2';
                sidebar.insertBefore(bioEl, sidebar.querySelector('.edit-profile-link'));
            }
            bioEl.textContent = profile.bio || 'No bio yet.';

            if (!this.isOwnProfile) {
                const editLink = document.querySelector('.edit-profile-link');
                if (editLink) editLink.style.display = 'none';
                this.addFollowButton(profile.username);
            }
        } catch (e) {
            console.error('Failed to load profile', e);
        }
    }

    addFollowButton(username) {
        const titleRow = document.querySelector('.profile-title-row');
        const followBtn = document.createElement('button');
        followBtn.className = 'btn btn-outline-dark btn-sm rounded-pill px-4 ms-3';
        followBtn.textContent = 'Follow';
        followBtn.onclick = () => alert('Follow feature coming soon!');
        titleRow.insertBefore(followBtn, titleRow.querySelector('.profile-actions-btn'));
    }

    setupTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadContent(tab.textContent.trim());
            });
        });
    }

    async loadContent(tabName) {
        this.feedContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border spinner-border-sm text-muted"></div></div>';
        try {
            if (tabName === 'Home') {
                const posts = await this.api.getUserPosts(this.profileName.textContent, 'PUBLISHED');
                this.renderPosts(posts);
            } else if (tabName === 'About') {
                const profile = await this.api.getProfile(this.currentUsername);
                this.renderAbout(profile);
            } else if (tabName === 'Lists') {
                 const posts = await this.api.getSavedPosts();
                 this.renderPosts(posts);
            }
        } catch (e) {
            this.feedContainer.innerHTML = '<p class="text-danger">Failed to load content.</p>';
        }
    }

    renderPosts(posts) {
        if (!posts || posts.length === 0) {
            this.feedContainer.innerHTML = '<p class="text-muted py-5 text-center">No stories found.</p>';
            return;
        }

        this.feedContainer.innerHTML = '';
        posts.forEach(post => {
            const stats = {
                likes: post.likeCount,
                hasLiked: post.hasLiked,
                hasSaved: post.hasSaved,
                commentCount: post.commentCount
            };

            const el = this.renderer.createPostElement(post, stats, {
                onLike: async (id) => { await this.api.toggleReaction(id, 'LIKE'); this.loadContent('Home'); },
                onSave: async (id) => { await this.api.toggleReaction(id, 'SAVE'); this.loadContent('Home'); },
                onLoadComments: (id, container) => this.handleLoadComments(id, container),
                onPostComment: (id, content, container) => this.handlePostComment(id, content, container),
                onEdit: (p) => { sessionStorage.setItem('editPost', JSON.stringify(p)); window.location.href = 'editor.html?mode=edit'; },
                onDelete: async (id) => { if(confirm('Delete?')) { await this.api.deletePost(id); this.loadContent('Home'); } }
            });
            this.feedContainer.appendChild(el);
        });
    }

    renderAbout(profile) {
        this.feedContainer.innerHTML = `
            <div class="py-4">
                <h4 class="mb-4">About ${profile.fullName || profile.username}</h4>
                <p class="lead" style="font-family: 'Merriweather', serif;">${profile.bio || 'This user hasn\'t added a bio yet.'}</p>
                <hr class="my-5">
                <div class="d-flex gap-4 text-muted small">
                    <span>Joined recently</span>
                    <span>${profile.username} profile</span>
                </div>
            </div>
        `;
    }

    handleLoadComments(postId, container) {
        this.api.getComments(postId).then(comments => {
            container.innerHTML = this.renderer.renderComments(comments);
        });
    }

    async handlePostComment(postId, content, container) {
        await this.api.addComment(postId, content);
        this.handleLoadComments(postId, container);
    }

    setupEditModal() {
        const editLink = document.querySelector('.edit-profile-link');
        if (!editLink) return;

        editLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const profile = await this.api.getProfile();
            
            const modalHtml = `
                <div class="modal fade" id="editProfileModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
                            <div class="modal-header border-0 pb-0">
                                <h5 class="modal-title fw-bold">Edit Profile</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body p-4">
                                <div class="text-center mb-4">
                                    <div class="position-relative d-inline-block">
                                        <img id="edit-avatar-preview" src="${profile.profileImage || `https://ui-avatars.com/api/?name=${profile.username}&background=random`}" class="rounded-circle shadow-sm" width="80" height="80" style="object-fit: cover;">
                                        <label for="avatar-upload" class="position-absolute bottom-0 end-0 bg-light rounded-circle shadow-sm p-1" style="cursor: pointer;">
                                            <i class="bi bi-camera-fill text-dark small"></i>
                                        </label>
                                        <input type="file" id="avatar-upload" class="d-none" accept="image/*">
                                    </div>
                                    <p class="text-muted small mt-2">Click camera to upload</p>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label small text-muted">Full Name</label>
                                    <input type="text" id="edit-fullname" class="form-control border-light bg-light" value="${profile.fullName || ''}" placeholder="Enter your full name">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small text-muted">Bio</label>
                                    <textarea id="edit-bio" class="form-control border-light bg-light" rows="3" placeholder="Tell us about yourself">${profile.bio || ''}</textarea>
                                </div>
                                
                                <button id="save-profile-btn" class="btn btn-dark w-100 rounded-pill py-2 mt-3">Save changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modalEl = document.getElementById('editProfileModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            // Avatar Upload Logic
            const avatarInput = document.getElementById('avatar-upload');
            let uploadedImageUrl = profile.profileImage;

            avatarInput.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const contextPath = getContextPath();
                    const response = await fetch(`${contextPath}/api/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    uploadedImageUrl = data.url;
                    document.getElementById('edit-avatar-preview').src = uploadedImageUrl;
                } catch (e) {
                    alert('Upload failed');
                }
            };

            document.getElementById('save-profile-btn').onclick = async () => {
                const fullName = document.getElementById('edit-fullname').value;
                const bio = document.getElementById('edit-bio').value;

                await this.api.updateProfile({ 
                    fullName, 
                    bio, 
                    profileImage: uploadedImageUrl 
                });
                modal.hide();
                location.reload();
            };

            modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
        });
    }
}
