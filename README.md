# Compass

Compass is a full-stack travel listing web app where users can explore destinations, add new stays, edit listings, and leave reviews. It is built with Node.js, Express, MongoDB, EJS, and Mongoose, and is currently still a work in progress.

## Description

Compass is designed as a lightweight property and stay discovery platform inspired by modern travel marketplaces. The current version focuses on the core CRUD flow for listings and reviews, with server-side rendering and a simple, clean interface.

## Preview

- Browse all listings on a dedicated index page
- View listing details with image, price, location, and country
- Create, edit, and delete listings
- Add and remove reviews with rating and comment validation
- Seed the database with sample travel listings

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- EJS + EJS-Mate
- Joi
- Method Override
- HTML/CSS/JavaScript

## Current Features

- Full CRUD support for listings
- Review system connected to each listing
- Joi-based request validation for listings and reviews
- Mongoose models with review cleanup on listing deletion
- Server-rendered pages using reusable EJS layouts and partials
- Static assets for custom styling and client-side behavior

## Work In Progress

This project is actively under development. A few areas are still evolving:

- Authentication and user accounts
- Authorization for listing/review ownership
- Better error handling and flash messages
- Improved UI polish and responsive refinements
- Image upload support instead of URL-only images
- Search, filters, and category-based discovery

## Project Structure

```text
Compass/
├── app.js
├── models/
├── views/
├── public/
├── init/
├── schema.js
└── package.json
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Yash17705/Compass.git
cd Compass
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start MongoDB locally

Make sure MongoDB is running on:

```bash
mongodb://127.0.0.1:27017/compass
```

### 4. Seed sample data

```bash
node init/index.js
```

### 5. Run the app

```bash
npm run dev
```

Then open:

```text
http://localhost:8080/listings
```

## Why Compass

The goal of Compass is to practice and showcase full-stack fundamentals through a real, portfolio-friendly project:

- RESTful routing
- CRUD operations
- Schema validation
- MongoDB relationships
- Server-side rendering
- Clean project organization

## Roadmap

- Add user authentication and sessions
- Restrict edits/deletes to owners
- Support image uploads with cloud storage
- Add search and filtering
- Improve form UX and validation feedback
- Deploy the app publicly

## Status

Compass is not finished yet, but the base application is functional and growing. This repository reflects the ongoing build process and future improvements will continue to expand the platform.

## Author

Yash
