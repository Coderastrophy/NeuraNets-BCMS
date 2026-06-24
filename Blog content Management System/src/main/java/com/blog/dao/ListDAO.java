package com.blog.dao;

import com.blog.model.Post;
import com.blog.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ListDAO {

    public int createList(String username, String name, String description) {
        String sql = "INSERT INTO custom_lists (username, name, description, created_at) VALUES (?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setString(1, username);
            pstmt.setString(2, name);
            pstmt.setString(3, description);
            pstmt.setLong(4, System.currentTimeMillis());
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        return generatedKeys.getInt(1);
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }

    public List<Map<String, Object>> getUserLists(String username) {
        List<Map<String, Object>> lists = new ArrayList<>();
        // Left join to get count of stories in each list
        String sql = "SELECT l.*, COUNT(le.post_id) as story_count " +
                     "FROM custom_lists l " +
                     "LEFT JOIN list_entries le ON l.id = le.list_id " +
                     "WHERE l.username = ? " +
                     "GROUP BY l.id";
                     
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> list = new HashMap<>();
                    list.put("id", rs.getInt("id"));
                    list.put("name", rs.getString("name"));
                    list.put("description", rs.getString("description"));
                    list.put("createdAt", rs.getLong("created_at"));
                    list.put("storyCount", rs.getInt("story_count"));
                    lists.add(list);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return lists;
    }

    public boolean addPostToList(int listId, int postId) {
        String sql = "INSERT INTO list_entries (list_id, post_id, created_at) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, listId);
            pstmt.setInt(2, postId);
            pstmt.setLong(3, System.currentTimeMillis());
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            // Ignore duplicate entry errors
            return false;
        }
    }

    public boolean removePostFromList(int listId, int postId) {
        String sql = "DELETE FROM list_entries WHERE list_id = ? AND post_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, listId);
            pstmt.setInt(2, postId);
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean deleteList(int listId, String username) {
        String sql = "DELETE FROM custom_lists WHERE id = ? AND username = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, listId);
            pstmt.setString(2, username);
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Post> getListPosts(int listId) {
        List<Post> posts = new ArrayList<>();
        String sql = "SELECT p.*, u.id as user_id, u.username as user_name, u.profile_image FROM posts p " +
                     "JOIN list_entries le ON p.id = le.post_id " +
                     "LEFT JOIN users u ON p.author = u.username " +
                     "WHERE le.list_id = ? " +
                     "ORDER BY le.created_at DESC";
                     
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, listId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Post post = new Post();
                    post.setId(rs.getInt("id"));
                    post.setTitle(rs.getString("title"));
                    post.setContent(rs.getString("content"));
                    
                    // Create User object for author
                    com.blog.model.User author = new com.blog.model.User();
                    author.setId(rs.getInt("user_id"));
                    author.setUsername(rs.getString("user_name"));
                    author.setProfileImage(rs.getString("profile_image"));
                    if (author.getUsername() == null) {
                        author.setUsername(rs.getString("author"));
                    }
                    post.setAuthor(author);
                    
                    post.setCreatedAt(rs.getLong("created_at"));
                    post.setStatus(rs.getString("status"));
                    post.setCategory(rs.getString("category"));
                    post.setViewCount(rs.getInt("view_count"));
                    post.setShareCount(rs.getInt("share_count"));
                    posts.add(post);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return posts;
    }
}
