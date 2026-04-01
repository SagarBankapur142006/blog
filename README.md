# Inkly

Inkly is a full-stack social publishing platform focused on writing, discovery, and lightweight interaction. Users can create accounts, publish posts, explore a feed, search writers, and like or unlike content.

## Live Demo
Frontend: https://blog-7t872266t-sagarbankapur142006s-projects.vercel.app

## Deployment
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Architecture
The project is split into two applications:

- `inkly`  
  React frontend application

- `inkly-backend`  
  Node.js + Express backend API connected to MongoDB

## Tech Stack
### Frontend
- React
- Axios
- Tailwind CSS

### Backend
- Node.js
- Express
- Mongoose
- bcrypt
- JSON Web Token (JWT)
- CORS

### Database
- MongoDB Atlas

### Hosting
- Vercel for frontend deployment
- Render for backend deployment

## Features
- User signup
- User login
- Session persistence with local storage
- Create and publish posts
- Feed with latest posts
- Like and unlike functionality
- Profile page with user posts
- Discover page
- Search users
- Responsive modern UI

## Backend API
### Auth
- `POST /signup`
- `POST /login`

### Users
- `GET /users`
- `GET /users/:id`

### Posts
- `GET /posts`
- `POST /posts`
- `POST /like/:id`

## Environment Variables
### Backend
Create a `MONGO_URI` variable in Render using your MongoDB Atlas connection string.

### Frontend
Set the following in Vercel:
 
 ##    Notes
 The backend is hosted on Render free tier, so the first request may be slow after inactivity.
MongoDB Atlas is used as the production database.
The app uses a simple JWT-based authentication flow.
Passwords are hashed using bcrypt before storage.
 ## Future Improvements

 Comments system
Follow system
Rich text editor
Image upload support
Better profile editing
Pagination and optimized search
Protected backend routes with JWT middleware



```env
REACT_APP_API=https://inkly-backend-2xd9.onrender.com
