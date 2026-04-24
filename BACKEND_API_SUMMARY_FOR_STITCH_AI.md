# College Helpdesk System - Backend API Summary for Frontend Development

## Project Overview

This is a **College Helpdesk System** built with Node.js/Express backend and MongoDB. The system allows students to submit tickets/complaints and administrators to manage them with real-time updates, messaging, and file uploads.

---

## Technology Stack

- **Backend Framework:** Node.js + Express.js
- **Database:** MongoDB with Mongoose ODM
- **Real-time Communication:** Socket.IO (for live notifications)
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **File Uploads:** Multer (supports images, videos, PDFs up to 200MB)
- **CORS:** Enabled for cross-origin requests

---

## Data Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  registerNumber: String (unique, sparse, uppercase),
  password: String (required, hashed),
  role: String (enum: ['student', 'super_admin', 'admin'], default: 'student'),
  department: String,
  year: Number (default: 1),
  status: String (enum: ['active', 'blocked'], default: 'active'),
  createdAt: Date,
  updatedAt: Date
}
```

### Student Model
```javascript
{
  userId: ObjectId (ref: 'User', required, unique),
  registerNumber: String (required, unique, uppercase),
  department: String (required),
  year: Number (default: 1),
  createdAt: Date,
  updatedAt: Date
}
```

### Ticket Model
```javascript
{
  ticketId: String (unique, auto-generated),
  studentId: ObjectId (ref: 'User', required),
  studentName: String (required),
  registerNumber: String (required, uppercase),
  department: String (required),
  category: String (enum: ['Academic', 'Hostel', 'Transport', 'Fees', 'Infrastructure', 'Technical']),
  subject: String (required),
  description: String (required),
  priority: String (enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium'),
  attachments: [String],
  media: [String],
  assignedTo: ObjectId (ref: 'User', default: null),
  adminRemarks: [{
    adminId: ObjectId (ref: 'User', required),
    remark: String (required),
    status: String,
    createdAt: Date
  }],
  status: String (enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending'),
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  ticketId: ObjectId (ref: 'Ticket', required),
  senderId: ObjectId (ref: 'User', required),
  text: String (required),
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| POST | `/register` | Register new student | No | `{ name, email, registerNumber, password, department, year }` | `{ token, user }` |
| POST | `/login` | User login | No | `{ email OR registerNumber OR identifier, password }` | `{ token, user }` |

**Login Request Examples:**
```javascript
// Using email
{ "email": "student@bitsathy.ac.in", "password": "password123" }

// Using register number
{ "registerNumber": "REG1001", "password": "password123" }

// Using identifier (auto-detects email or register)
{ "identifier": "student@bitsathy.ac.in", "password": "password123" }
```

**Response User Object:**
```javascript
{
  id: String,
  name: String,
  email: String,
  registerNumber: String,
  role: String ('student' | 'admin' | 'super_admin'),
  department: String,
  status: String ('active' | 'blocked')
}
```

---

### Ticket Endpoints (`/api/tickets`)

| Method | Endpoint | Description | Auth Required | Role Required | Request Body | Response |
|--------|----------|-------------|---------------|---------------|--------------|----------|
| POST | `/` | Create new ticket | Yes | student | Form data with `category`, `subject`, `description`, `priority`, `media` (files) | Created ticket |
| GET | `/` | List tickets | Yes | all | Query params: `?status=`, `?category=`, `?page=`, `?limit=` | Array of tickets |
| GET | `/stats` | Get ticket statistics | Yes | student | - | `{ total, pending, resolved, inProgress, rejected }` |
| GET | `/:id` | Get single ticket | Yes | all | - | Ticket object |
| PUT | `/:id/status` | Update ticket status | Yes | admin, super_admin | `{ status }` | Updated ticket |
| PATCH | `/:id/status` | Update ticket status | Yes | admin, super_admin | `{ status }` | Updated ticket |
| PATCH | `/:id/remarks` | Add admin remark | Yes | admin, super_admin | `{ remark, status }` | Updated ticket |
| DELETE | `/:id` | Delete ticket | Yes | admin, super_admin | - | Success message |

**Create Ticket (Form Data):**
```javascript
// Content-Type: multipart/form-data
category: "Academic"
subject: "Library Access Issue"
description: "Cannot access online library resources"
priority: "Medium"
media: [File, File] // Up to 5 files (images, videos, PDFs)
```

**Ticket Status Values:**
- `Pending` - Initial status when created
- `Assigned` - Assigned to an admin
- `In Progress` - Being worked on
- `Resolved` - Issue resolved
- `Rejected` - Ticket rejected

**Ticket Categories:**
- `Academic`
- `Hostel`
- `Transport`
- `Fees`
- `Infrastructure`
- `Technical`

---

### Message Endpoints (`/api/messages`)

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/:ticketId` | Get messages for ticket | Yes | - | Array of messages |
| POST | `/:ticketId` | Post message to ticket | Yes | `{ text }` | Created message |

**Message Object:**
```javascript
{
  _id: String,
  ticketId: String,
  senderId: String,
  text: String,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

### Call Log Endpoints (`/api/calls`)

| Method | Endpoint | Description | Auth Required | Role Required | Request Body | Response |
|--------|----------|-------------|---------------|---------------|--------------|----------|
| GET | `/` | List all calls | Yes | department_admin, super_admin, admin | - | Array of calls |
| GET | `/:ticketId` | Get calls for ticket | Yes | all | - | Array of calls |
| POST | `/:ticketId` | Create call log | Yes | all | `{ duration, type, notes }` | Created call |

---

### User Management Endpoints (`/api/users`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/students` | List all students | Yes | admin, super_admin | Array of users |
| GET | `/students/:id` | Get student details | Yes | admin, super_admin | User object |
| PATCH | `/students/:id/status` | Update student status | Yes | admin, super_admin | `{ status }` | Updated user |

---

### Dashboard Endpoints (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| GET | `/stats` | Get dashboard statistics | Yes | `{ totalTickets, pendingTickets, resolvedTickets, inProgressTickets, rejectedTickets, totalStudents, activeStudents }` |

---

### Notification Endpoints (`/api/notifications`)

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| GET | `/` | Get user notifications | Yes | Array of notifications |
| PATCH | `/:id/read` | Mark notification as read | Yes | Updated notification |

---

## Authentication & Authorization

### JWT Token
- Tokens are returned on successful login/registration
- Include token in `Authorization` header: `Bearer <token>`
- Token expires in 7 days
- Token payload contains: `{ id, role, department }`

### Role-Based Access
- **student**: Can create/view own tickets, send messages, view notifications
- **admin**: Can view/manage all tickets, manage students, view dashboard
- **super_admin**: Full access to all features

### Email Restrictions
- Student registration requires `@bitsathy.ac.in` email domain
- Admin login restricted to specific admin credentials

---

## Real-Time Events (Socket.IO)

### Client Events (received from server)
- `notification:new` - New notification received

### Server Events (sent to server)
- Connection established automatically on client connect

---

## File Upload Specifications

- **Max file size:** 200MB per file (configurable via `MAX_UPLOAD_MB` env var)
- **Allowed types:** `image/*`, `video/*`, `application/pdf`
- **Max files per ticket:** 5
- **Upload endpoint:** Included in ticket creation (`POST /api/tickets`)
- **File storage:** `/backend/uploads/` directory
- **File access:** `/uploads/<filename>`

---

## Error Responses

All error responses follow this format:
```javascript
{
  message: String // Error description
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `304` - Not Modified (cached)
- `400` - Bad Request (validation error)
- `403` - Forbidden (authentication/authorization failed)
- `404` - Not Found
- `500` - Internal Server Error

---

## Frontend Integration Notes

### API Base URL
- Development: `http://localhost:5000/api`
- Production: Use relative paths `/api`

### CORS Configuration
- Allowed origins: `http://localhost:5173`, `http://127.0.0.1:5173`, and private LAN hosts
- Credentials: enabled (cookies/auth headers allowed)

### Required Headers
```javascript
{
  "Content-Type": "application/json", // for JSON requests
  "Authorization": "Bearer <token>",  // for protected routes
}
```

### Axios Interceptor Setup
```javascript
// Add token to all requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## User Roles & Permissions Summary

| Feature | Student | Admin | Super Admin |
|---------|---------|-------|-------------|
| Create Tickets | ✅ | ❌ | ❌ |
| View Own Tickets | ✅ | ❌ | ❌ |
| View All Tickets | ❌ | ✅ | ✅ |
| Update Ticket Status | ❌ | ✅ | ✅ |
| Add Admin Remarks | ❌ | ✅ | ✅ |
| Delete Tickets | ❌ | ✅ | ✅ |
| Send Messages | ✅ | ✅ | ✅ |
| View Dashboard Stats | ✅ (own) | ✅ (all) | ✅ (all) |
| Manage Students | ❌ | ✅ | ✅ |
| View Call Logs | ✅ (own) | ✅ (all) | ✅ (all) |
| Receive Notifications | ✅ | ✅ | ✅ |

---

## Environment Variables

The backend uses these environment variables (configured in `.env`):

```
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=secret
MONGODB_URI=mongodb://localhost:27017/college-helpdesk
STUDENT_EMAIL_DOMAIN=@bitsathy.ac.in
MAX_UPLOAD_MB=200
```

---

## Sample API Calls

### Register Student
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.ee23@bitsathy.ac.in",
  "registerNumber": "REG1001",
  "password": "password123",
  "department": "EEE",
  "year": 2
}
```

### Login
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.ee23@bitsathy.ac.in",
  "password": "password123"
}
```

### Create Ticket
```javascript
POST /api/tickets
Authorization: Bearer <token>
Content-Type: multipart/form-data

category: "Academic"
subject: "Lab Equipment Issue"
description: "Computers in lab 3 are not working"
priority: "High"
media: [file1, file2]
```

### Get Tickets List
```javascript
GET /api/tickets?status=Pending&category=Academic&page=1&limit=10
Authorization: Bearer <token>
```

### Add Admin Remark
```javascript
PATCH /api/tickets/:id/remarks
Authorization: Bearer <token>
Content-Type: application/json

{
  "remark": "Investigating the issue",
  "status": "In Progress"
}
```

### Send Message
```javascript
POST /api/messages/:ticketId
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Any update on this issue?"
}
```

---

## Frontend Pages Required

Based on the API structure, the frontend should include:

1. **Login Page** - Email/Register + Password login
2. **Register Page** - Student registration with college email
3. **Student Dashboard** - Ticket stats, recent tickets list
4. **Raise Complaint Page** - New ticket form with file upload
5. **Ticket Detail Page** - View ticket, messages, remarks
6. **Admin Dashboard** - All tickets, stats, filters
7. **Admin Ticket Detail** - Status update, remarks, delete
8. **Students Management** - List, search, block/unblock
9. **Notifications Panel** - Real-time notifications
10. **Call Logs Page** - View/add call records

---

This summary provides all the information needed to build a frontend that integrates seamlessly with the College Helpdesk System backend.