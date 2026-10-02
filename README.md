# Task Manager Web Application

A full-stack task manager built with a Node.js/Express backend, Prisma ORM, and a React + Vite frontend. It supports user authentication, task CRUD, status filtering, and Cloudinary-based image uploads.

## Tech Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express
- Database: PostgreSQL via Prisma
- Authentication: JWT + bcrypt
- Media: Cloudinary

## Local Setup

1. Install dependencies:
   - root: `npm install`
   - backend: `npm install --prefix backend`
   - frontend: `npm install --prefix frontend`
2. Create a backend environment file from `.env.example` and update values.
3. Run the app:
   - `npm run dev`

> On Windows PowerShell, if execution policy blocks `npm`, run:
> `powershell -ExecutionPolicy Bypass -Command "Set-Location 'c:\Users\HP\OneDrive\Desktop\Task'; npm run dev"`

## Environment Variables

The backend expects these variables in `.env`:

- `PORT=4000`
- `FRONTEND_ORIGIN=http://127.0.0.1:5173,http://127.0.0.1:5174`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`

## Features

- Secure registration and login
- JWT-protected task APIs
- User-scoped task ownership
- Task creation, edit, delete, and status updates
- Search and filtering
- Responsive dashboard with dark mode
- Cloudinary image upload support

## Production Notes

This project is set up to be deployed on Vercel with environment variables configured in the Vercel dashboard and Cloudinary credentials enabled for task image uploads.
