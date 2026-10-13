# PeopleDesk – Employee Management System

Full-stack CRUD app: **HTML/CSS/JavaScript** frontend, **Node.js + Express** REST API, **MongoDB** database, JWT login with job roles.

## Features
- Create, read, update and delete employees (name, department, role, salary, join date)
- Server-side search, department filter, column sorting and pagination
- Add/edit form (edit is pre-filled) with client and server validation
- Delete with a confirmation dialog
- Loading, empty and error states, toast feedback, responsive layout
- Login with job role (HR Admin / Manager / Employee). Only HR Admin can add, edit or delete.

## Folder structure
```
employee-management/
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── scripts/seed.js            # sample users and employees
│   └── src/
│       ├── app.js
│       ├── config/db.js
│       ├── models/ (Employee.js, User.js)
│       ├── controllers/ (employeeController.js, authController.js)
│       ├── routes/ (employeeRoutes.js, authRoutes.js)
│       └── middleware/ (auth.js, validate.js, errorHandler.js)
├── frontend/
│   ├── index.html  login.html  app.html
│   ├── css/style.css
│   └── js/ (api.js, login.js, app.js)
└── postman/employee-api.postman_collection.json
```

## Setup
Requirements: Node.js 18+ and MongoDB (local, or a MongoDB Atlas connection string).

```bash
cd backend
npm install
cp .env.example .env      # edit MONGO_URI and JWT_SECRET if needed
npm run seed              # creates demo users and employees
npm run dev               # or: npm start
```
Open **http://localhost:5000** – Express serves the frontend too, so no extra setup is needed.

Demo logins (password `Password@123`): `admin@company.com` (HR Admin), `manager@company.com`, `employee@company.com`. Pick the matching job role on the login page.

## Database
MongoDB collections are created automatically by Mongoose.

| employees | type | rules |
|---|---|---|
| name | String | required, 2-100 chars |
| department | String | required, max 60 |
| role | String | required, max 80 |
| salary | Number | required, > 0 |
| joinDate | Date | required, not in the future |
| createdAt / updatedAt | Date | automatic |

Indexes: `name`, `department`, `joinDate`. A `users` collection stores name, email (unique), bcrypt-hashed password and role.

## API
Base URL `http://localhost:5000/api`. All `/employees` routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /auth/login | public | Body: email, password, role. Returns token |
| GET | /employees | any role | Query: search, department, sortBy, order, page, limit |
| GET | /employees/:id | any role | One employee |
| POST | /employees | admin | Create (201) |
| PUT | /employees/:id | admin | Update |
| DELETE | /employees/:id | admin | Delete |

Errors: `400` validation (with per-field `errors`), `401` not signed in, `403` wrong role, `404` not found, `500` server error.

## Testing with Postman
1. Import `postman/employee-api.postman_collection.json`.
2. Run **Auth → Login (admin)** first. It saves the token automatically.
3. Run the **Employees** requests in order, or use the Collection Runner. Create saves `employeeId` for the next requests, and each request has a status-code test.
