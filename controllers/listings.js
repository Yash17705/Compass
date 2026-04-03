const Listing = require("../models/listing");
const { cloudinary } = require("../cloudConfig.js");
const ExpressError = require("../utils/ExpressErrors.js");

const geocodeListingLocation = async (location, country) => {
  const query = [location, country].filter(Boolean).join(", ");
  const searchParams = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
    {
      headers: {
        "User-Agent": "Compass/1.0 (listing geocoder)",
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new ExpressError(502, "OpenStreetMap geocoding request failed.");
  }

  const results = await response.json();
  const match = results[0];

  if (!match) {
    throw new ExpressError(
      400,
      "Unable to find coordinates for that location. Try a more specific place."
    );
  }

  return {
    type: "Point",
    coordinates: [Number(match.lon), Number(match.lat)],
  };
};

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", " Listing does not exist");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  if (!req.body.listing) {
    req.flash("error", "Invalid listing data");
    return res.redirect("/listings/new");
  }

  const newListingData = { ...req.body.listing };
  delete newListingData.image;
  newListingData.geometry = await geocodeListingLocation(
    newListingData.location,
    newListingData.country
  );
  if (req.file) {
    newListingData.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  const newlisting = new Listing(newListingData);
  newlisting.owner = req.user._id;
  await newlisting.save();
  req.flash("success", "New Listing Created");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", " Listing does not exist");
    return res.redirect("/listings");
  }
  let originalImageUrl= listing.image.url
  originalImageUrl.replace("/upload","/upload/h_300,w_250")
  
  res.render("listings/edit.ejs", { listing,originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  if (!req.body.listing) {
    req.flash("error", "Invalid listing data");
    return res.redirect(`/listings/${id}/edit`);
  }

  const existingListing = await Listing.findById(id);
  if (!existingListing) {
    req.flash("error", "Listing does not exist");
    return res.redirect("/listings");
  }

  const updatedListingData = { ...req.body.listing };
  delete updatedListingData.image;
  const locationChanged =
    updatedListingData.location !== existingListing.location ||
    updatedListingData.country !== existingListing.country;
  if (locationChanged) {
    updatedListingData.geometry = await geocodeListingLocation(
      updatedListingData.location,
      updatedListingData.country
    );
  }
  let oldImageFilename = null;
  if (req.file) {
    if (existingListing.image?.filename && existingListing.image.filename !== "defaultimage") {
      oldImageFilename = existingListing.image.filename;
    }
    updatedListingData.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await Listing.findByIdAndUpdate(id, updatedListingData);
  if (oldImageFilename) {
    await cloudinary.uploader.destroy(oldImageFilename);
  }
  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing does not exist");
    return res.redirect("/listings");
  }

  if (listing.image?.filename && listing.image.filename !== "defaultimage") {
    await cloudinary.uploader.destroy(listing.image.filename);
  }

  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
};
