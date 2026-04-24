# Frontend Integration Guide

## Frontend Setup & Running

Your frontend is now fully integrated with the College Helpdesk backend. Follow these steps to run it:

### Prerequisites
- Node.js 18+ installed
- Backend running on `http://localhost:5000`

### Installation & Running

```bash
# Navigate to frontend directory
cd d:\College\frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### Environment Configuration

The following environment files have been created:

**Development** (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Production** (`.env.production`):
```
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=
```

## Frontend Features

### Authentication
- Login with email, register number, or identifier
- Student and Admin roles with different dashboards
- Session management with JWT tokens
- Auto-login from last session

### Student Features
- **Dashboard**: View ticket statistics and recent complaints
- **Raise Complaint**: Submit new tickets with file uploads (images, videos, PDFs)
- **Ticket Details**: View full ticket info, admin remarks, and messages
- **Messaging**: Real-time chat with admin support
- **Call Logs**: Track all communication attempts
- **Categories**: Academic, Hostel, Transport, Fees, Infrastructure, Technical
- **Priorities**: Low, Medium, High, Urgent
- **Emergency Contact**: Direct link to admin helpline

### Admin Features
- **Dashboard**: Overview of all tickets with statistics
- **Ticket Management**: View, filter, and update ticket status
- **Student Management**: View all students, filter by department/year/status
- **Call Logs**: Track all support calls
- **Admin Remarks**: Add status updates and comments to tickets
- **Real-time Updates**: Live notifications for new tickets and messages

### Real-time Features (Socket.IO)
- **Notifications**: Instant updates for new tickets and status changes
- **Messages**: Real-time chat between students and admins
- **Call Logs**: Live call tracking and updates
- **Activity Feed**: Auto-refresh for all users

## API Integration Points

All API endpoints are configured in `src/services/api.js`:

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login (email/register number/identifier)

### Tickets
- `GET /api/tickets/stats` - Student ticket statistics
- `GET /api/tickets` - List tickets (filtered by role)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PATCH /api/tickets/:id/status` - Update ticket status
- `PATCH /api/tickets/:id/remarks` - Add admin remarks
- `DELETE /api/tickets/:id` - Delete ticket

### Messaging
- `GET /api/messages/:ticketId` - Get messages for ticket
- `POST /api/messages/:ticketId` - Post new message

### Call Logs
- `GET /api/calls` - List all calls (admin)
- `GET /api/calls/:ticketId` - Get calls for ticket
- `POST /api/calls/:ticketId` - Create call log

### Users
- `GET /api/users/students` - List students (admin)
- `PATCH /api/users/students/:id/status` - Block/unblock student

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

## Running Both Frontend & Backend

Use the provided PowerShell scripts:

```bash
# Start both backend and frontend
cd d:\College
.\run-project.ps1

# Stop both services
.\stop-project.ps1
```

## Build for Production

```bash
npm run build   # Build optimized production bundle
npm run preview # Preview production build locally
```

The build will output to the `dist/` folder and is ready for deployment.

## Development Notes

- Components are organized by role: `src/pages/student/` and `src/pages/admin/`
- Shared components in `src/components/`
- API service layer in `src/services/api.js`
- Real-time socket handlers in `src/services/socket.js`
- Authentication context in `src/context/AuthContext.jsx`
- Session management supports role-based last session recall

## Troubleshooting

**Can't connect to backend?**
- Ensure backend is running on port 5000
- Check `VITE_API_BASE_URL` in `.env.local`
- Check network connectivity

**Socket.IO not connecting?**
- Verify backend has Socket.IO enabled
- Check `VITE_SOCKET_URL` configuration
- Look for CORS issues in browser console

**Old session issues?**
- Clear browser cache and sessionStorage
- Restart the development server
