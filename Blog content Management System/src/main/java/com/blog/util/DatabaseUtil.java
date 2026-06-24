package com.blog.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseUtil {
    
    private static final String URL = "jdbc:h2:~/blog_cms_db;AUTO_SERVER=TRUE";
    private static final String USER = "sa";
    private static final String PASSWORD = "";

    static {
        try {
            Class.forName("org.h2.Driver");
            initDatabase();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    private static void initDatabase() {
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            // 1. Posts table
            stmt.execute("CREATE TABLE IF NOT EXISTS posts (" +
                         "id INT AUTO_INCREMENT PRIMARY KEY, " +
                         "title VARCHAR(255) NOT NULL, " +
                         "content TEXT NOT NULL, " +
                         "author VARCHAR(100), " +
                         "created_at BIGINT, " +
                         "status VARCHAR(20) DEFAULT 'PUBLISHED', " +
                         "category VARCHAR(50) DEFAULT 'Uncategorized', " +
                         "view_count INT DEFAULT 0)");

            // 2. Users table
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                              "id INT AUTO_INCREMENT PRIMARY KEY, " +
                              "username VARCHAR(50) NOT NULL UNIQUE, " +
                              "password VARCHAR(100) NOT NULL, " +
                              "full_name VARCHAR(100), " +
                              "bio TEXT, " +
                              "profile_image VARCHAR(255))");

            // 3. Comments table
            stmt.execute("CREATE TABLE IF NOT EXISTS comments (" +
                    "id INT AUTO_INCREMENT PRIMARY KEY, " +
                    "post_id INT NOT NULL, " +
                    "username VARCHAR(255) NOT NULL, " +
                    "content TEXT NOT NULL, " +
                    "created_at BIGINT NOT NULL, " +
                    "FOREIGN KEY (post_id) REFERENCES posts(id))");

            // 4. Reactions table
            stmt.execute("CREATE TABLE IF NOT EXISTS reactions (" +
                    "id INT AUTO_INCREMENT PRIMARY KEY, " +
                    "post_id INT NOT NULL, " +
                    "username VARCHAR(255) NOT NULL, " +
                    "type VARCHAR(20) DEFAULT 'LIKE', " +
                    "CONSTRAINT unique_reaction UNIQUE (post_id, username, type), " +
                    "FOREIGN KEY (post_id) REFERENCES posts(id))");

            // 5. Notifications table
            stmt.execute("CREATE TABLE IF NOT EXISTS notifications (" +
                    "id INT AUTO_INCREMENT PRIMARY KEY, " +
                    "username VARCHAR(50) NOT NULL, " +
                    "actor VARCHAR(50), " +
                    "message TEXT NOT NULL, " +
                    "type VARCHAR(20), " +
                    "is_read BOOLEAN DEFAULT FALSE, " +
                    "created_at BIGINT NOT NULL)");

            // 6. Follows table
            stmt.execute("CREATE TABLE IF NOT EXISTS follows (" +
                    "id INT AUTO_INCREMENT PRIMARY KEY, " +
                    "follower VARCHAR(50) NOT NULL, " +
                    "following VARCHAR(50) NOT NULL, " +
                    "created_at BIGINT NOT NULL, " +
                    "UNIQUE(follower, following))");

            // 7. Custom Lists table
            stmt.execute("CREATE TABLE IF NOT EXISTS custom_lists (" +
                    "id INT AUTO_INCREMENT PRIMARY KEY, " +
                    "username VARCHAR(50) NOT NULL, " +
                    "name VARCHAR(100) NOT NULL, " +
                    "description TEXT, " +
                    "created_at BIGINT NOT NULL)");

            // 8. List Entries table
            stmt.execute("CREATE TABLE IF NOT EXISTS list_entries (" +
                    "id INT AUTO_INCREMENT PRIMARY KEY, " +
                    "list_id INT NOT NULL, " +
                    "post_id INT NOT NULL, " +
                    "created_at BIGINT NOT NULL, " +
                    "FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE, " +
                    "FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, " +
                    "UNIQUE(list_id, post_id))");

            // --- Ensure Columns Exist (for upgrades) ---
            try {
                stmt.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Uncategorized'");
                stmt.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PUBLISHED'");
                stmt.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0");
                stmt.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0");
                stmt.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100)");
                stmt.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT");
                stmt.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255)");
                stmt.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT FALSE");
            } catch (SQLException e) { }

            // --- Default Users ---
            try (ResultSet rs1 = stmt.executeQuery("SELECT COUNT(*) FROM users WHERE username = 'admin'")) {
                if (rs1.next() && rs1.getInt(1) == 0) {
                    String hashedPassword = PasswordUtil.hashPassword("admin");
                    stmt.execute("INSERT INTO users (username, password) VALUES ('admin', '" + hashedPassword + "')");
                }
            }
            
            try (ResultSet rs2 = stmt.executeQuery("SELECT COUNT(*) FROM users WHERE username = 'Tester'")) {
                if (rs2.next() && rs2.getInt(1) == 0) {
                    String hashedTesterPassword = PasswordUtil.hashPassword("Tester@123");
                    stmt.execute("INSERT INTO users (username, password) VALUES ('Tester', '" + hashedTesterPassword + "')");
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
