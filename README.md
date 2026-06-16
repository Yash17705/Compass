# 🗺️ Compass

Compass is a modern, premium full-stack travel marketplace and listing application. It allows users to explore, host, and review stay listings across various worldwide destinations. Built with a robust backend and a highly polished, responsive client-side experience, it is ready to be showcased in any developer portfolio.

🔗 **Live Demo:** [https://compass-travel-app.onrender.com/listings](https://compass-travel-app.onrender.com/listings)

---

## ✨ Key Features

### 🌟 Discovery & UX
* **Dynamic Search & Explore:** Fast client-side filtering, sorting (price high-to-low, price low-to-high, title, newest), and instant keyword matching.
* **Airbnb-Style Filter Chips:** Category-based filters (e.g. Beach, Mountains, Cabins, Villas, City, Pools, Countryside) with matching icons.
* **Interactive Mapping:** Interactive maps powered by **Leaflet & OpenStreetMap** showing exact listing locations (geocoded automatically during creation using Nominatim).
* **Nightly Tax Toggle:** A client-side switch that dynamically updates the night rates to include a standard 18% service tax.
* **Favorites System:** Logged-in users can mark listings as favorites to view them in their personal list.
* **"My Listings" Filter:** Quick toggle for hosts to easily view and manage only the stays they have posted.

### 🏠 Host & Review Management
* **Listing CRUD:** Full capability to create, read, update, and delete listings.
* **Cloud Asset Uploads:** Listing images are securely uploaded and stored in **Cloudinary** using **Multer**.
* **Review System:** Threaded reviews showing a 5-star graphical rating (powered by Starability) and user comments.

### 🔒 Security & Performance
* **Session Persistence:** Persistent sessions managed via **Connect-Mongo** and MongoDB Atlas.
* **Robust Password Standards:** Custom registration validator requiring a minimum length of 8 characters, at least one capital letter, a number, and a special character.
* **Input Sanitization:** Safeguards against MongoDB injection attacks using **Express Mongo Sanitize**.
* **HTTP Security Headers:** Integrated **Helmet** with a strict Content Security Policy (CSP) and dynamic cryptographic nonces.
* **Express Rate Limiting:** Global rate limiters to protect endpoints against brute force and DDoS attacks.
* **Joi Validation:** Strict schema validation for incoming listing and review payloads.

---

## 🛠️ Tech Stack

* **Frontend:** EJS (HTML Template Engine), EJS-Mate layouts, Vanilla CSS, React (for dynamic exploring & detail view widgets), Leaflet (Maps)
* **Backend:** Node.js, Express.js (v5.x), Passport.js (Authentication)
* **Database:** MongoDB Atlas (Cloud Database), Mongoose (ODM), Connect-Mongo (Session Store)
* **Storage:** Cloudinary (Listing Images)
* **Validation:** Joi

---

## 📁 Project Architecture

```text
Compass/
├── app.js               # Express application entry point & middlewares
├── cloudConfig.js       # Cloudinary and Multer configuration
├── middleware.js        # Auth, ownership, and normalization middlewares
├── schema.js            # Joi verification schemas
├── controllers/         # MVC Controllers (listings, reviews, users)
├── init/                # Database seeding script and initial datasets
├── models/              # Mongoose Schemas (User, Listing, Review)
├── public/              # Static assets (CSS, client React bundles)
├── routes/              # Express Routers (listings, reviews, users)
└── views/               # EJS template folders
```

---

## ⚙️ Getting Started

To run Compass locally on your machine, follow these steps:

### 1. Clone & Install
```bash
git clone https://github.com/Yash17705/Compass.git
cd Compass
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_key
CLOUD_API_SECRET=your_cloudinary_secret
MONGO_URL=mongodb://127.0.0.1:27017/compass
SESSION_SECRET=a_long_random_session_encryption_key
PORT=8080
```

### 3. Initialize the Database
Make sure you have MongoDB running locally, then run the seed command to load sample listings:
```bash
npm run seed
```

### 4. Run the Dev Server
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🚀 API Endpoints

### Listings
* `GET /listings` — Browse all listings
* `POST /listings` — Create a new listing (Auth required)
* `GET /listings/:id` — Detail view of a stay
* `PUT /listings/:id` — Update a listing (Owner required)
* `DELETE /listings/:id` — Delete a listing (Owner required)
* `POST /listings/:id/favorite` — Toggle favorite status (Auth required)

### Reviews
* `POST /listings/:id/reviews` — Post a listing review (Auth required)
* `DELETE /listings/:id/reviews/:reviewId` — Remove a review (Author required)

### Users & Authentication
* `GET /signup` / `POST /signup` — User registration (Strict passwords)
* `GET /login` / `POST /login` — Log in and session generation
* `GET /logout` — Log out and session destruction

---

## 👤 Author

* **Yash** - [GitHub](https://github.com/Yash17705)
