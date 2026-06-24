import { getContextPath } from '../utils/UrlUtil.js';

export default class BlogAPI {
    constructor() {
        this.baseUrl = getContextPath();
    }

    async request(endpoint, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            ...options
        });
        
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    // --- User Profile ---
    async getProfile(username) {
        const url = username ? `/api/profile?username=${username}` : '/api/profile';
        return this.request(url);
    }

    async updateProfile(profileData) {
        return this.request('/api/profile', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
    }

    async getCurrentUser() {
        const user = await this.request('/api/auth/me');
        if (user && user.isLoggedIn === false) {
            return null;
        }
        return user;
    }

    // --- Posts ---
    async getPosts() {
        return this.request('/api/posts');
    }

    async getUserPosts(username, status) {
        let url = `/api/posts?author=${username}`;
        if (status) url += `&status=${status}`;
        return this.request(url);
    }

    async getSavedPosts() {
        return this.request('/api/posts?saved=true');
    }

    async getPostById(id) {
        return this.request(`/api/posts?id=${id}`);
    }

    async createPost(post) {
        return this.request('/api/posts', {
            method: 'POST',
            body: JSON.stringify(post)
        });
    }

    async updatePost(post) {
        return this.request('/api/posts', {
            method: 'PUT',
            body: JSON.stringify(post)
        });
    }

    async deletePost(id) {
        return this.request(`/api/posts?id=${id}`, {
            method: 'DELETE'
        });
    }

    // --- Reactions ---
    async toggleReaction(postId, type = 'LIKE') {
        return this.request('/api/reactions', {
            method: 'POST',
            body: JSON.stringify({ postId, type })
        });
    }

    async getReactionCount(postId, type = 'LIKE') {
        return this.request(`/api/reactions?postId=${postId}&type=${type}`);
    }

    // --- Comments ---
    async getComments(postId) {
        return this.request(`/api/comments?postId=${postId}`);
    }

    async getUserComments(username) {
        return this.request(`/api/comments?username=${username}`);
    }

    async addComment(postId, content) {
        return this.request('/api/comments', {
            method: 'POST',
            body: JSON.stringify({ postId, content })
        });
    }

    // --- Stats ---
    async getStats() {
        return this.request('/api/stats');
    }

    // --- Notifications ---
    async getNotifications() {
        return this.request('/api/notifications');
    }

    async markNotificationsAsRead() {
        return this.request('/api/notifications', { method: 'POST' });
    }

    // --- Follow System ---
    async toggleFollow(targetUsername, action) {
        return this.request('/api/follow', {
            method: 'POST',
            body: JSON.stringify({ target: targetUsername, action: action })
        });
    }

    async getFollowing(username) {
        return this.request(`/api/follow?type=following&username=${username}`);
    }

    async checkFollowStatus(username, target) {
        return this.request(`/api/follow?type=check&username=${username}&target=${target}`);
    }

    // --- Custom Lists ---
    async createList(name, description) {
        return this.request('/api/lists', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
    }

    async getUserLists(username) {
        let url = '/api/lists';
        if (username) url += `?username=${username}`;
        return this.request(url);
    }

    async getListPosts(listId) {
        return this.request(`/api/lists/${listId}`);
    }

    async deleteList(listId) {
        return this.request(`/api/lists/${listId}`, {
            method: 'DELETE'
        });
    }

    async addPostToList(listId, postId) {
        return this.request(`/api/lists/${listId}/add`, {
            method: 'POST',
            body: JSON.stringify({ postId })
        });
    }

    // --- Admin ---
    async getAdminUsers() {
        return this.request('/api/admin/users');
    }

    async getAdminPosts() {
        return this.request('/api/admin/posts');
    }
}
