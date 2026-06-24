package com.blog.controller;

import com.blog.dao.ListDAO;
import com.blog.model.Post;
import com.blog.model.User;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.lang.reflect.Type;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/lists/*")
public class ListServlet extends HttpServlet {
    private final ListDAO listDAO = new ListDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        String username = req.getParameter("username");

        if (pathInfo == null || pathInfo.equals("/")) {
            // Get all lists for a user
            if (username == null) {
                HttpSession session = req.getSession(false);
                if (session != null && session.getAttribute("user") != null) {
                    username = ((User) session.getAttribute("user")).getUsername();
                } else {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    return;
                }
            }
            List<Map<String, Object>> lists = listDAO.getUserLists(username);
            resp.setContentType("application/json");
            resp.getWriter().write(gson.toJson(lists));

        } else {
            // Get specific list posts: /api/lists/{id}
            try {
                int listId = Integer.parseInt(pathInfo.substring(1));
                List<Post> posts = listDAO.getListPosts(listId);
                resp.setContentType("application/json");
                resp.getWriter().write(gson.toJson(posts));
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        User user = (User) session.getAttribute("user");

        String pathInfo = req.getPathInfo();
        
        if (pathInfo == null || pathInfo.equals("/")) {
            // Create new list
            Type createListBodyType = new TypeToken<Map<String, String>>() {}.getType();
            Map<String, String> body = gson.fromJson(req.getReader(), createListBodyType);
            String name = body.get("name");
            String description = body.get("description");

            int id = listDAO.createList(user.getUsername(), name, description);
            if (id != -1) {
                resp.setContentType("application/json");
                Map<String, Object> res = new HashMap<>();
                res.put("id", id);
                res.put("success", true);
                resp.getWriter().write(gson.toJson(res));
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        } else if (pathInfo.endsWith("/add")) {
            // Add post to list: /api/lists/{id}/add
            // Body: { "postId": 123 }
            try {
                int listId = Integer.parseInt(pathInfo.split("/")[1]);
                Type addPostBodyType = new TypeToken<Map<String, Object>>() {}.getType();
                Map<String, Object> body = gson.fromJson(req.getReader(), addPostBodyType);
                Object postIdObj = body.get("postId");
                int postId = postIdObj instanceof Number ? ((Number) postIdObj).intValue() : Integer.parseInt(postIdObj.toString());

                boolean success = listDAO.addPostToList(listId, postId);
                resp.getWriter().write(gson.toJson(Map.of("success", success)));
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        User user = (User) session.getAttribute("user");

        String pathInfo = req.getPathInfo();
        if (pathInfo != null) {
            try {
                int listId = Integer.parseInt(pathInfo.substring(1));
                boolean success = listDAO.deleteList(listId, user.getUsername());
                 resp.getWriter().write(gson.toJson(Map.of("success", success)));
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
        }
    }
}
