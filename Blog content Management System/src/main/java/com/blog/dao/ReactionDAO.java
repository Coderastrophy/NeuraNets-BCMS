package com.blog.dao;

import com.blog.util.DatabaseUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ReactionDAO {


    public boolean toggleReaction(int postId, String username, String type) {
        // Check if exists
        String checkSql = "SELECT id FROM reactions WHERE post_id = ? AND username = ? AND type = ?";
        String insertSql = "INSERT INTO reactions (post_id, username, type) VALUES (?, ?, ?)";
        String deleteSql = "DELETE FROM reactions WHERE post_id = ? AND username = ? AND type = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
            
            checkStmt.setInt(1, postId);
            checkStmt.setString(2, username);
            checkStmt.setString(3, type);
            
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next()) {
                    // Exists, so remove it
                    try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
                        deleteStmt.setInt(1, postId);
                        deleteStmt.setString(2, username);
                        deleteStmt.setString(3, type);
                        deleteStmt.executeUpdate();
                        return false; 
                    }
                } else {
                    // Doesn't exist, so add it
                    try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                        insertStmt.setInt(1, postId);
                        insertStmt.setString(2, username);
                        insertStmt.setString(3, type);
                        insertStmt.executeUpdate();
                        return true; 
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public int getReactionCount(int postId, String type) {
        String sql = "SELECT COUNT(*) FROM reactions WHERE post_id = ? AND type = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, postId);
            pstmt.setString(2, type);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }
    
    public boolean hasUserReacted(int postId, String username, String type) {
        String sql = "SELECT COUNT(*) FROM reactions WHERE post_id = ? AND username = ? AND type = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, postId);
            pstmt.setString(2, username);
            pstmt.setString(3, type);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
