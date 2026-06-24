package com.blog.controller;

import com.blog.dao.UserDAO;
import com.blog.model.User;
import com.blog.util.PasswordUtil;
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

@WebServlet(urlPatterns = {"/api/auth/login", "/api/auth/me"})
public class AuthServlet extends HttpServlet {

    private UserDAO userDAO;
    private Gson gson;

    public AuthServlet() {
    }

    public AuthServlet(UserDAO userDAO, Gson gson) {
        this.userDAO = userDAO;
        this.gson = gson;
    }

    @Override
    public void init() throws ServletException {
        if (userDAO == null) {
            userDAO = new UserDAO();
        }
        if (gson == null) {
            gson = new Gson();
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = req.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        User loginRequest = gson.fromJson(sb.toString(), User.class);

        if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing username or password");
            return;
        }

        User user = userDAO.getUserByUsername(loginRequest.getUsername());

        if (user != null && PasswordUtil.checkPassword(loginRequest.getPassword(), user.getPassword())) {
            
            if (user.isRestricted()) {
                resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Account suspended. Please contact admin.");
                return;
            }

            HttpSession session = req.getSession();
            session.setAttribute("user", user);

            resp.setStatus(HttpServletResponse.SC_OK);
            resp.setContentType("application/json");
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("message", "Login successful");
            jsonResponse.addProperty("username", user.getUsername());
            resp.getWriter().write(gson.toJson(jsonResponse));
        } else {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid username or password");
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        if (session != null && session.getAttribute("user") != null) {
            User user = (User) session.getAttribute("user");
            // Return public user info (hide password)
            JsonObject json = new JsonObject();
            json.addProperty("id", user.getId());
            json.addProperty("username", user.getUsername());
            json.addProperty("isLoggedIn", true);
            resp.getWriter().write(gson.toJson(json));
        } else {
            resp.getWriter().write("{\"isLoggedIn\": false}");
        }
    }
}
