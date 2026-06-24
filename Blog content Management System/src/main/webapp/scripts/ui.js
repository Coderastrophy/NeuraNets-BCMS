/**
 * Global UI Scripts for NeuraNotes
 * Handles sidebar toggling and other common UI interactions.
 */

// Toggle Sidebar function
function toggleSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Make it globally available (in case of module scope issues elsewhere, 
// though this script is intended to be loaded regularly)
window.toggleSidebar = toggleSidebar;

// Tab switching logic (used in index.html, profile.html)
function switchTab(element) {
    if (!element) return;
    
    // Remote active class from siblings
    const parent = element.parentElement;
    Array.from(parent.children).forEach(child => {
        child.classList.remove('active');
    });
    
    // Add to clicked
    element.classList.add('active');
}
window.switchTab = switchTab;


const allTopics = [
    'Technology', 'Design', 'Psychology', 'Data Science', 'Programming',
    'Art', 'Engineering', 'Songs', 'Military', 'Cybersecurity',
    'Business', 'Health', 'Travel', 'Food', 'Science',
    'History', 'Philosophy', 'Sports', 'Gaming', 'Politics',
    'Finance', 'DIY & Crafts', 'Marketing', 'Education', 'Fitness',
    'Literature', 'Photography', 'Fashion', 'Environment', 'Animals',
    'Space', 'Robotics', 'Cryptography', 'Mental Health', 'Relationships',
    'Personal Development', 'Architecture', 'Astronomy', 'Cryptocurrencies', 'Web Development'
];

let remainingTopics = [];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initRecommendedTopics() {
    console.log('Initializing recommended topics...');
    remainingTopics = shuffleArray([...allTopics]);
    const initial = remainingTopics.splice(0, 4);
    renderTopics(initial, true);
}

function loadMoreRandomTopics() {
    if (remainingTopics.length === 0) {
        const btn = document.getElementById('load-more-btn');
        if (btn) btn.style.display = 'none';
        return;
    }
    const next = remainingTopics.splice(0, 5);
    renderTopics(next, false);
}

function renderTopics(topics, clear) {
    const container = document.getElementById('recommended-topics');
    if (!container) return;
    
    if (clear) container.innerHTML = '';
    
    topics.forEach(topic => {
        const btn = document.createElement('button');
        btn.className = 'topic-btn';
        btn.textContent = topic;
        btn.onclick = (e) => {
            switchTab(e.target);
            document.dispatchEvent(new CustomEvent('filter-posts', { detail: topic }));
        };
        container.appendChild(btn);
    });
}

window.initRecommendedTopics = initRecommendedTopics;
window.loadMoreRandomTopics = loadMoreRandomTopics;
