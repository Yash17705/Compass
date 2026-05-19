const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review= require("./review.js")
const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ["beach", "mountains", "cabins", "villas", "city", "luxury", "pools", "countryside"],
    default: "city",
  },
  amenities: [
    {
      type: String,
      trim: true,
    },
  ],
  guests: {
    type: Number,
    min: 1,
    default: 2,
  },
  bedrooms: {
    type: Number,
    min: 0,
    default: 1,
  },
  bathrooms: {
    type: Number,
    min: 0,
    default: 1,
  },
  image: {
    url: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60",
    },
    filename: {
      type: String,
      default: "defaultimage",
    },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  location: String,
  country: String,
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  reviews:[
    {
      type: Schema.Types.ObjectId,
      ref:"Review",
    }
  ],
  owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
  }
}, { timestamps: true });

listingSchema.index({ geometry: "2dsphere" });

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});
module.exports = mongoose.model("Listing", listingSchema);
