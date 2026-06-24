import BlogAPI from '../api/BlogAPI.js';
import { getContextPath } from '../utils/UrlUtil.js';

export default class AdminApp {
    constructor() {
        this.api = new BlogAPI();
        this.usersTableBody = document.getElementById('users-table-body');
        this.postsTableBody = document.getElementById('posts-table-body');
        this.usersView = document.getElementById('users-view');
        this.postsView = document.getElementById('posts-view');
        this.tabs = document.querySelectorAll('.nav-link');
        this.spinner = document.getElementById('loading-spinner');
    }

    async init() {
        try {
            const user = await this.api.getCurrentUser();
            
            if (!user) {
                // Not logged in - Redirect to login page
                window.location.href = 'login.html';
                return;
            }

            if (user.username !== 'admin') {
                // Logged in but not admin
                document.body.innerHTML = `
                    <div class="container pt-5 text-center">
                        <h1 class="display-4 text-danger">Access Denied</h1>
                        <p class="lead">You are logged in as <strong>${user.username}</strong>, but this page requires Administrator access.</p>
                        <div class="mt-4">
                            <button id="logout-btn-denied" class="btn btn-danger rounded-pill px-4">Log Out</button>
                            <a href="/" class="btn btn-outline-secondary rounded-pill px-4 ms-2">Go Home</a>
                        </div>
                    </div>
                `;
                
                document.getElementById('logout-btn-denied').onclick = () => this.handleLogout();
                return;
            }
            
            // Authorized Admin
            this.setupTabs();
            this.setupLogout();
            await this.loadUsers();
        } catch (e) {
            console.error('Init error', e);
            document.body.innerHTML = '<p class="text-danger p-4">Failed to initialize admin dashboard.</p>';
        }
    }

    setupLogout() {
        const btn = document.getElementById('admin-logout-btn');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                this.handleLogout();
            };
        }
    }

    async handleLogout() {
        try {
            const contextPath = getContextPath();
            await fetch(`${contextPath}/api/auth/logout`, { method: 'POST' });
            window.location.href = 'login.html';
        } catch (e) {
            console.error('Logout failed', e);
            window.location.href = 'login.html';
        }
    }

    setupTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = tab.dataset.tab;
                
                // Active class
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Toggle views
                if (target === 'users') {
                    this.usersView.classList.remove('d-none');
                    this.postsView.classList.add('d-none');
                    this.loadUsers();
                } else {
                    this.usersView.classList.add('d-none');
                    this.postsView.classList.remove('d-none');
                    this.loadPosts();
                }
            });
        });
    }

    async loadUsers() {
        this.setLoading(true);
        try {
            const users = await this.api.getAdminUsers();
            this.renderUsers(users);
        } catch (e) {
            console.error('Failed to load users', e);
        } finally {
            this.setLoading(false);
        }
    }

    async loadPosts() {
        this.setLoading(true);
        try {
            const posts = await this.api.getAdminPosts();
            this.renderPosts(posts);
        } catch (e) {
            console.error('Failed to load posts', e);
        } finally {
            this.setLoading(false);
        }
    }

    renderUsers(users) {
        this.usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td class="ps-4 text-muted small">#${user.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`}" class="rounded-circle me-2" width="30" height="30">
                        <div>
                            <span class="fw-medium">${user.username}</span>
                            ${user.isRestricted ? '<span class="badge bg-danger ms-2" style="font-size: 0.65rem;">SUSPENDED</span>' : ''}
                        </div>
                    </div>
                </td>
                <td>${user.fullName || '<span class="text-muted">-</span>'}</td>
                <td class="text-truncate" style="max-width: 250px;">${user.bio || '<span class="text-muted small">No bio</span>'}</td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary view-btn" data-type="user" data-id="${user.id}">View</button>
                        ${user.username !== 'admin' ? `
                            <button class="btn btn-sm ${user.isRestricted ? 'btn-success' : 'btn-outline-danger'} restrict-btn" 
                                    data-id="${user.id}" 
                                    data-status="${user.isRestricted}">
                                ${user.isRestricted ? 'Unban' : 'Ban'}
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
        this.attachViewListeners(users, 'user');
        this.attachRestrictListeners();
    }

    attachRestrictListeners() {
        this.usersTableBody.querySelectorAll('.restrict-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const userId = parseInt(btn.dataset.id);
                // Status is string "true"/"false" or boolean from template logic. Let's be safe.
                const isRestricted = btn.dataset.status === 'true';
                const newStatus = !isRestricted; // Toggle it
                
                await this.toggleRestriction(userId, newStatus);
            });
        });
    }

    async toggleRestriction(userId, shouldRestrict) {
        if (!confirm(`Are you sure you want to ${shouldRestrict ? 'SUSPEND' : 'ACTIVATE'} this user?`)) return;

        try {
            const contextPath = getContextPath();
            const response = await fetch(`${contextPath}/api/admin/users/restrict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, restrict: shouldRestrict })
            });
            
            if (response.ok) {
                // Reload list to show changes
                await this.loadUsers();
            } else {
                alert('Failed to update user status');
            }
        } catch (e) {
            console.error('Error toggling restriction', e);
            alert('Error updating user status');
        }
    }

    renderPosts(posts) {
        this.postsTableBody.innerHTML = posts.map(post => `
            <tr>
                <td class="ps-4 text-muted small">#${post.id}</td>
                <td class="fw-medium w-25 text-truncate" style="max-width: 200px;" title="${post.title}">${post.title}</td>
                <td>
                    <div class="d-flex align-items-center small">
                         <img src="${post.author.profileImage || `https://ui-avatars.com/api/?name=${post.author.username || '?'}&background=random`}" class="rounded-circle me-2" width="20" height="20">
                         ${post.author.username || 'Unknown'}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${post.status === 'PUBLISHED' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}">
                        ${post.status}
                    </span>
                </td>
                <td class="small text-muted">${new Date(post.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="d-flex gap-2 small text-muted">
                        <span title="Views"><i class="bi bi-eye"></i> ${post.viewCount}</span>
                        <span title="Likes"><i class="bi bi-heart"></i> ${post.likeCount}</span>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-btn" data-type="post" data-id="${post.id}">View</button>
                </td>
            </tr>
        `).join('');
        this.attachViewListeners(posts, 'post');
    }

    attachViewListeners(data, type) {
        const buttons = type === 'user' ? this.usersTableBody.querySelectorAll('.view-btn') : this.postsTableBody.querySelectorAll('.view-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const item = data.find(d => d.id === id);
                this.showDetails(item, type);
            });
        });
    }

    showDetails(item, type) {
        const modalEl = document.getElementById('detailModal');
        const modalTitle = document.getElementById('detailModalLabel');
        const modalContent = document.getElementById('detailContent');
        
        modalTitle.textContent = `${type === 'user' ? 'User' : 'Post'} Details`;
        
        // Pretty print JSON
        modalContent.textContent = JSON.stringify(item, null, 2);
        
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.usersTableBody.closest('.table-card').style.opacity = '0.5';
            this.postsTableBody.closest('.table-card').style.opacity = '0.5';
            this.spinner.classList.remove('d-none');
        } else {
            this.usersTableBody.closest('.table-card').style.opacity = '1';
            this.postsTableBody.closest('.table-card').style.opacity = '1';
            this.spinner.classList.add('d-none');
        }
    }
}
