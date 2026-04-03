if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/compass";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const geocodeListing = async (listing) => {
  const query = [listing.location, listing.country].filter(Boolean).join(", ");
  const searchParams = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
    {
      headers: {
        "User-Agent": "Compass/1.0 (seed geocoder)",
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    return listing;
  }

  const results = await response.json();
  const match = results[0];
  if (!match) {
    return listing;
  }

  return {
    ...listing,
    geometry: {
      type: "Point",
      coordinates: [Number(match.lon), Number(match.lat)],
    },
  };
};

const initDB = async () => {
  await Listing.deleteMany({});
  const listingsWithOwner = initData.data.map((obj) => ({
    ...obj,
    owner: "69c4bbad2bb4168c2e2a2167",
  }));
  const listingsWithGeometry = await Promise.all(
    listingsWithOwner.map(geocodeListing)
  );
  await Listing.insertMany(listingsWithGeometry);
  console.log("data was initialized");
};

initDB();
