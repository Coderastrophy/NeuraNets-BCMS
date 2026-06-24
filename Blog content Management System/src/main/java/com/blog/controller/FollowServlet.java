package com.blog.controller;

import com.blog.dao.FollowDAO;
import com.blog.dao.NotificationDAO;
import com.blog.model.User;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;

@WebServlet("/api/follow")
public class FollowServlet extends HttpServlet {

    private FollowDAO followDAO;
    private NotificationDAO notificationDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        followDAO = new FollowDAO();
        notificationDAO = new NotificationDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String type = req.getParameter("type"); // 'followers' or 'following' or 'check'
        String username = req.getParameter("username");
        String target = req.getParameter("target");
        
        resp.setContentType("application/json"); 
        
        if ("check".equals(type) && username != null && target != null) {
            boolean isFollowing = followDAO.isFollowing(username, target);
            resp.getWriter().write("{\"isFollowing\": " + isFollowing + "}");
            return;
        }

        if (username == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Username required");
            return;
        }

        List<String> result;
        if ("following".equals(type)) {
            result = followDAO.getFollowing(username);
        } else {
            result = followDAO.getFollowers(username);
        }
        
        resp.getWriter().write(gson.toJson(result));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login required");
            return;
        }
        User currentUser = (User) session.getAttribute("user");
        
        JsonObject json = gson.fromJson(req.getReader(), JsonObject.class);
        String targetUser = json.get("target").getAsString();
        String action = json.has("action") ? json.get("action").getAsString() : "follow";

        if (currentUser.getUsername().equals(targetUser)) {
             resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Cannot follow yourself");
             return;
        }

        boolean success;
        if ("unfollow".equals(action)) {
            success = followDAO.unfollowUser(currentUser.getUsername(), targetUser);
        } else {
            success = followDAO.followUser(currentUser.getUsername(), targetUser);
            if (success) {
                notificationDAO.addNotification(targetUser, currentUser.getUsername(), currentUser.getUsername() + " started following you.", "FOLLOW");
            }
        }
        
        resp.getWriter().write("{\"success\": " + success + "}");
    }
}
