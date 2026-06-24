package com.blog.dao;

import com.blog.model.Comment;
import com.blog.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CommentDAO {

    public void createComment(Comment comment) {
        String sql = "INSERT INTO comments (post_id, username, content, created_at) VALUES (?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, comment.getPostId());
            pstmt.setString(2, comment.getUsername());
            pstmt.setString(3, comment.getContent());
            pstmt.setLong(4, System.currentTimeMillis());
            
            pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public List<Comment> getCommentsByPostId(int postId) {
        List<Comment> comments = new ArrayList<>();
        String sql = "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, postId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Comment comment = new Comment();
                    comment.setId(rs.getInt("id"));
                    comment.setPostId(rs.getInt("post_id"));
                    comment.setUsername(rs.getString("username"));
                    comment.setContent(rs.getString("content"));
                    comment.setCreatedAt(rs.getLong("created_at"));
                    comments.add(comment);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return comments;
    }

    public List<Comment> getCommentsByUsername(String username) {
        List<Comment> comments = new ArrayList<>();
        String sql = "SELECT * FROM comments WHERE username = ? ORDER BY created_at DESC";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Comment comment = new Comment();
                    comment.setId(rs.getInt("id"));
                    comment.setPostId(rs.getInt("post_id"));
                    comment.setUsername(rs.getString("username"));
                    comment.setContent(rs.getString("content"));
                    comment.setCreatedAt(rs.getLong("created_at"));
                    comments.add(comment);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return comments;
    }
}
