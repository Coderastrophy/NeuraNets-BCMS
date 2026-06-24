package com.blog.controller;

import com.blog.dao.ReactionDAO;
import com.blog.dao.PostDAO;
import com.blog.dao.NotificationDAO;
import com.blog.model.User;
import com.blog.model.Post;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.BufferedReader;
import java.io.IOException;

@WebServlet("/api/reactions")
public class ReactionServlet extends HttpServlet {

    private ReactionDAO reactionDAO;
    private PostDAO postDAO;
    private NotificationDAO notificationDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        reactionDAO = new ReactionDAO();
        postDAO = new PostDAO();
        notificationDAO = new NotificationDAO();
        gson = new Gson();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login required");
            return;
        }
        User user = (User) session.getAttribute("user");

        StringBuilder sb = new StringBuilder();
        BufferedReader reader = req.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        JsonObject json = gson.fromJson(sb.toString(), JsonObject.class);
        if (!json.has("postId")) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing post ID");
            return;
        }
        int postId = json.get("postId").getAsInt();
        String type = json.has("type") ? json.get("type").getAsString() : "LIKE";

        boolean isAdded = reactionDAO.toggleReaction(postId, user.getUsername(), type);
        
        if (isAdded) {
            try {
                Post post = postDAO.getPostById(postId, null);
                if (post != null && post.getAuthor() != null && !post.getAuthor().getUsername().equals(user.getUsername())) {
                    String message = "";
                    if ("LIKE".equals(type)) message = user.getUsername() + " liked your story: " + post.getTitle();
                    else if ("SAVE".equals(type)) message = user.getUsername() + " saved your story to their reading list.";
                    
                    if (!message.isEmpty()) {
                        notificationDAO.addNotification(post.getAuthor().getUsername(), user.getUsername(), message, type);
                    }
                }
            } catch (Exception e) { e.printStackTrace(); }
        }
        
        resp.setContentType("application/json");
        resp.getWriter().write("{\"success\": true, \"added\": " + isAdded + "}");
    }
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
         String postIdStr = req.getParameter("postId");
         String type = req.getParameter("type") != null ? req.getParameter("type") : "LIKE";
         
         HttpSession session = req.getSession(false);
         String username = (session != null && session.getAttribute("user") != null) 
                 ? ((User) session.getAttribute("user")).getUsername() : null;

         if (postIdStr != null) {
             int postId = Integer.parseInt(postIdStr);
             int count = reactionDAO.getReactionCount(postId, type);
             boolean hasReacted = (username != null) && reactionDAO.hasUserReacted(postId, username, type);
             
             JsonObject json = new JsonObject();
             json.addProperty("count", count);
             json.addProperty("hasReacted", hasReacted);
             
             resp.setContentType("application/json");
             resp.getWriter().write(gson.toJson(json));
         }
    }
}
