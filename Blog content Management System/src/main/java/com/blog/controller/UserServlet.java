package com.blog.controller;

import com.blog.dao.UserDAO;
import com.blog.model.User;
import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/profile")
public class UserServlet extends HttpServlet {
    private final UserDAO userDAO = new UserDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        HttpSession session = req.getSession(false);
        User currentUserData = (session != null) ? (User) session.getAttribute("user") : null;
        String currentLoggedInUser = (currentUserData != null) ? currentUserData.getUsername() : null;

        if (username == null || username.isEmpty()) {
            if (currentLoggedInUser == null) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            username = currentLoggedInUser;
        }

        User user = userDAO.getUserByUsername(username);
        if (user == null) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        // Don't send password
        Map<String, Object> data = new HashMap<>();
        data.put("username", user.getUsername());
        data.put("fullName", user.getFullName());
        data.put("bio", user.getBio());
        data.put("profileImage", user.getProfileImage());
        data.put("isOwnProfile", username.equals(currentLoggedInUser));

        resp.setContentType("application/json");
        resp.getWriter().write(gson.toJson(data));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doPut(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        User currentUser = (User) session.getAttribute("user");
        String username = currentUser.getUsername();
        User updateData = gson.fromJson(req.getReader(), User.class);
        
        User user = userDAO.getUserByUsername(username);
        if (user == null) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        user.setFullName(updateData.getFullName());
        user.setBio(updateData.getBio());
        user.setProfileImage(updateData.getProfileImage());

        boolean success = userDAO.updateProfile(user);
        
        resp.setContentType("application/json");
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        resp.getWriter().write(gson.toJson(result));
    }
}
