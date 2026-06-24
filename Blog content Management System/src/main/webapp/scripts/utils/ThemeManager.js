export default class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.isToggling = false;
        this.applyTheme();
        this.setupDelegatedListener();
        
        // Expose to window for hardcoded onclick fallbacks
        window.themeManager = this;
        window.toggleAppTheme = () => this.toggleTheme();
    }

    setupDelegatedListener() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-switch');
            // If the button has an onclick attribute, the browser might fire both.
            // Our debounce (isToggling) will prevent double-firing.
            if (btn) {
                console.log('[ThemeManager] Delegated click detected');
                this.toggleTheme();
            }
        });
    }

    initToggle(btnId) {
        const btn = document.getElementById(btnId);
        if (btn) this.updateBtnUI(btn);
    }

    toggleTheme() {
        if (this.isToggling) return;
        this.isToggling = true;
        
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        
        console.log(`[ThemeManager] Toggling to ${this.theme}`);
        this.applyTheme();
        this.updateAllSwitches();
        
        setTimeout(() => { this.isToggling = false; }, 300);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        document.dispatchEvent(new CustomEvent('theme-changed', { detail: this.theme }));
    }

    updateAllSwitches() {
        document.querySelectorAll('.theme-switch').forEach(btn => this.updateBtnUI(btn));
    }

    updateBtnUI(btn) {
        if (!btn) return;
        const isLight = this.theme === 'light';
        const iconClass = isLight ? 'bi-sun-fill' : 'bi-moon-stars-fill';
        
        btn.innerHTML = `
            <div class="switch-knob" style="pointer-events: none;">
                <i class="bi ${iconClass}" style="pointer-events: none;"></i>
            </div>
        `;
        
        btn.title = `Switch to ${isLight ? 'Night' : 'Day'} Mode`;
    }

    static getInstance() {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }
}

// Initialize globally immediately
if (!window.themeManager) {
    ThemeManager.getInstance();
}
