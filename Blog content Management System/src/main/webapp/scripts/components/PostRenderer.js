export default class PostRenderer {
    
    createPostElement(post, stats = { likes: 0, hasLiked: false, hasSaved: false, commentCount: 0 }, callbacks) {
        const date = new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const categoryImages = {
            'Technology': 'assets/images/categories/technology.jpg',
            'Design': 'assets/images/categories/design.jpg',
            'Robotics': 'assets/images/categories/robotics.jpg',
            'Psychology': 'assets/images/categories/psychology.jpg',
            'Science': 'assets/images/categories/science.jpg',
            'Health': 'assets/images/categories/health.jpg',
            'Business': 'assets/images/categories/business.jpg',
            'Travel': 'assets/images/categories/travel.jpg',
            'Food': 'assets/images/categories/food.jpg',
            'Data Science': 'assets/images/categories/data-science.jpg',
            'Programming': 'assets/images/categories/programming.jpg',
            'Art': 'assets/images/categories/art.jpg',
            'Engineering': 'assets/images/categories/engineering.jpg',
            'Songs': 'assets/images/categories/songs.jpg',
            'Military': 'assets/images/categories/military.jpg',
            'Cybersecurity': 'assets/images/categories/cybersecurity.jpg',
            'History': 'assets/images/categories/history.jpg',
            'Philosophy': 'assets/images/categories/philosophy.jpg',
            'Sports': 'assets/images/categories/sports.jpg',
            'Gaming': 'assets/images/categories/gaming.jpg',
            'Politics': 'assets/images/categories/politics.jpg',
            'Finance': 'assets/images/categories/finance.jpg',
            'DIY & Crafts': 'assets/images/categories/diy-crafts.jpg',
            'Marketing': 'assets/images/categories/marketing.jpg',
            'Education': 'assets/images/categories/education.jpg',
            'Fitness': 'assets/images/categories/fitness.jpg',
            'Literature': 'assets/images/categories/literature.jpg',
            'Photography': 'assets/images/categories/photography.jpg',
            'Fashion': 'assets/images/categories/fashion.jpg',
            'Environment': 'assets/images/categories/environment.jpg',
            'Animals': 'assets/images/categories/animals.jpg',
            'Space': 'assets/images/categories/space.jpg',
            'Cryptography': 'assets/images/categories/cryptography.jpg',
            'Mental Health': 'assets/images/categories/mental-health.jpg',
            'Relationships': 'assets/images/categories/relationships.jpg',
            'Personal Development': 'assets/images/categories/personal-development.jpg',
            'Architecture': 'assets/images/categories/architecture.jpg',
            'Astronomy': 'assets/images/categories/astronomy.jpg',
            'Cryptocurrencies': 'assets/images/categories/cryptocurrencies.jpg',
            'Web Development': 'assets/images/categories/web-development.jpg'
        };
        const fallbackImg = 'assets/images/categories/default.jpg';
        const finalImg = categoryImages[post.category] || fallbackImg;

        const div = document.createElement('div');
        div.className = 'article-card fade-in';
        div.innerHTML = `
            <div class="article-content-container clearfix">
                <div class="d-flex align-items-center mb-2 gap-2">
                    <img src="${post.author.profileImage ? post.author.profileImage : `https://ui-avatars.com/api/?name=${post.author.username}&background=random`}" class="rounded-circle" width="20" height="20">
                    <span class="small fw-bold">${post.author.username}</span>
                    <button class="btn btn-sm btn-outline-success py-0 px-2 ms-2 follow-btn" style="font-size: 0.7rem;">${post.isFollowing ? 'Following' : 'Follow'}</button>
                    <span class="text-muted small ms-2">in</span>
                    <span class="small fw-bold">${post.category || 'Uncategorized'}</span>
                </div>
                
                <!-- Rectangular floating image -->
                <img src="${finalImg}" class="article-img-floated d-none d-md-block" 
                     onerror="this.src='${fallbackImg}'; this.onerror=null;"
                     alt="${post.category || 'Category'}">
                
                <h2 class="article-title">${post.title}</h2>
                <p class="article-desc">${post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...</p>
                
                <div class="article-meta mt-4">
                    <span class="me-3">${date}</span>
                    <div class="interaction-group">
                        <span class="interaction-item like-btn ${stats.hasLiked ? 'text-primary' : ''}">
                            <i class="bi ${stats.hasLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}"></i>
                            <span class="ms-1">${stats.likes || 0}</span>
                        </span>
                        <span class="interaction-item comment-btn">
                            <i class="bi bi-chat-dots"></i>
                            <span class="ms-1">${stats.commentCount || 0}</span>
                        </span>
                        <span class="interaction-item save-btn ${stats.hasSaved ? 'text-success' : ''}" title="Save">
                            <i class="bi ${stats.hasSaved ? 'bi-bookmark-check-fill' : 'bi-bookmark-plus'}"></i>
                        </span>
                        <span class="interaction-item share-btn" title="Share">
                            <i class="bi bi-share"></i>
                        </span>
                    </div>
                    
                    <div class="dropdown ms-auto">
                        <i class="bi bi-three-dots interaction-item" data-bs-toggle="dropdown" style="cursor: pointer;"></i>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                            <li><button class="dropdown-item py-2 small edit-post-btn"><i class="bi bi-pencil me-2"></i>Edit</button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button class="dropdown-item py-2 small text-danger delete-post-btn"><i class="bi bi-trash me-2"></i>Delete</button></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="comments-section mt-4 pt-4 border-top" style="display: none;">
                <div class="comments-list mb-3"></div>
                <div class="d-flex gap-2">
                     <input type="text" class="form-control form-control-sm comment-input border-0 bg-light px-3" placeholder="Add a response..." style="border-radius: 20px;">
                     <button class="btn btn-sm btn-dark px-3 post-comment-btn" style="border-radius: 20px;">Respond</button>
                </div>
            </div>
        `;

        // Bind Events
        const root = div;
        const followBtn = root.querySelector('.follow-btn');
        if (followBtn) {
            followBtn.onclick = (e) => { 
                e.stopPropagation();
                // Optimistic UI update
                const isFollowing = followBtn.textContent === 'Following';
                followBtn.textContent = isFollowing ? 'Follow' : 'Following';
                followBtn.classList.toggle('btn-outline-success');
                followBtn.classList.toggle('btn-success');
                callbacks.onFollow(post.author.username, isFollowing ? 'unfollow' : 'follow'); 
            };
        }

        root.querySelector('.like-btn').onclick = (e) => { e.stopPropagation(); callbacks.onLike(post.id); };
        root.querySelector('.save-btn').onclick = (e) => { e.stopPropagation(); callbacks.onSave(post.id); };
        root.querySelector('.share-btn').onclick = (e) => {
             e.stopPropagation();
             if (navigator.share) {
                 navigator.share({ title: post.title, text: post.content.substring(0, 100).replace(/<[^>]*>/g, ''), url: window.location.href });
             } else {
                 const dummy = document.createElement('input');
                 document.body.appendChild(dummy);
                 dummy.value = window.location.href;
                 dummy.select();
                 document.execCommand('copy');
                 document.body.removeChild(dummy);
                 alert('Link copied to clipboard!');
             }
        };

        const commentsSection = root.querySelector('.comments-section');
        root.querySelector('.comment-btn').onclick = (e) => {
             e.stopPropagation();
             commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
             if (commentsSection.style.display === 'block') {
                 callbacks.onLoadComments(post.id, commentsSection.querySelector('.comments-list'));
             }
        };

        root.querySelector('.post-comment-btn').onclick = (e) => {
            e.stopPropagation();
            const input = root.querySelector('.comment-input');
            if(input.value.trim()) {
                callbacks.onPostComment(post.id, input.value.trim(), commentsSection.querySelector('.comments-list'));
                input.value = '';
            }
        };
        
        root.querySelector('.edit-post-btn').onclick = (e) => { e.stopPropagation(); callbacks.onEdit(post); };
        root.querySelector('.delete-post-btn').onclick = (e) => { e.stopPropagation(); callbacks.onDelete(post.id); };

        return div;
    }

    renderComments(comments) {
        if (!comments || comments.length === 0) return '<p class="text-muted small ps-2">No responses yet.</p>';
        return comments.map(c => `
            <div class="mb-3 p-3 bg-light rounded-3">
                <div class="d-flex align-items-center mb-2">
                    <img src="https://ui-avatars.com/api/?name=${c.username}&background=random" class="rounded-circle me-2" width="18" height="18">
                    <small class="fw-bold">${c.username}</small>
                </div>
                <p class="mb-0 small text-dark">${c.content}</p>
            </div>
        `).join('');
    }
}
