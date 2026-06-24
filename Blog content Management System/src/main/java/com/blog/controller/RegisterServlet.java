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
import java.io.BufferedReader;
import java.io.IOException;

@WebServlet("/api/auth/register")
public class RegisterServlet extends HttpServlet {

    private UserDAO userDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        userDAO = new UserDAO();
        gson = new Gson();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = req.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        User registerRequest = gson.fromJson(sb.toString(), User.class);

        if (registerRequest == null || registerRequest.getUsername() == null || registerRequest.getPassword() == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing username or password");
            return;
        }

        if (userDAO.getUserByUsername(registerRequest.getUsername()) != null) {
            resp.sendError(HttpServletResponse.SC_CONFLICT, "Username already exists");
            return;
        }

        // Hash the password before saving
        String hashedPassword = PasswordUtil.hashPassword(registerRequest.getPassword());
        registerRequest.setPassword(hashedPassword);

        if (userDAO.createUser(registerRequest)) {
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.setContentType("application/json");
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("message", "User registered successfully");
            resp.getWriter().write(gson.toJson(jsonResponse));
        } else {
            resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to register user");
        }
    }
}
