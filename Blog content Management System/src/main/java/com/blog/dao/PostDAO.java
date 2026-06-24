package com.blog.dao;

import com.blog.model.Post;
import com.blog.model.User;
import com.blog.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PostDAO {

    private String getEnrichedSql(String whereClause, String currentUsername) {
        String hasLikedPart = currentUsername != null ? 
            ", (SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND username = '" + currentUsername + "' AND type = 'LIKE') > 0 as has_liked " : ", false as has_liked ";
        String hasSavedPart = currentUsername != null ? 
            ", (SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND username = '" + currentUsername + "' AND type = 'SAVE') > 0 as has_saved " : ", false as has_saved ";

        return "SELECT p.*, u.id as user_id, u.username as user_name, u.profile_image, " +
               "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND type = 'LIKE') as like_count, " +
               "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND type = 'SAVE') as save_count, " +
               "(SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count, " +
               "0 as share_count " +
               hasLikedPart + hasSavedPart +
               "FROM posts p LEFT JOIN users u ON p.author = u.username " +
               whereClause + " ORDER BY p.created_at DESC";
    }

    public int createPost(Post post) throws SQLException {
        String sql = "INSERT INTO posts (title, content, author, created_at, status, category) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setString(1, post.getTitle());
            pstmt.setString(2, post.getContent());
            pstmt.setString(3, post.getAuthor() != null ? post.getAuthor().getUsername() : "anonymous");
            pstmt.setLong(4, System.currentTimeMillis());
            pstmt.setString(5, post.getStatus() != null ? post.getStatus() : "PUBLISHED");
            pstmt.setString(6, post.getCategory() != null ? post.getCategory() : "Uncategorized");
            
            pstmt.executeUpdate();
            
            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    return generatedKeys.getInt(1);
                }
            }
        }
        return -1;
    }

    public List<Post> getAllPosts(String currentUsername) {
        List<Post> posts = new ArrayList<>();
        String sql = getEnrichedSql("WHERE p.status = 'PUBLISHED'", currentUsername);
        
        try (Connection conn = DatabaseUtil.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                posts.add(mapPost(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return posts;
    }

    public List<Post> getAllPostsAdmin() {
        List<Post> posts = new ArrayList<>();
        // Admin sees everything, no need for complex reaction logic per user usually, 
        // but we'll re-use basic select to keep it simple, or just selecting raw posts.
        // Let's reuse getEnrichedSql but with '1=1' to see all.
        // We pass null for currentUsername as admin view might not need "hasLiked" for the admin themselves, 
        // or we could pass "admin" if we wanted. Let's pass null for simplicity.
        String sql = getEnrichedSql("WHERE 1=1", null); 
        
        try (Connection conn = DatabaseUtil.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                posts.add(mapPost(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return posts;
    }

    public Post getPostById(int id, String currentUsername) {
        String sql = "SELECT p.*, u.id as user_id, u.username as user_name, u.profile_image, " +
                     "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND type = 'LIKE') as like_count, " +
                     "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND type = 'SAVE') as save_count, " +
                     "(SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count, " +
                     "0 as share_count, " +
                     (currentUsername != null ? "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND username = ? AND type = 'LIKE') > 0 as has_liked, " : "false as has_liked, ") +
                     (currentUsername != null ? "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND username = ? AND type = 'SAVE') > 0 as has_saved " : "false as has_saved ") +
                     "FROM posts p LEFT JOIN users u ON p.author = u.username " +
                     "WHERE p.id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            int paramIdx = 1;
            if (currentUsername != null) {
                pstmt.setString(paramIdx++, currentUsername);
                pstmt.setString(paramIdx++, currentUsername);
            }
            pstmt.setInt(paramIdx, id);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapPost(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<Post> getPostsByAuthor(String author, String status, String currentUsername) {
        List<Post> posts = new ArrayList<>();
        String whereClause = "WHERE p.author = ? " + (status != null ? "AND p.status = ? " : "");
        String sql = getEnrichedSql(whereClause, currentUsername);
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, author);
            if (status != null) {
                pstmt.setString(2, status);
            }
            
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    posts.add(mapPost(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return posts;
    }

    public List<Post> getSavedPosts(String username) {
        List<Post> posts = new ArrayList<>();
        String sql = "SELECT p.*, u.id as user_id, u.username as user_name, u.profile_image, " +
                     "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND type = 'LIKE') as like_count, " +
                     "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND type = 'SAVE') as save_count, " +
                     "(SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count, " +
                     "0 as share_count, " +
                     "true as has_saved, " +
                     "(SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND username = ? AND type = 'LIKE') > 0 as has_liked " +
                     "FROM posts p " +
                     "JOIN reactions r ON p.id = r.post_id " +
                     "LEFT JOIN users u ON p.author = u.username " +
                     "WHERE r.username = ? AND r.type = 'SAVE' " +
                     "ORDER BY p.created_at DESC";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, username);
            pstmt.setString(2, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    posts.add(mapPost(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return posts;
    }

    public void incrementViewCount(int postId) {
        String sql = "UPDATE posts SET view_count = view_count + 1 WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, postId);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public boolean updatePost(Post post) {
        String sql = "UPDATE posts SET title = ?, content = ?, status = ?, category = ? WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, post.getTitle());
            pstmt.setString(2, post.getContent());
            pstmt.setString(3, post.getStatus() != null ? post.getStatus() : "PUBLISHED");
            pstmt.setString(4, post.getCategory() != null ? post.getCategory() : "Uncategorized");
            pstmt.setInt(5, post.getId());
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deletePost(int id) {
        String sql = "DELETE FROM posts WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            // 1. Delete reactions
            try (PreparedStatement p1 = conn.prepareStatement("DELETE FROM reactions WHERE post_id = ?")) {
                p1.setInt(1, id);
                p1.executeUpdate();
            }
            
            // 2. Delete comments
            try (PreparedStatement p2 = conn.prepareStatement("DELETE FROM comments WHERE post_id = ?")) {
                p2.setInt(1, id);
                p2.executeUpdate();
            }

            // 3. Delete post
            pstmt.setInt(1, id);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private Post mapPost(ResultSet rs) throws SQLException {
        Post post = new Post();
        post.setId(rs.getInt("id"));
        post.setTitle(rs.getString("title"));
        post.setContent(rs.getString("content"));
        
        User author = new User();
        author.setId(rs.getInt("user_id"));
        author.setUsername(rs.getString("user_name"));
        author.setProfileImage(rs.getString("profile_image"));
        if (author.getUsername() == null) {
            author.setUsername(rs.getString("author"));
        }
        post.setAuthor(author);
        
        post.setCreatedAt(rs.getLong("created_at"));
        post.setViewCount(rs.getInt("view_count"));
        post.setStatus(rs.getString("status"));
        post.setCategory(rs.getString("category"));

        // Map Enriched Stats
        post.setLikeCount(rs.getInt("like_count"));
        post.setSaveCount(rs.getInt("save_count"));
        post.setShareCount(rs.getInt("share_count"));
        post.setCommentCount(rs.getInt("comment_count"));
        post.setHasLiked(rs.getBoolean("has_liked"));
        post.setHasSaved(rs.getBoolean("has_saved"));

        return post;
    }
}
