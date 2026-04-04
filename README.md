# Compass

Compass is a full-stack travel listing web app for exploring, creating, and reviewing stay listings across destinations. It is built with Node.js, Express, MongoDB, EJS, and Mongoose, with server-rendered pages and a simple travel marketplace flow.

## Current Status

The project is functional and includes:

- User signup, login, logout, and session handling
- Listing CRUD with image uploads to Cloudinary
- Review creation and deletion with author checks
- OpenStreetMap location preview and listing map display
- Search, category-style filters, and a tax toggle on the listings page
- Joi-based request validation and flash messages

## Features

### Listings

- Browse all listings on `/listings`
- Create, edit, and delete listings
- Upload listing images with Multer + Cloudinary
- Save `location`, `country`, and geocoded coordinates
- View a map on the listing details page

### Discovery UI

- Search by title, description, location, or country
- Airbnb-style filter chips such as beach, mountains, cabins, villas, city, luxury, and pools
- Client-side tax toggle for displaying nightly price with 18% tax

### Reviews

- Add reviews to listings
- Delete only your own reviews
- Rating and comment validation using Joi

### Authentication and Authorization

- Sign up and log in with Passport Local
- Protected listing creation, editing, deletion, and review actions
- Owner checks for listings
- Author checks for reviews

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- EJS
- EJS-Mate
- Passport.js
- Passport Local
- Passport Local Mongoose
- Joi
- Multer
- Cloudinary
- OpenStreetMap + Nominatim
- Leaflet

## Project Structure

```text
Compass/
├── app.js
├── cloudConfig.js
├── middleware.js
├── schema.js
├── package.json
├── controllers/
│   ├── listings.js
│   ├── reviews.js
│   └── users.js
├── init/
│   ├── data.js
│   └── index.js
├── models/
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── public/
│   ├── css/
│   └── js/
├── routes/
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── utils/
│   ├── ExpressErrors.js
│   ├── upload.js
│   └── wrapAsync.js
└── views/
    ├── includes/
    ├── layouts/
    ├── listings/
    └── users/
```

## Environment Variables

Create a `.env` file in the project root.

Required:

```env
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

Also see [`.env.example`](/Users/yash/Desktop/Compass/.env.example).

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

The app currently connects to:

```text
mongodb://127.0.0.1:27017/compass
```

### 4. Add environment variables

Create `.env` with your Cloudinary credentials.

### 5. Seed sample data

```bash
node init/index.js
```

Note: the seed script geocodes listing locations using OpenStreetMap Nominatim, so internet access is required while seeding.

### 6. Run the app

```bash
npm run dev
```

Open:

```text
http://localhost:8080/listings
```

## Main Routes

### Listing Routes

- `GET /listings` - list all listings
- `GET /listings/new` - render new listing form
- `POST /listings` - create listing
- `GET /listings/:id` - show single listing
- `GET /listings/:id/edit` - render edit form
- `PUT /listings/:id` - update listing
- `DELETE /listings/:id` - delete listing

### Review Routes

- `POST /listings/:id/reviews` - create review
- `DELETE /listings/:id/reviews/:reviewId` - delete review

### User Routes

- `GET /signup`
- `POST /signup`
- `GET /login`
- `POST /login`
- `GET /logout`

## Notes

- Listing images are stored in Cloudinary.
- Listing coordinates are generated from `location + country`.
- Existing listings without `geometry` will not show a map until they are re-saved or re-seeded.
- The category chips are currently inferred from listing text, not stored as a dedicated schema field.
- The tax toggle is a UI feature only and does not change stored prices.

## Limitations

- MongoDB connection string is currently hardcoded in `app.js`
- Session secret is currently hardcoded in `app.js`
- There is no automated test suite yet
- Filter categories are inferred, not first-class model fields

## Roadmap

- Move secrets and database config fully into environment variables
- Add a real listing category field
- Backfill orphaned listing owners cleanly
- Improve responsive polish further
- Add automated tests
- Deploy the app

## Author

Yash
