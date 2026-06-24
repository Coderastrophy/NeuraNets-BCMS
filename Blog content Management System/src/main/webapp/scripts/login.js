import NotificationRenderer from './components/NotificationRenderer.js';
import { getContextPath } from './utils/UrlUtil.js';

const notifier = NotificationRenderer.getInstance();

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    
    // Reset errors
    errorMessage.textContent = '';
    
    try {
        const contextPath = getContextPath();
        const response = await fetch(`${contextPath}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });
 
        if (response.ok) {
            const data = await response.json();
            notifier.showToast('Welcome back!', 'success');
            setTimeout(() => {
                if (data.username === 'admin' || usernameInput.value === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 800);
        } else {
            const data = await response.json().catch(() => ({}));
            errorMessage.textContent = data.message || 'Invalid username or password';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = 'An error occurred. Please try again.';
    }
});
