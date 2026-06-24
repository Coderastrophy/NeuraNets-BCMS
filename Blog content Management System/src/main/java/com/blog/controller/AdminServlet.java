package com.blog.controller;

import com.blog.dao.PostDAO;
import com.blog.dao.UserDAO;
import com.blog.model.User;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.blog.model.Post;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;

@WebServlet(urlPatterns = {"/api/admin/users", "/api/admin/posts", "/api/admin/users/restrict"})
public class AdminServlet extends HttpServlet {

    private UserDAO userDAO;
    private PostDAO postDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        userDAO = new UserDAO();
        postDAO = new PostDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        User user = (session != null) ? (User) session.getAttribute("user") : null;

        if (user == null || !"admin".equals(user.getUsername())) {
            resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
            return;
        }

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getServletPath();

        if ("/api/admin/users".equals(path)) {
            List<User> users = userDAO.getAllUsers();
            resp.getWriter().write(gson.toJson(users));
        } else if ("/api/admin/posts".equals(path)) {
            List<Post> posts = postDAO.getAllPostsAdmin();
            resp.getWriter().write(gson.toJson(posts));
        } else {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        User admin = (session != null) ? (User) session.getAttribute("user") : null;

        if (admin == null || !"admin".equals(admin.getUsername())) {
            resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
            return;
        }

        String path = req.getServletPath();
        
        if ("/api/admin/users/restrict".equals(path)) {
            // Toggle User Restriction
            try {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = req.getReader().readLine()) != null) {
                    sb.append(line);
                }
                
                JsonObject json = gson.fromJson(sb.toString(), JsonObject.class);
                int userId = json.get("userId").getAsInt();
                boolean restrict = json.get("restrict").getAsBoolean();
                
                boolean success = userDAO.updateRestriction(userId, restrict);
                
                resp.setContentType("application/json");
                if (success) {
                    resp.getWriter().write("{\"success\": true}");
                } else {
                    resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    resp.getWriter().write("{\"success\": false, \"message\": \"Database update failed\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid request format");
            }
        } else {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
}
