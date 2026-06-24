export default class Navbar {
    render() {
        return `
            <div class="nav-left">
                <button class="hamburger-btn" onclick="toggleSidebar()">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <a href="index.html" class="brand-logo ms-3">NeuraNotes</a>
                <div class="search-box d-none d-md-block">
                    <i class="bi bi-search search-icon"></i>
                    <input type="text" class="search-input" placeholder="Search">
                </div>
            </div>

            <div class="nav-right">
                <a href="editor.html" class="nav-link-item d-none d-sm-flex"><i class="bi bi-pencil-square fs-5"></i> Write</a>
                
                <!-- Notifications -->
                <div class="dropdown mx-3">
                    <a href="#" class="nav-link-item position-relative" data-bs-toggle="dropdown" id="notificationBell">
                        <i class="bi bi-bell fs-5"></i>
                        <span class="notification-badge d-none badge rounded-pill bg-success" style="position: absolute; top: -5px; right: -5px; font-size: 0.6rem;">0</span>
                    </a>
                    <div class="dropdown-menu dropdown-menu-end shadow border-0 p-0 notification-dropdown" style="width: 320px; border-radius: 12px; overflow: hidden; margin-top: 15px;">
                        <div class="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                            <span class="fw-bold small">Notifications</span>
                            <button class="btn btn-sm btn-link text-success p-0 text-decoration-none mark-all-read" style="font-size: 0.75rem;">Mark all as read</button>
                        </div>
                        <div class="notification-list" style="max-height: 350px; overflow-y: auto;">
                            <div class="p-4 text-center text-muted small">All caught up!</div>
                        </div>
                    </div>
                </div>

                <!-- User Menu -->
                <div class="dropdown">
                    <a href="#" data-bs-toggle="dropdown">
                        <img src="https://ui-avatars.com/api/?name=User&background=1a8917&color=fff" class="user-avatar" alt="Profile">
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-3 p-2" style="border-radius: 12px; min-width: 200px;">
                        <li><a class="dropdown-item rounded-3 py-2 small" href="profile.html"><i class="bi bi-person me-2"></i> Profile</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 small" href="library.html"><i class="bi bi-bookmarks me-2"></i> Library</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 small" href="stories.html"><i class="bi bi-file-text me-2"></i> Stories</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 small" href="stats.html"><i class="bi bi-bar-chart me-2"></i> Stats</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item rounded-3 py-2 small" href="settings.html"><i class="bi bi-gear me-2"></i> Settings</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 small text-danger logout-btn" href="#"><i class="bi bi-box-arrow-right me-2"></i> Sign out</a></li>
                    </ul>
                </div>
            </div>
        `;
    }
}
