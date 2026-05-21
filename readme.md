# 📋 Issue Tracker System API

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-sounding&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-007ACC?style=flat-sounding&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-Framework-000000?style=flat-sounding&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Raw_SQL-4169E1?style=flat-sounding&logo=postgresql&logoColor=white)

A lightweight, high-performance RESTful API designed for managing software development workflows. Built entirely using **TypeScript**, **Express.js**, and **Raw SQL (PostgreSQL)** via node-postgres pool, this project avoids heavy ORMs to ensure blazing-fast query execution and precise transaction boundaries.

---

## 🚀 Live Links
* **Production API URL:** [https://issue-tracker-api-lilac.vercel.app/]
* **Database Host:** NeonDB (Serverless Cloud PostgreSQL)

---

## 📌 Project Overview
The **Issue Tracker System API** handles operational development workflows using structural role-based partitions. 

### ⚡ Key Architectural Notes:
* **Zero ORM:** Data flows natively through optimized, parameterized SQL queries to guarantee full security against SQL Injection.
* **Decoupled Relational Fetching:** Instead of joining massive tables (`JOIN` operations), issue lists and related creator profiles are combined using highly efficient batch-query operations. This helps avoid cross-table row-locks and speeds up concurrent data retrieval.

---

## 👥 User Roles & Permissions

The system maintains strict workflow permissions separating frontline reporters from reviewing administrators:

| Feature / Action | ⚒️ Contributor | 🛡️ Maintainer | Public Access |
| :--- | :---: | :---: | :---: |
| Register & Obtain JWT Token | ✅ | ✅ | ✅ |
| View Issue Backlog & Details | ✅ | ✅ | ✅ (No Token) |
| Create New Issues | ✅ | ❌ | ❌ |
| Edit Issue Details (`title`, `desc`, `type`) | ✅ *(Own Open Issues Only)* | ✅ | ❌ |
| Manage Workflow Status (`open` ➔ `resolved`) | ❌ | ✅ | ❌ |
| Delete Issues Permanently | ❌ | ✅ | ❌ |

---

 # 🛣️ API Endpoints Roadmap

### 🔐 Authentication Module (`/api/auth`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | 🌐 Public | Registers a new user account with explicit roles (`contributor` or `maintainer`). |
| `POST` | `/api/auth/login` | 🌐 Public | Validates user credentials and generates a JWT authorization bearer token. |

### 🐞 Issues Module (`/api/issues`)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/issues` | ⚒️ Contributor | **[Protected]** Instantiates a fresh tracking issue. *(Title is mandatory, Description must be ≥ 20 characters)*. |
| `GET` | `/api/issues` | 🌐 Public | **[Public]** Fetches global issue lists. *(Supports optional filtering query parameters: `type`, `status` and `sort=newest/oldest`)*. |
| `GET` | `/api/issues/:id` | 🌐 Public | **[Public]** Returns details of a specific issue alongside a clean reporter user profile mapping. |
| `PATCH` | `/api/issues/:id` | ⚒️ Contributor / 🛡️ Maintainer | **[Protected]** Updates issue metadata. <br>• **Contributors:** Can edit their own issue text *(Only if status is `open`)*.<br>• **Maintainers:** Can update metadata or transition the workflow `status` independently. |
| `DELETE` | `/api/issues/:id` | 🛡️ Maintainer | **[Protected]** Destroys an issue record permanently from the database logs. |


---

#  ⚙️ Local Installation & Setup Guide

# 📋 Prerequisites
    - Node.js (v18.x or higher)
    - A PostgreSQL instance (e.g., NeonDB)

# 🏃 Step-by-Step Setup
 ## Clone and Install
    - git clone : https://github.com/shehabRabby/B7A2-Dev-Pulse.git
    - cd <your-project-folder>
    - npm install

 ## Environment Configuration 
   - PORT=5000
   - DATABASE_URL=postgres://<username>:<password>@<host>/<database_name>?sslmode=require
   - JWT_SECRET=your_super_secure_random_jwt_secret_key
   - NODE_ENV=development

 ## Database Initialization
   - Run the SQL scripts provided in the Database Schema section above inside your NeonDB SQL terminal to create the tables.

 ## Running the Application
   - Development Mode: npm run dev
   - Build Project: npm run build
   - Production Start: npm start

---

# 📋 Database Schema

Execute the following relational blueprints inside your database console or NeonDB SQL editor to configure the architecture:

```sql
-- 1. Users Profile Infrastructure
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('contributor', 'maintainer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Issue Logs Core Schema
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    creator_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

