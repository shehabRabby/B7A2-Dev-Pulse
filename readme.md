# 📋 Issue Tracker System API

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-sounding&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-007ACC?style=flat-sounding&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-Framework-000000?style=flat-sounding&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Raw_SQL-4169E1?style=flat-sounding&logo=postgresql&logoColor=white)

A lightweight, high-performance RESTful API designed for managing software development workflows. Built entirely using **TypeScript**, **Express.js**, and **Raw SQL (PostgreSQL)** via node-postgres pool, this project avoids heavy ORMs to ensure blazing-fast query execution and precise transaction boundaries.

---

## 🚀 Live Links
* **Production API URL:** [Live Link coming soon...]
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

## 📋 Database Schema

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





⚙️ Local Installation & Setup Guide
📋 Prerequisites
Node.js (v18.x or higher)

A PostgreSQL instance (e.g., NeonDB)

🏃 Step-by-Step Setup
Clone and Install:

git clone <your-repository-url>
cd <your-project-folder>
npm install


Environment Configuration:
Create a .env file in the root directory:

PORT=5000
DATABASE_URL=postgres://<username>:<password>@<host>/<database_name>?sslmode=require
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development

Database Initialization:
Run the SQL scripts provided in the Database Schema section above inside your NeonDB SQL terminal



Running the Application:

Development Mode: npm run dev
Build Project: npm run build
Production Start: npm start


API Endpoints Summary
Auth Module (/api/auth)
POST /signup - Register a new user (contributor or maintainer).

POST /login - Authenticate credentials and receive a JWT token.

Issues Module (/api/issues)
POST / - Create a new issue (Contributor only | description ≥ 20 characters).

GET / - Get all issues (Public | Supports filtering by type, status and sorting by newest/oldest).

GET /:id - Get a single issue by ID with its reporter's clean profile (Public).

PATCH /:id - Update issue text (Contributor: own issues only) or change workflow status (Maintainer only).

DELETE /:id - Permanently delete an issue (Maintainer only).