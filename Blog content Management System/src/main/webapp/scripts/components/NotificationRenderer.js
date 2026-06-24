export default class NotificationRenderer {
    constructor() {
        this.ensureContainer();
    }

    ensureContainer() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast-card ${type}`;
        
        const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
        
        toast.innerHTML = `
            <i class="bi ${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('out');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    confirm(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay fade-in';
            
            overlay.innerHTML = `
                <div class="modal-card slide-up">
                    <div class="modal-body">
                        <h5>Confirmation</h5>
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel">Cancel</button>
                        <button class="btn-confirm">Confirm</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            const close = (val) => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                    resolve(val);
                }, 300);
            };
            
            overlay.querySelector('.btn-cancel').onclick = () => close(false);
            overlay.querySelector('.btn-confirm').onclick = () => close(true);
            overlay.onclick = (e) => { if (e.target === overlay) close(false); };
        });
    }

    // Static singleton for easy access
    static getInstance() {
        if (!NotificationRenderer.instance) {
            NotificationRenderer.instance = new NotificationRenderer();
        }
        return NotificationRenderer.instance;
    }
}
