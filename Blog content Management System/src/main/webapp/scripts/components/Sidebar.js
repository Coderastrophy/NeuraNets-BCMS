
export default class Sidebar {
    constructor(api) {
        this.api = api;
    }

    async mount(containerId) {
        const container = document.querySelector(containerId);
        if (!container) return;

        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const user = await this.api.getCurrentUser();

        let followingHtml = '';
        if (user) {
            try {
                const following = await this.api.getFollowing(user.username);
                if (following && following.length > 0) {
                     followingHtml += `<h6 class="text-muted small fw-bold mb-3 mt-4">Following</h6>`;
                     followingHtml += following.map(f => `
                        <a href="#" class="sidebar-menu-item py-1">
                            <img src="https://ui-avatars.com/api/?name=${f}&background=random" class="rounded-circle me-3" width="20">
                            <span class="text-dark">${f}</span>
                        </a>
                     `).join('');
                }
            } catch (e) {
                console.error('Failed to load following', e);
            }
        }

        const isActive = (page) => currentPath.includes(page) ? 'active' : '';

        const html = `
            <div class="sidebar-content">
                 <a href="index.html" class="sidebar-menu-item ${isActive('index.html')}"><i class="bi bi-house-door"></i> Home</a>
                 <a href="profile.html" class="sidebar-menu-item ${isActive('profile.html')}"><i class="bi bi-person"></i> Profile</a>
                 <a href="library.html" class="sidebar-menu-item ${isActive('library.html')}"><i class="bi bi-bookmarks"></i> Library</a>
                 <a href="stories.html" class="sidebar-menu-item ${isActive('stories.html')}"><i class="bi bi-file-text"></i> Stories</a>
                 <a href="stats.html" class="sidebar-menu-item ${isActive('stats.html')}"><i class="bi bi-bar-chart"></i> Stats</a>

                 <hr class="my-4 text-muted opacity-25">

                 <a href="settings.html" class="sidebar-menu-item ${isActive('settings.html')}"><i class="bi bi-gear"></i> Settings</a>
                 <a href="help.html" class="sidebar-menu-item ${isActive('help.html')}"><i class="bi bi-question-circle"></i> Help</a>

                 <div id="following-list-container">
                    ${followingHtml}
                 </div>
            </div>
        `;

        container.innerHTML = html;
    }
}
