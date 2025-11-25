# 🥋 Kyokushin Karate India Platform

A comprehensive full-stack web application for managing Kyokushin Karate dojos, students, instructors, events, tournaments, and more across India.

## 🚀 Live Demo

- **Frontend**: [Your Vercel URL]
- **Backend API**: [Your Render URL]

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Contributing](#contributing)

## ✨ Features

### For Administrators (Kancho/Shihan)

- 👥 **User Management**: View, edit, approve/reject, and delete users across all dojos
- 🏛️ **Dojo Management**: Create, update, and manage dojos with auto-generated codes
- 📅 **Event Management**: Create tournaments, seminars, camps with registration tracking
- 🏆 **Tournament Management**: Generate brackets, manage matches and results
- 📊 **Analytics Dashboard**: View statistics, organization structure, and reports
- 🏅 **Recognition System**: Manage monthly student recognitions
- 📰 **Content Management**: Manage blogs, media, and site content

### For Instructors (Sensei/Senpai)

- 👁️ **Student Directory**: View all students globally (can only manage own dojo students)
- 🥋 **Belt Promotion**: Promote students within their dojo (cannot promote higher than own rank)
- ✅ **Student Approval**: Preliminary approval of new student registrations
- 📧 **Email Invitations**: Invite new students to join
- 📅 **Event Creation**: Create dojo-specific events and seminars
- 📈 **Dojo Dashboard**: View dojo statistics and student progress

### For Students (Kohai)

- 👤 **Profile Management**: Update personal information and view belt history
- 📅 **Event Registration**: Browse and register for upcoming events and tournaments
- 🏆 **Tournament Results**: View past tournament performance
- 📰 **Blog Submissions**: Submit blog posts for approval
- 🎓 **Belt Progress Tracking**: Track training journey and achievements

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **Animations**: Framer Motion
- **State Management**: Zustand
- **HTTP Client**: Axios

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer
- **File Upload**: Multer

### DevOps & Deployment

- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: Render PostgreSQL
- **Version Control**: Git/GitHub

## 📁 Project Structure

```
kyokushin_karate/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   │   ├── dashboard/   # Dashboard pages
│   │   │   ├── dojos/       # Dojo listing and details
│   │   │   ├── events/      # Event pages
│   │   │   ├── login/       # Authentication
│   │   │   └── ...
│   │   ├── components/      # React components
│   │   │   ├── dashboard/   # Dashboard-specific components
│   │   │   ├── tournaments/ # Tournament brackets
│   │   │   └── ui/          # Reusable UI components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and helpers
│   │   └── store/           # Zustand state management
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # Express.js backend API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth and error middleware
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic (email, tournaments)
│   │   └── utils/           # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed.ts          # Seed data
│   └── package.json
│
└── README.md                 # This file
```

## 🔧 Installation

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- npm or yarn package manager

### Clone the Repository

```bash
git clone https://github.com/anshumansinghneu/kyokushin_karate_india.git
cd kyokushin_karate_india
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## 🔐 Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kyokushin_db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Email Service (Optional - for production)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Admin Setup (First-time setup)
ADMIN_SETUP_KEY="your-secure-setup-key"
```

### Frontend (.env.local)

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## 🚀 Running the Application

### 1. Setup Database

```bash
cd backend
npx prisma migrate dev
npx prisma db seed  # Optional: Add sample data
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Create Admin Account (First Time)

Visit: `http://localhost:3000/setup` (requires ADMIN_SETUP_KEY)

Or use the backend endpoint:

```bash
curl -X POST http://localhost:5000/api/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "setupKey": "your-secure-setup-key"
  }'
```

## 📚 API Documentation

Full API documentation is available in [`backend/API_DOCS.md`](backend/API_DOCS.md)

### Key Endpoints

**Authentication**

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

**Users**

- `GET /api/users` - Get all users (filtered by role)
- `PATCH /api/users/:id` - Update user
- `PATCH /api/users/:id/approve` - Approve user
- `DELETE /api/users/:id` - Delete user

**Dojos**

- `GET /api/dojos` - Get all dojos
- `POST /api/dojos` - Create dojo (auto-generates code)
- `PATCH /api/dojos/:id` - Update dojo
- `DELETE /api/dojos/:id` - Delete dojo

**Events**

- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `POST /api/events/:id/register` - Register for event

**Tournaments**

- `POST /api/tournaments/:id/generate-bracket` - Generate bracket
- `GET /api/tournaments/:id/bracket` - Get tournament bracket

## 👥 User Roles

### 1. ADMIN (Kancho/Shihan)

- Full system access
- Can manage all users, dojos, events
- Can generate and manage tournament brackets
- Can approve/reject registrations
- Can promote any user

### 2. INSTRUCTOR (Sensei/Senpai)

- Can view all students (read-only)
- Can manage students in their dojo only
- Can promote students (below their own rank)
- Can create events
- Can give preliminary approval to students

### 3. STUDENT (Kohai)

- Can view and update own profile
- Can register for events
- Can view belt history and tournament results
- Can submit blog posts (pending approval)

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
npm test
```

### Run E2E Tests

```bash
cd backend
npm run test:e2e
```

## 📦 Build for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm start
```

## 🚀 Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy

### Frontend (Vercel)

1. Import project in Vercel
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Deploy

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes with middleware
- Input validation and sanitization
- CORS configuration
- SQL injection prevention (Prisma ORM)

## 📝 Key Features Implemented

✅ User authentication and authorization
✅ Role-based dashboards
✅ Auto-generated dojo codes (format: `MUM-01`, `DEL-02`)
✅ Indian states and cities dropdown
✅ Belt promotion system with history tracking
✅ Two-step student approval (Instructor → Admin)
✅ Event registration and management
✅ Tournament bracket generation
✅ Monthly recognition system
✅ Blog and media management
✅ Email notifications
✅ Profile photo uploads
✅ Organization hierarchy visualization
✅ Responsive design for mobile/tablet

## 🐛 Known Issues & Fixes Applied

All issues have been resolved:

- ✅ User edit modal layout fixed
- ✅ Create user form improved
- ✅ Site Content removed from management menu
- ✅ Dojo code auto-generation confirmed working
- ✅ State/City dropdowns properly implemented
- ✅ Email/Phone removed from dojo creation
- ✅ ADMIN users included in instructor dropdown

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👨‍💻 Developer

**Anshuman Singh**

- GitHub: [@anshumansinghneu](https://github.com/anshumansinghneu)
- Email: kyokushinindia@ymail.com

## 🙏 Acknowledgments

- Kyokushin Karate India organization
- All instructors and students using the platform
- Open-source community for amazing tools and libraries

---

**OSU!** 🥋

For more detailed documentation, see:

- [System Documentation](SYSTEM_DOCUMENTATION.md)
- [API Documentation](backend/API_DOCS.md)
