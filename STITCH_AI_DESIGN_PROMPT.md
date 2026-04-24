# Stitch AI Front-End Design Prompt: College Helpdesk System

## Project Overview

Create a modern, responsive front-end design for a **College Helpdesk System** — a full-stack web application that enables students to submit complaints/tickets and administrators to manage them efficiently. The system supports real-time notifications, file uploads, messaging within tickets, and call logging.

---

## Backend Technology Stack & API Compatibility

The front-end **must** be designed to integrate seamlessly with the following backend:

- **Framework:** Node.js + Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Real-time:** Socket.IO (for live notifications and messaging)
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **File Uploads:** Multer (supports images, videos, PDFs up to 200MB)
- **API Base URL:** `/api` (relative paths expected)

### Key API Endpoints the UI Must Consume:

| Endpoint | Method | Purpose | Auth Required | Role Restriction |
|----------|--------|---------|---------------|------------------|
| `/api/auth/register` | POST | User registration | No | — |
| `/api/auth/login` | POST | User login | No | — |
| `/api/tickets` | POST | Create new ticket | Yes | Student only |
| `/api/tickets` | GET | List tickets (filtered by role) | Yes | All |
| `/api/tickets/stats` | GET | Ticket statistics | Yes | Student only |
| `/api/tickets/:id` | GET | Get single ticket details | Yes | All |
| `/api/tickets/:id/status` | PUT/PATCH | Update ticket status | Yes | Admin/Super Admin |
| `/api/tickets/:id/remarks` | PATCH | Add admin remarks | Yes | Admin/Super Admin |
| `/api/tickets/:id` | DELETE | Delete ticket | Yes | Admin/Super Admin |
| `/api/messages/:ticketId` | GET | Get messages for a ticket | Yes | All |
| `/api/messages/:ticketId` | POST | Post message to ticket | Yes | All |
| `/api/calls` | GET/POST | Call logs management | Yes | Varies |
| `/api/users` | GET | List users/students | Yes | Admin |
| `/api/dashboard` | GET | Dashboard statistics | Yes | Admin |
| `/api/notifications` | GET | Get user notifications | Yes | All |

### Socket.IO Events:
- `notification:new` — Real-time notification delivery

---

## User Roles & Access Levels

The system has **three distinct user roles**, each with different UI requirements:

### 1. Student
- Can register/login
- Can create new tickets (complaints)
- Can view their own tickets
- Can upload media files (images, videos, PDFs) with tickets
- Can view ticket status and admin remarks
- Can send/receive messages within their tickets
- Can view their call logs
- Can receive real-time notifications
- **Primary Color Theme:** Teal/Green (`#0f766e`, `#115e59`)

### 2. Admin
- Can view all tickets
- Can update ticket status (Pending → Assigned → In Progress → Resolved/Rejected)
- Can add remarks to tickets
- Can assign tickets to specific admins
- Can view all students
- Can manage call logs
- Can delete tickets
- Can view dashboard analytics
- **Primary Color Theme:** Blue (`#1d4ed8`, `#1e40af`)

### 3. Super Admin
- Same capabilities as Admin, with full system control
- **Primary Color Theme:** Blue (same as Admin)

---

## Functional Requirements & Design Elements

### Authentication Flow
- **Login Page:** Email + password fields, "Remember me" option, forgot password link placeholder
- **Register Page:** Name, email, password, confirm password, role selection (student/admin), department, year, register number (for students)
- Form validation with real-time feedback
- Error messages displayed inline
- Loading states during API calls

### Student Dashboard
- Welcome hero section with user's name
- Statistics cards showing: Total Tickets, Pending Tickets, Resolved Tickets
- Recent tickets table with columns: Ticket ID, Category, Subject, Status, Created Date, Actions
- Quick action button: "Raise New Complaint"
- Filter/search tickets by status, category, date range
- Emergency contact badge visible in header: "Emergency: +91 7339696112"

### Raise Complaint (New Ticket) Page
- Form with fields:
  - Category dropdown: Academic, Hostel, Transport, Fees, Infrastructure, Technical
  - Subject (text input, max 100 chars)
  - Description (textarea, min 20 chars)
  - Priority selector: Low, Medium, High, Urgent
  - File upload: Drag & drop zone supporting images, videos, PDFs (up to 5 files, 200MB each)
  - Preview uploaded files with remove option
- Submit button with loading state
- Success/error toast notifications

### Ticket Details Page (Student View)
- Ticket header: Ticket ID, Status badge, Priority badge, Created date
- Student info: Name, Register Number, Department
- Category and Subject display
- Full description
- Attachments section: Downloadable file list with icons
- Admin Remarks timeline: Chronological list of admin updates with timestamps
- Message thread: Chat-like interface for student-admin communication
- Status history visualization

### Admin Dashboard
- Welcome hero section
- Statistics cards: Total Tickets, Pending, In Progress, Resolved, Rejected
- Recent tickets table (all tickets, not filtered)
- Quick filters: Status, Category, Date Range, Assigned Admin
- Call logs summary section
- Student count widget

### Admin Ticket Detail Page
- Full ticket information display
- Status dropdown to change ticket status
- Remarks textarea to add admin comments
- Assign to admin dropdown
- Message thread for communication
- Delete ticket button (with confirmation)
- Student contact information

### Students Management Page (Admin Only)
- Searchable/filterable table of all students
- Columns: Name, Email, Register Number, Department, Year, Status
- Actions: View details, Block/Unblock user
- Pagination for large datasets

### Call Logs Page
- **Student View:** Their own call logs
- **Admin View:** All call logs with filters
- Table columns: Date, Caller, Duration, Type, Notes
- Add new call log form (Admin)

### Notifications System
- Bell icon in header with unread count badge
- Dropdown panel showing last 20 notifications
- Notification items show: Title, Message, Timestamp
- Unread notifications highlighted
- Click to mark as read
- Real-time updates via Socket.IO

---

## User Experience Considerations

### Navigation
- **Sidebar navigation** (collapsible on desktop, drawer on mobile)
- Role-based menu items
- Active state highlighting
- Logout button in sidebar footer

### Responsive Design
- **Desktop (≥960px):** Full sidebar visible, multi-column layouts
- **Tablet (768px–959px):** Collapsible sidebar, adapted tables
- **Mobile (<768px):** Hamburger menu, drawer navigation, stacked layouts, touch-friendly buttons (min 44px)

### Accessibility
- Semantic HTML structure
- ARIA labels for icons and interactive elements
- Keyboard navigation support
- Focus indicators
- Color contrast meeting WCAG AA standards
- Screen reader friendly

### Performance
- Lazy loading for images and heavy components
- Skeleton loaders for data fetching
- Optimistic UI updates where appropriate
- Debounced search inputs
- Virtual scrolling for long lists (if needed)

### Feedback & States
- Loading spinners for async operations
- Toast notifications for success/error messages
- Empty states with helpful illustrations
- Error boundaries with retry options
- Form validation with inline error messages

---

## Aesthetic Preferences & Branding Guidelines

### Color Palette

#### Base Colors (Neutral)
```css
--bg: #f7f8fb;           /* Page background */
--panel: #ffffff;         /* Card/panel background */
--muted: #f2f4f8;         /* Muted backgrounds */
--border: #e6e8ed;        /* Borders and dividers */
--text: #1f2937;          /* Primary text */
--subtext: #64748b;       /* Secondary text */
```

#### Role-Specific Primary Colors
```css
/* Admin Theme */
--primary-admin: #1d4ed8;
--primary-admin-dark: #1e40af;
--bg-admin: #f4f7fc;

/* Student Theme */
--primary-student: #0f766e;
--primary-student-dark: #115e59;
--bg-student: #f2f8f7;
```

#### Status Colors
```css
--danger: #ef4444;        /* Errors, Rejected */
--success: #10b981;       /* Success, Resolved */
--warning: #f59e0b;       /* Warnings, Pending */
--info: #3b82f6;          /* Info, In Progress */
```

### Typography
- **Primary Font:** Inter, system-ui, -apple-system, sans-serif
- **Headings:** Bold weight (700-800), negative letter-spacing (-0.3px to -0.5px)
- **Body:** Regular weight (400-500), comfortable line-height (1.5-1.6)
- **Monospace:** For ticket IDs and code-like text

### Spacing & Layout
- **Border Radius:** 14px for cards, 12px for buttons/inputs, 999px for pills/badges
- **Shadows:** Soft, subtle shadows (`0 4px 12px rgba(15, 23, 42, 0.06)`)
- **Max Content Width:** 1180px
- **Content Padding:** Responsive (clamp function for fluid spacing)

### Visual Style
- **Modern & Clean:** Minimalist design with ample white space
- **Subtle Gradients:** Background accents using radial gradients
- **Role-Based Theming:** Different color schemes for admin vs student views
- **Micro-interactions:** Hover effects, transitions (0.15s-0.3s ease)
- **Glassmorphism touches:** Subtle transparency effects on overlays

### Component Design Patterns
- **Cards:** White background, border, rounded corners, soft shadow
- **Buttons:** Rounded, with icon + text, loading states
- **Inputs:** Bordered, focus ring with primary color
- **Tables:** Responsive with horizontal scroll on mobile
- **Badges:** Pill-shaped, color-coded by status
- **Modals:** Centered, with backdrop blur
- **Toasts:** Top-right positioning, auto-dismiss

---

## Device Adaptability Requirements

### Breakpoints
```css
/* Mobile First Approach */
@media (max-width: 480px)  { /* Extra small devices */ }
@media (max-width: 600px)  { /* Small devices */ }
@media (max-width: 768px)  { /* Tablets */ }
@media (max-width: 960px)  { /* Small desktops */ }
@media (min-width: 961px)  { /* Desktops */ }
```

### Mobile-Specific Considerations
- Touch-friendly tap targets (minimum 44×44px)
- Swipe gestures for navigation (optional)
- Bottom navigation option for key actions
- Simplified forms with appropriate input types
- Pull-to-refresh pattern (optional)
- Native-like feel with smooth transitions

### Tablet Considerations
- Adaptive grid layouts (2-column where appropriate)
- Sidebar as drawer overlay
- Optimized table views

### Desktop Considerations
- Full sidebar always visible (collapsible)
- Multi-column dashboard layouts
- Hover states for interactive elements
- Keyboard shortcuts (optional enhancement)

---

## Technical Implementation Notes

### Frontend Stack
- **Framework:** React 18+
- **Build Tool:** Vite
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Styling:** Plain CSS (no CSS-in-JS framework required, but can use CSS Modules or styled-components if preferred)

### State Management
- React Context API for auth state
- Local component state for UI interactions
- Consider Zustand or Redux Toolkit for complex state if needed

### API Integration Patterns
- Centralized API service module
- Axios interceptors for auth token injection
- Error handling with user-friendly messages
- Request/response logging for debugging

### File Structure Suggestion
```
frontend/src/
├── components/          # Reusable UI components
│   ├── Sidebar.jsx
│   ├── ProtectedRoute.jsx
│   ├── TicketCard.jsx
│   ├── StatusBadge.jsx
│   └── ...
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── admin/
│   └── student/
├── context/            # React Context providers
│   └── AuthContext.jsx
├── services/           # API services
│   └── api.js
├── hooks/              # Custom hooks
├── utils/              # Utility functions
└── styles/             # Global styles
    └── styles.css
```

---

## Deliverables Expected from Stitch AI

1. **Complete React component files** for all pages and reusable components
2. **CSS styles** that implement the design system described above
3. **Responsive layouts** that work across all device sizes
4. **Integration-ready code** with proper API call placeholders
5. **Accessibility-compliant** markup with ARIA attributes
6. **Loading states and error handling** UI components
7. **Form validation** with user-friendly error messages
8. **Real-time notification** UI integration
9. **File upload** interface with drag-and-drop support
10. **Role-based rendering** logic for admin vs student views

---

## Additional Notes

- The design should feel **professional yet approachable** for college students
- Prioritize **usability and clarity** over decorative elements
- Ensure **consistent spacing and alignment** throughout
- Use **meaningful icons** (Heroicons or similar) for visual cues
- Implement **smooth page transitions** for better UX
- Consider **dark mode support** as a future enhancement
- The emergency contact number (+91 7339696112) should be prominently displayed for students

---

## Summary

Design a **modern, accessible, and fully responsive** front-end for a College Helpdesk System that:
- Seamlessly integrates with the Node.js/Express backend
- Provides distinct experiences for Students and Admins
- Supports real-time notifications via Socket.IO
- Handles file uploads gracefully
- Works flawlessly across desktop, tablet, and mobile devices
- Follows the specified color palette and design guidelines
- Prioritizes user experience with clear navigation, feedback, and error handling

The final design should be production-ready and align with modern web development best practices.