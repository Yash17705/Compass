if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/compass";
const ownerUsername = process.argv[2];

const main = async () => {
  if (!ownerUsername) {
    throw new Error("Usage: node scripts/backfillListingOwners.js <username>");
  }

  await mongoose.connect(MONGO_URL);

  const owner = await User.findOne({ username: ownerUsername });
  if (!owner) {
    throw new Error(`No user found with username "${ownerUsername}"`);
  }

  const listings = await Listing.find({}).populate("owner");
  const listingsToBackfill = listings.filter((listing) => !listing.owner);

  if (listingsToBackfill.length === 0) {
    console.log("No ownerless listings found.");
    return;
  }

  await Listing.updateMany(
    { _id: { $in: listingsToBackfill.map((listing) => listing._id) } },
    { $set: { owner: owner._id } },
  );

  console.log(
    `Assigned ${listingsToBackfill.length} ownerless listing(s) to @${owner.username}.`,
  );
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
