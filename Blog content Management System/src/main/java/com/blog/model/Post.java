package com.blog.model;

public class Post {
    private int id;
    private String title;
    private String content;
    private User author;
    private long createdAt;
    private int viewCount;
    private String status; // 'DRAFT' or 'PUBLISHED'
    private String category; // 'Technology', 'Design', 'Psychology', etc.

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getViewCount() { return viewCount; }
    public void setViewCount(int viewCount) { this.viewCount = viewCount; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    private int likeCount;
    private int saveCount;
    private int shareCount; // Added as per user request
    private int commentCount;
    private boolean hasLiked;
    private boolean hasSaved;

    // Getters and Setters for stats
    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }
    
    public int getShareCount() { return shareCount; }
    public void setShareCount(int shareCount) { this.shareCount = shareCount; }

    public int getSaveCount() { return saveCount; }
    public void setSaveCount(int saveCount) { this.saveCount = saveCount; }
    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }
    public boolean isHasLiked() { return hasLiked; }
    public void setHasLiked(boolean hasLiked) { this.hasLiked = hasLiked; }
    public boolean isHasSaved() { return hasSaved; }
    public void setHasSaved(boolean hasSaved) { this.hasSaved = hasSaved; }

    public Post() {}

    public Post(int id, String title, String content, User author, long createdAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.author = author;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
