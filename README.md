# NeuraNets-BCMS

> **A full-stack Blog Content Management System built with Java Servlets, DAO architecture, and a vanilla JavaScript frontend.**

NeuraNets-BCMS is a feature-rich blogging platform that lets users write, publish, and manage blog posts with a complete social layer — reactions, comments, follows, notifications, and custom reading lists — all backed by a clean Java EE servlet architecture and a Data Access Object (DAO) pattern for database interaction.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

NeuraNets-BCMS is built as a single deployable Java web application. The backend is composed of Java Servlets acting as REST-style API controllers, each backed by a dedicated DAO class that handles all database communication. The frontend is a vanilla JavaScript single-page-style interface that communicates with the backend entirely through a central `BlogAPI` client class using `fetch`.

The system supports the full lifecycle of blog content — from drafting to publishing — along with a social layer that includes user following, post reactions, comments, notifications, and custom user-curated reading lists.

---

## Features

### Content
- Create, edit, publish, and delete blog posts
- Draft and published post states
- Image/file upload support for posts
- Post filtering by author and status

### Social
- **Reactions** — Like (and other reaction types) on posts
- **Comments** — Comment on posts; view comments per post or per user
- **Follow system** — Follow/unfollow other users; view following lists
- **Notifications** — Real-time-style notification feed; mark all as read
- **Custom Lists** — Create named reading lists, add posts to them, delete lists

### Users
- User registration and authentication
- Session-based login/logout
- User profile pages (view own or others' profiles)
- Profile editing

### Admin
- Admin panel with full user management
- Admin post management and moderation

### Stats
- Platform-wide statistics dashboard

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Browser (Vanilla JS)            │
│                                         │
│   BlogAPI.js  ──►  fetch() calls        │
│   (central API client)                  │
└──────────────────┬──────────────────────┘
                   │ HTTP (REST-style JSON)
┌──────────────────▼──────────────────────┐
│         Java Servlet Layer              │
│  (Controller — one Servlet per domain)  │
│                                         │
│  AuthServlet      PostServlet           │
│  RegisterServlet  CommentServlet        │
│  UserServlet      ReactionServlet       │
│  FollowServlet    NotificationServlet   │
│  ListServlet      StatsServlet          │
│  UploadServlet    AdminServlet          │
│  LogoutServlet                          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           DAO Layer                     │
│  (Data Access Objects — one per entity) │
│                                         │
│  PostDAO       CommentDAO               │
│  UserDAO       FollowDAO                │
│  NotificationDAO  ListDAO               │
│  ReactionDAO                            │
└──────────────────┬──────────────────────┘
                   │ JDBC
┌──────────────────▼──────────────────────┐
│           Database (SQL)                │
└─────────────────────────────────────────┘
```

The application follows a clean **3-tier architecture**:
1. **Presentation** — Vanilla JS frontend consuming a JSON API
2. **Controller** — Java Servlets routing requests and returning JSON responses
3. **Data** — DAO classes encapsulating all SQL queries

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java, Java EE Servlets |
| **Frontend** | Vanilla JavaScript (ES6 modules), HTML5, CSS3 |
| **Architecture Pattern** | DAO (Data Access Object) |
| **Database** | SQL (MySQL / MariaDB) |
| **Database Access** | JDBC |
| **Server** | Apache Tomcat |
| **Build Tool** | Maven |
| **API Style** | REST-style JSON over HTTP |

---

## Project Structure

```
NeuraNets-BCMS/
└── Blog content Management System/
    └── src/
        └── main/
            ├── java/
            │   └── com/blog/
            │       ├── controller/              # Servlet layer (HTTP request handlers)
            │       │   ├── AdminServlet.java    # Admin user & post management
            │       │   ├── AuthServlet.java     # Login & session management
            │       │   ├── CommentServlet.java  # Comment CRUD
            │       │   ├── FollowServlet.java   # Follow/unfollow users
            │       │   ├── ListServlet.java     # Custom reading lists
            │       │   ├── LogoutServlet.java   # Session invalidation
            │       │   ├── NotificationServlet.java  # Notification feed
            │       │   ├── PostServlet.java     # Blog post CRUD
            │       │   ├── ReactionServlet.java # Post reactions (likes etc.)
            │       │   ├── RegisterServlet.java # New user registration
            │       │   ├── StatsServlet.java    # Platform statistics
            │       │   ├── UploadServlet.java   # File/image uploads
            │       │   └── UserServlet.java     # User profile management
            │       │
            │       └── dao/                     # Data Access Object layer
            │           ├── CommentDAO.java
            │           ├── FollowDAO.java
            │           ├── ListDAO.java
            │           ├── NotificationDAO.java
            │           ├── PostDAO.java
            │           └── (ReactionDAO, UserDAO ...)
            │
            └── (webapp/)                        # Frontend assets
                ├── js/
                │   ├── api/
                │   │   └── BlogAPI.js           # Central API client
                │   └── utils/
                │       └── UrlUtil.js           # Context path helpers
                ├── css/
                └── *.html / *.jsp
```

---

## Getting Started

### Prerequisites

- [Java JDK 11+](https://adoptium.net/)
- [Apache Maven 3.6+](https://maven.apache.org/)
- [Apache Tomcat 9+](https://tomcat.apache.org/)
- [MySQL](https://www.mysql.com/) or [MariaDB](https://mariadb.org/)
- A Java IDE (IntelliJ IDEA, Eclipse, or NetBeans recommended)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Coderastrophy/NeuraNets-BCMS.git
cd NeuraNets-BCMS
```

2. **Open the project** in your IDE as a Maven project. The project root is inside:

```
Blog content Management System/
```

3. **Install dependencies** via Maven:

```bash
mvn clean install
```

### Database Setup

1. Create a new database:

```sql
CREATE DATABASE neuranets_bcms;
```

2. Run the SQL schema file (if provided) to create all tables:

```bash
mysql -u root -p neuranets_bcms < schema.sql
```

3. Update your database connection settings. Look for a `DBConnection.java` or `context.xml` / `db.properties` file and configure:

```properties
db.url=jdbc:mysql://localhost:3306/neuranets_bcms
db.username=your_db_user
db.password=your_db_password
```

### Running the App

**Option 1 — Deploy via Maven + Tomcat plugin:**

```bash
mvn tomcat7:run
```

**Option 2 — Deploy WAR to Tomcat manually:**

```bash
mvn clean package
# Then copy the generated .war from /target to your Tomcat webapps/ directory
```

Once deployed, open your browser and navigate to:

```
http://localhost:8080/NeuraNets-BCMS/
```

---

## API Reference

All endpoints are served relative to the application context path. The frontend `BlogAPI.js` class handles all communication. Below is a summary of available endpoints:

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Get the currently logged-in user |
| `POST` | `/api/auth` | Login with credentials |
| `POST` | `/register` | Register a new user account |
| `POST` | `/logout` | Log out and invalidate session |

### Posts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts` | Get all published posts |
| `GET` | `/api/posts?id={id}` | Get a single post by ID |
| `GET` | `/api/posts?author={username}` | Get posts by a specific author |
| `GET` | `/api/posts?author={username}&status={status}` | Get author posts filtered by status |
| `GET` | `/api/posts?saved=true` | Get the current user's saved posts |
| `POST` | `/api/posts` | Create a new post |
| `PUT` | `/api/posts` | Update an existing post |
| `DELETE` | `/api/posts?id={id}` | Delete a post |

### Comments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/comments?postId={id}` | Get all comments for a post |
| `GET` | `/api/comments?username={username}` | Get all comments by a user |
| `POST` | `/api/comments` | Add a comment to a post |

### Reactions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reactions?postId={id}&type={type}` | Get reaction count for a post |
| `POST` | `/api/reactions` | Toggle a reaction on a post |

### Follow System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/follow?type=following&username={username}` | Get users that a user is following |
| `GET` | `/api/follow?type=check&username={u}&target={t}` | Check if a user follows another |
| `POST` | `/api/follow` | Follow or unfollow a user |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get notifications for the current user |
| `POST` | `/api/notifications` | Mark all notifications as read |

### Custom Lists

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/lists` | Get the current user's lists |
| `GET` | `/api/lists?username={username}` | Get lists for a specific user |
| `GET` | `/api/lists/{listId}` | Get all posts in a list |
| `POST` | `/api/lists` | Create a new list |
| `POST` | `/api/lists/{listId}/add` | Add a post to a list |
| `DELETE` | `/api/lists/{listId}` | Delete a list |

### Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Get the current user's profile |
| `GET` | `/api/profile?username={username}` | Get another user's profile |
| `POST` | `/api/profile` | Update the current user's profile |

### Stats & Admin

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Get platform-wide statistics |
| `GET` | `/api/admin/users` | List all users (admin only) |
| `GET` | `/api/admin/posts` | List all posts (admin only) |

### Uploads

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload an image or file |

---

## Contributing

Pull requests are welcome! To contribute:

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit clearly:
   ```bash
   git commit -m "feat: add comment pagination"
   ```
4. Push and open a Pull Request against `main`

Please make sure your code follows the existing package structure and naming conventions. Each new feature domain should have its own Servlet in `controller/` and a corresponding DAO in `dao/`.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author

**Mickey Jr** ([@Coderastrophy](https://github.com/Coderastrophy))

> *"We are not the reason for the existence of the universe, but our ability for self-awareness and reflection makes us special within it."*

---

<p align="center">Built with Java, Servlets, and vanilla JavaScript ☕</p>
