package com.blog.controller;

import com.blog.dao.PostDAO;
import com.blog.model.User;
import com.blog.model.Post;
import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.List;

@WebServlet("/api/posts")
public class PostServlet extends HttpServlet {

    private PostDAO postDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        postDAO = new PostDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String author = req.getParameter("author");
        String status = req.getParameter("status");
        String saved = req.getParameter("saved");
        
        HttpSession session = req.getSession(false);
        User currentUser = (session != null) ? (User) session.getAttribute("user") : null;
        String currentUsername = (currentUser != null) ? currentUser.getUsername() : null;

        List<Post> posts;
        
        if ("true".equals(saved)) {
            if (currentUsername == null) {
                resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login required to see saved posts");
                return;
            }
            posts = postDAO.getSavedPosts(currentUsername);
        } else if (author != null) {
            posts = postDAO.getPostsByAuthor(author, status, currentUsername);
        } else {
            posts = postDAO.getAllPosts(currentUsername);
        }
        
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1
        resp.setHeader("Pragma", "no-cache"); // HTTP 1.0
        resp.setDateHeader("Expires", 0); // Proxies
        
        resp.getWriter().write(gson.toJson(posts));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "You must be logged in to post.");
            return;
        }
        User user = (User) session.getAttribute("user");

        StringBuilder sb = new StringBuilder();
        BufferedReader reader = req.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        
        Post newPost = gson.fromJson(sb.toString(), Post.class);
        
        if (newPost.getTitle() == null || newPost.getTitle().isEmpty()) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Title is required");
            return;
        }

        newPost.setAuthor(user);
        try {
            int generatedId = postDAO.createPost(newPost);
            
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.setContentType("application/json");
            resp.getWriter().write("{\"message\": \"Post created successfully\", \"id\": " + generatedId + "}");
        } catch (java.sql.SQLException e) {
            e.printStackTrace();
            resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to create post");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
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

        Post updatedPost = gson.fromJson(sb.toString(), Post.class);
        Post existingPost = postDAO.getPostById(updatedPost.getId(), user.getUsername());

        if (existingPost == null) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Post not found");
            return;
        }

        // Ownership check restored: Only the author can edit
        if (!existingPost.getAuthor().getUsername().equalsIgnoreCase(user.getUsername())) {
            String msg = "You can only edit your own posts (Owner: " + existingPost.getAuthor().getUsername() + ", You: " + user.getUsername() + ")";
            resp.sendError(HttpServletResponse.SC_FORBIDDEN, msg);
            return;
        }

        boolean success = postDAO.updatePost(updatedPost);
        if (success) {
            resp.getWriter().write("{\"message\": \"Post updated\"}");
        } else {
            resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to update");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login required");
            return;
        }
        User user = (User) session.getAttribute("user");

        String idStr = req.getParameter("id");
        if (idStr == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing Post ID");
            return;
        }

        int id = Integer.parseInt(idStr);
        Post existingPost = postDAO.getPostById(id, user.getUsername());

        if (existingPost == null) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Post not found");
            return;
        }

        // Ownership check restored: Only the author can delete
        if (!existingPost.getAuthor().getUsername().equalsIgnoreCase(user.getUsername())) {
            String msg = "You can only delete your own posts (Owner: " + existingPost.getAuthor().getUsername() + ", You: " + user.getUsername() + ")";
            resp.sendError(HttpServletResponse.SC_FORBIDDEN, msg);
            return;
        }

        boolean success = postDAO.deletePost(id);
        if (success) {
            resp.getWriter().write("{\"message\": \"Post deleted\"}");
        } else {
            resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to delete");
        }
    }
}
