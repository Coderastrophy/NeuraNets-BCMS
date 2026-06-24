import NotificationRenderer from './components/NotificationRenderer.js';
import { getContextPath } from './utils/UrlUtil.js';

const notifier = NotificationRenderer.getInstance();

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');
    
    try {
        const contextPath = getContextPath();
        const response = await fetch(`${contextPath}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            notifier.showToast('Registration successful! Please sign in.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            errorMsg.textContent = 'Registration failed. Username might be taken.';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'An error occurred. Please try again.';
        errorMsg.style.display = 'block';
    }
});
