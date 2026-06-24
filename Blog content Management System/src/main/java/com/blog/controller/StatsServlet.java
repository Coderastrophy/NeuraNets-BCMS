package com.blog.controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet("/api/stats")
public class StatsServlet extends HttpServlet {

    private Gson gson;

    @Override
    public void init() throws ServletException {
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        com.blog.model.User user = (com.blog.model.User) req.getSession().getAttribute("user");
        if (user == null) {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login required for stats");
            return;
        }
        String currentUsername = user.getUsername();

        int totalViews = 0;
        int totalPosts = 0;
        int totalLikes = 0;
        
        try (java.sql.Connection conn = com.blog.util.DatabaseUtil.getConnection();
             java.sql.PreparedStatement stmtPosts = conn.prepareStatement("SELECT COUNT(*), SUM(view_count) FROM posts WHERE author = ? AND status = 'PUBLISHED'");
             java.sql.PreparedStatement stmtLikes = conn.prepareStatement("SELECT COUNT(*) FROM reactions r JOIN posts p ON r.post_id = p.id WHERE p.author = ? AND r.type = 'LIKE'")) {
             
             // Count Posts and Views
             stmtPosts.setString(1, currentUsername);
             try (java.sql.ResultSet rs = stmtPosts.executeQuery()) {
                 if (rs.next()) {
                     totalPosts = rs.getInt(1);
                     totalViews = rs.getInt(2);
                 }
             }
             
             // Count Likes on User's Posts
             stmtLikes.setString(1, currentUsername);
             try (java.sql.ResultSet rs = stmtLikes.executeQuery()) {
                 if (rs.next()) totalLikes = rs.getInt(1);
             }

        } catch (Exception e) {
            e.printStackTrace();
        }

        JsonObject stats = new JsonObject();
        stats.addProperty("presentations", totalPosts);
        stats.addProperty("views", totalViews);
        stats.addProperty("reads", (int)(totalViews * 0.7)); // Simulated ratio
        stats.addProperty("likes", totalLikes);
        stats.addProperty("followers", 0);    // Follower system not yet implemented
        stats.addProperty("subscribers", 0);  
        
        resp.setContentType("application/json");
        resp.getWriter().write(gson.toJson(stats));
    }
}
