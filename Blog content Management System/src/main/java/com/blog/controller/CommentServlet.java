package com.blog.controller;

import com.blog.dao.CommentDAO;
import com.blog.dao.PostDAO;
import com.blog.dao.NotificationDAO;
import com.blog.model.Comment;
import com.blog.model.Post;
import com.blog.model.User;
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

@WebServlet("/api/comments")
public class CommentServlet extends HttpServlet {

    private CommentDAO commentDAO;
    private PostDAO postDAO;
    private NotificationDAO notificationDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        commentDAO = new CommentDAO();
        postDAO = new PostDAO();
        notificationDAO = new NotificationDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String postIdStr = req.getParameter("postId");
        String username = req.getParameter("username");
        
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        if (postIdStr != null) {
            try {
                int postId = Integer.parseInt(postIdStr);
                List<Comment> comments = commentDAO.getCommentsByPostId(postId);
                resp.getWriter().write(gson.toJson(comments));
            } catch (NumberFormatException e) {
                resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid post ID");
            }
        } else if (username != null) {
            List<Comment> comments = commentDAO.getCommentsByUsername(username);
            resp.getWriter().write(gson.toJson(comments));
        } else {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing post ID or username");
        }
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

        Comment newComment = gson.fromJson(sb.toString(), Comment.class);
        if (newComment.getContent() == null || newComment.getContent().trim().isEmpty()) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Content is required");
            return;
        }

        newComment.setUsername(user.getUsername());
        commentDAO.createComment(newComment);

        try {
            Post post = postDAO.getPostById(newComment.getPostId(), null);
            if (post != null && post.getAuthor() != null && !post.getAuthor().getUsername().equals(user.getUsername())) {
                notificationDAO.addNotification(
                    post.getAuthor().getUsername(), 
                    user.getUsername(), 
                    user.getUsername() + " commented on: " + post.getTitle(), 
                    "COMMENT"
                );
            }
        } catch (Exception e) { e.printStackTrace(); }

        resp.setStatus(HttpServletResponse.SC_CREATED);
        resp.getWriter().write("{\"message\": \"Comment added\"}");
    }
}
