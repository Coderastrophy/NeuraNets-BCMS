package com.blog.dao;

import com.blog.util.DatabaseUtil;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FollowDAO {

    public boolean followUser(String follower, String following) {
        if (follower.equals(following)) return false; // Cannot follow self
        
        String sql = "INSERT INTO follows (follower, following, created_at) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, follower);
            pstmt.setString(2, following);
            pstmt.setLong(3, System.currentTimeMillis());
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            // Ignore duplicate follows
            return false;
        }
    }

    public boolean unfollowUser(String follower, String following) {
        String sql = "DELETE FROM follows WHERE follower = ? AND following = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, follower);
            pstmt.setString(2, following);
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean isFollowing(String follower, String following) {
        String sql = "SELECT COUNT(*) FROM follows WHERE follower = ? AND following = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, follower);
            pstmt.setString(2, following);
            
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

    public List<String> getFollowers(String username) {
        List<String> followers = new ArrayList<>();
        String sql = "SELECT follower FROM follows WHERE following = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    followers.add(rs.getString("follower"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return followers;
    }
    
    public List<String> getFollowing(String username) {
        List<String> following = new ArrayList<>();
        String sql = "SELECT following FROM follows WHERE follower = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    following.add(rs.getString("following"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return following;
    }
}
