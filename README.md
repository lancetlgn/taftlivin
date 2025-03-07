# TaftLivin - Condo & Dorm Reviews Near DLSU

TaftLivin is a comprehensive web platform that helps DLSU students find, review, and explore dormitories and condominiums in the Taft Avenue area. The application features condo listings, user reviews, and forums where students can discuss housing options and share experiences.

## Features

- **User Authentication**: Secure signup, login, and profile management
- **Condo Listings**: Browse and search for condos with amenities, distance info, and images
- **Review System**: Read and write reviews for condos with ratings and comments
- **Discussion Forums**: Engage in topic-based discussions about student housing
- **Admin Dashboard**: Manage users, condos, and moderate forum content
- **Responsive Design**: Mobile-friendly interface for on-the-go access

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication & Hashing**: JWT (JSON Web Tokens), bcrypt
- **Image Storage**: Base64 encoding (with optional cloud storage support), Multer

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.x or later)
- [npm](https://www.npmjs.com/) (v6.x or later)
- [Git](https://git-scm.com/)
- Code editor (VS Code recommended)

## Getting Started

### 1. Clone the Repository

```bash
mkdir -p ~/VSCode-Projects
cd ~/VSCode-Projects
git clone https://github.com/yourusername/taftlivin.git
cd taftlivin
```

### 2. Set Up Environment Variables

Create a `.env` file in the backend directory:

```bash
cd backend
touch .env
```

Add the following environment variables:

```plaintext
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.r9b2e.mongodb.net/taftlivin?retryWrites=true&w=majority
JWT_SECRET=yoursecretkey123
```

Note: Replace `<username>` and `<password>` with your MongoDB Atlas credentials.

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Database Setup

The application uses MongoDB Atlas with pre-configured:
- Collection of condos around Taft Avenue
- User accounts system
- Review storage
- Forum topics and posts

### 5. Running the Application

```bash
npm run dev
```

Access the application:
- Backend API: http://localhost:8000/api
- Frontend: Open index.html in browser or use Live Server

## Project Structure

```
taftlivin/
├── backend/               # Node.js server
│   ├── models/           # MongoDB schema models
│   ├── routes/           # API route handlers
│   ├── middleware/       # Authentication middleware
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
└── frontend/             # Static frontend files
    ├── images/           # Image assets
    ├── js/               # JavaScript files
    ├── pages/            # HTML pages
    ├── index.html        # Main application page
    └── style.css         # Global styles
```

## API Endpoints

### Authentication
- POST `/api/users/register` - Register new user
- POST `/api/users/login` - Login user
- GET `/api/users/me` - Get current user profile

### Condos
- GET `/api/condos` - Get all condos
- GET `/api/condos/:id` - Get specific condo
- POST `/api/condos` - Add new condo (admin)
- PUT `/api/condos/:id` - Update condo (admin)
- DELETE `/api/condos/:id` - Delete condo (admin)

### Reviews
- GET `/api/reviews/condo/:id` - Get condo reviews
- POST `/api/reviews` - Submit review
- PUT `/api/reviews/:id` - Update review
- DELETE `/api/reviews/:id` - Delete review

### Admin
- GET `/api/admin/users` - Get all users
- PUT `/api/admin/users/:id` - Update user
- DELETE `/api/admin/users/:id` - Delete user

## Test Accounts

Admin:
- Email: admin@emai.com
- Password: admin123

Regular User:
- Email: user@email.com
- Password: user123

## Contributors

- Lance Tulagan (lance_tulagan@dlsu.edu.ph)
- Ivan Boado (jorem_boado@dlsu.edu.ph)
- Yuyang Guo (yuyang_guo@dlsu.edu.ph)
- Mark Pineda (mark_pineda@dlsu.edu.ph)

## License

© 2025 TaftLivin. All Rights Reserved.
