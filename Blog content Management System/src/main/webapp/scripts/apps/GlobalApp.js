import Sidebar from '../components/Sidebar.js';
import Navbar from '../components/Navbar.js';
import ThemeManager from '../utils/ThemeManager.js';
import BlogAPI from '../api/BlogAPI.js';
import { getContextPath } from '../utils/UrlUtil.js';

export default class GlobalApp {
    constructor() {
        this.api = new BlogAPI();
        this.sidebar = new Sidebar(this.api);
    }

    async init() {
        ThemeManager.getInstance().initToggle('themeToggle');
        try {
            // 2. Load User Data
            const user = await this.api.getCurrentUser();
            if (user) {
                const profile = await this.api.getProfile(user.username);
                this.updateUI(profile);
                this.setupNotifications();
                this.setupSidebar(user.username);
            } else {
                console.log('No user logged in.');
                this.handleGuestSession();
            }

            this.setupLogout();
        } catch (e) {
            console.error('GlobalApp init failed', e);
        }
    }

    async setupSidebar(username) {
        try {
            const sidebar = document.querySelector('.left-sidebar');
            // Ensure links are correct (backup check)
            if (sidebar) {
                 const helpIcon = sidebar.querySelector('.bi-question-circle');
                 if (helpIcon) helpIcon.closest('a').href = 'help.html';
                 const settingsIcon = sidebar.querySelector('.bi-gear');
                 if (settingsIcon) settingsIcon.closest('a').href = 'settings.html';
            }

            const following = await this.api.getFollowing(username);
            const container = document.querySelector('.left-sidebar .sidebar-content');
            if (!container || !following || following.length === 0) return;

            // Find or create 'Following' header
            let header = Array.from(container.querySelectorAll('h6')).find(h => h.textContent.includes('Following'));
            if (!header) {
                const hr = document.createElement('hr');
                hr.className = 'my-4 text-muted opacity-25';
                container.appendChild(hr);
                
                header = document.createElement('h6');
                header.className = 'text-muted small fw-bold mb-3';
                header.textContent = 'Following';
                container.appendChild(header);
            }

            // Remove static items if any (optional, or just append)
            // For now, let's just append new ones. 
            // Better to clear everything after the header to avoid duplicates on re-runs
            let next = header.nextElementSibling;
            while(next) {
                const toRemove = next;
                next = next.nextElementSibling;
                toRemove.remove();
            }

            following.forEach(f => {
                const link = document.createElement('a');
                link.href = '#';
                link.className = 'sidebar-menu-item py-1';
                link.innerHTML = `
                    <img src="https://ui-avatars.com/api/?name=${f}&background=random" class="rounded-circle me-3" width="20">
                    <span>${f}</span>
                `;
                container.appendChild(link);
            });

        } catch (e) {
            console.error('Error loading sidebar following', e);
        }
    }


    updateUI(profile) {
        const avatars = document.querySelectorAll('.user-avatar');
        avatars.forEach(avatar => {
            avatar.src = profile.profileImage || `https://ui-avatars.com/api/?name=${profile.username}&background=1a8917&color=fff`;
            avatar.alt = profile.fullName || profile.username;
        });
    }

    setupNotifications() {
        const bell = document.getElementById('notificationBell');
        if (!bell) return;

        bell.addEventListener('show.bs.dropdown', () => this.fetchNotifications());

        const markReadBtn = document.querySelector('.mark-all-read');
        if (markReadBtn) {
            markReadBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.api.markNotificationsAsRead();
                this.fetchNotifications();
            };
        }
        
        this.fetchNotifications(true);
    }

    async fetchNotifications(onlyBadge = false) {
        try {
            const notifications = await this.api.getNotifications();
            const unreadCount = notifications.filter(n => !n.isRead).length;
            const badge = document.querySelector('.notification-badge');
            
            if (badge) {
                if (unreadCount > 0) {
                    badge.classList.remove('d-none');
                    badge.textContent = unreadCount;
                } else {
                    badge.classList.add('d-none');
                }
            }

            if (!onlyBadge) {
                this.renderNotifications(notifications);
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    }

    renderNotifications(notifications) {
        const list = document.querySelector('.notification-list');
        if (!list) return;

        if (!notifications || notifications.length === 0) {
            list.innerHTML = '<div class="p-4 text-center text-muted small">All caught up!</div>';
            return;
        }

        list.innerHTML = notifications.map(n => `
            <div class="px-3 py-3 border-bottom notification-item ${n.isRead ? 'opacity-75' : 'bg-light'}">
                <div class="d-flex gap-3">
                    <img src="https://ui-avatars.com/api/?name=${n.actor}&background=random" class="rounded-circle" width="36" height="36">
                    <div style="flex: 1;">
                        <p class="mb-0 small" style="line-height: 1.3;">${n.message}</p>
                        <small class="text-muted" style="font-size: 0.7rem;">${this.formatTime(n.createdAt)}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupLogout() {
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.logout-btn')) {
                e.preventDefault();
                try {
                    const contextPath = getContextPath();
                    await fetch(`${contextPath}/api/auth/logout`, { method: 'POST' });
                    window.location.href = 'landing.html';
                } catch (e) {
                    console.error('Logout failed', e);
                }
            }
        });
    }

    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return new Date(timestamp).toLocaleDateString();
    }

    handleGuestSession() {
        const protectedPages = ['editor.html', 'stats.html', 'library.html', 'stories.html', 'settings.html', 'profile.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (protectedPages.includes(currentPage) && !window.location.search.includes('username')) {
            // window.location.href = 'landing.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const globalApp = new GlobalApp();
    globalApp.init();
});
