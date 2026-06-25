# ShuleDiary

ShuleDiary is a school-focused productivity and assignment tracking web app that I am building step by step as I learn and improve my full-stack development skills.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

The goal of this app is to help students, teachers, and school teams manage assignments, track progress, organize academic work visually, and keep school tasks in one simple dashboard.

This project is built with **Next.js**, **Supabase**, and modern React patterns.

---

## Vision

The vision for ShuleDiary is to become a simple, practical, and reliable school productivity platform that helps learners and school teams stay organized.

Many students struggle with tracking assignments, deadlines, comments, progress, and school tasks across different places. ShuleDiary aims to bring that workflow into one clean digital space where academic work can be planned, tracked, updated, and reviewed easily.

The long-term vision is to build ShuleDiary into a tool that can support:

* Students managing assignments and deadlines
* Teachers tracking academic tasks and learner progress
* Schools improving visibility over classwork and submissions
* Better collaboration between learners, teachers, and school teams
* A simple dashboard that makes school work easier to follow

This is starting as an assignment and Kanban tracking app, but the broader goal is to grow it into a useful school diary system for real education workflows.

---

## Project Overview

ShuleDiary is currently focused on creating a clean dashboard experience where users can:

* Sign up and log in securely
* Complete a basic profile/onboarding flow
* View their dashboard after authentication
* Manage assignments in a Kanban-style workflow
* Move assignments between statuses
* Add and view assignment comments
* Store real data using Supabase

This is still an active work-in-progress project, and I am building it in small stable steps.

---

## Current Features

### Authentication

* User login and session handling
* Logged-out users are redirected to the login page
* Logged-in users can access the dashboard
* Missing-profile users are redirected to onboarding

### User Profile and Onboarding

* New users can complete their profile
* Dashboard access depends on having a valid profile
* Profile handling supports Supabase user identity

### Dashboard

* Main app dashboard route
* Assignment cards displayed in a Kanban board
* Clean structure for future school productivity features

### Assignment Kanban

* Assignments are organized by status
* Assignment status changes can persist to Supabase
* Drag-and-drop persistence is being improved step by step

### Assignment Comments

* Users can add comments to assignments
* Comments are saved to Supabase
* Comment save state and errors are handled in the UI

---

## Tech Stack

* **Next.js** – React framework for the web app
* **React** – UI components
* **TypeScript** – safer and clearer code
* **Supabase** – authentication, database, and backend services
* **CSS / Tailwind-style styling** – app styling and layout
* **Git and GitHub** – version control and project tracking

---

## Getting Started

First, install the project dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open the app in your browser:

```bash
http://localhost:3000
```

---

## Environment Variables

This project uses Supabase, so it needs local environment variables.

Create a file called:

```bash
.env.local
```

Add your Supabase project values inside it.

Example:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Important:

```bash
.env.local
```

must never be pushed to GitHub because it contains private project keys.

---

## Database

The app uses Supabase tables and policies for storing user profiles, assignments, assignment statuses, and comments.

Database migration files are stored in the `supabase` folder.

Current database work includes:

* Profile onboarding support
* Profile RLS policies
* Assignment comments table
* Assignment status persistence support

---

## Useful Commands

Run the local development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Start the production build locally:

```bash
npm run start
```

Run lint checks:

```bash
npm run lint
```

---

## Project Status

This project is currently under active development.

Completed or in-progress areas include:

* Next.js app setup
* Authentication flow
* Dashboard route protection
* Profile onboarding flow
* Supabase profile integration
* Assignment Kanban board
* Assignment comments
* Assignment status persistence

Next major areas planned:

* Improve the login page design
* Finalize drag-and-drop Kanban persistence
* Improve dashboard UI and empty states
* Add stronger user profile management
* Add more school-focused productivity features

---

## Why I Am Building This

I am building ShuleDiary as a practical learning project and as a real product idea for helping schools and learners manage academic work better.

The project is helping me improve in:

* Full-stack web development
* Next.js
* Supabase
* Authentication
* Database design
* Git and GitHub workflows
* Building real user-facing features step by step

---

## Author

Built by **Barack Otieno**.

This project is part of my journey of learning software development by building real, useful applications.
