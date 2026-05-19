const Listing = require("../models/listing");
const User = require("../models/user.js");
const { cloudinary } = require("../cloudConfig.js");
const ExpressError = require("../utils/ExpressErrors.js");

const FILTERS = [
  {
    key: "trending",
    label: "Trending",
    icon: "fa-solid fa-fire",
    matches: () => true,
  },
  {
    key: "beach",
    label: "Beach",
    icon: "fa-solid fa-umbrella-beach",
    matches: (text) => /beach|coast|ocean|sea|bungalow/i.test(text),
  },
  {
    key: "mountains",
    label: "Mountains",
    icon: "fa-solid fa-mountain",
    matches: (text) => /mountain|alps|banff|aspen|ski/i.test(text),
  },
  {
    key: "cabins",
    label: "Cabins",
    icon: "fa-solid fa-house-chimney",
    matches: (text) => /cabin|treehouse|log cabin|lake house/i.test(text),
  },
  {
    key: "villas",
    label: "Villas",
    icon: "fa-solid fa-building-columns",
    matches: (text) => /villa|palace|mansion/i.test(text),
  },
  {
    key: "city",
    label: "City",
    icon: "fa-solid fa-city",
    matches: (text) => /downtown|city|apartment|loft|penthouse|brownstone/i.test(text),
  },
  {
    key: "luxury",
    label: "Luxury",
    icon: "fa-solid fa-gem",
    matches: (text) => /luxury|luxurious|exclusive|penthouse|private island|opulent/i.test(text),
  },
  {
    key: "pools",
    label: "Pools",
    icon: "fa-solid fa-water-ladder",
    matches: (text) => /pool|infinity pool|private pool/i.test(text),
  },
  {
    key: "countryside",
    label: "Countryside",
    icon: "fa-solid fa-seedling",
    matches: (text) => /farm|countryside|vineyard|cottage|serene|rural/i.test(text),
  },
];

const AMENITIES = [
  "Wifi",
  "Kitchen",
  "Free parking",
  "Air conditioning",
  "Pool",
  "Workspace",
  "Pet friendly",
  "Mountain view",
];

const SORT_OPTIONS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  title: { title: 1 },
};

module.exports.filters = FILTERS;
module.exports.amenities = AMENITIES;

const getListingText = (listing) =>
  [listing.title, listing.description, listing.location, listing.country]
    .filter(Boolean)
    .join(" ");

const getListingFilters = (listing) => {
  const text = getListingText(listing);
  const inferredFilters = FILTERS.filter(
    (filter) => filter.key !== "trending" && filter.matches(text)
  ).map((filter) => filter.key);

  if (listing.category && !inferredFilters.includes(listing.category)) {
    inferredFilters.unshift(listing.category);
  }

  return inferredFilters;
};

const getAverageRating = (listing) => {
  const reviews = listing.reviews || [];
  if (reviews.length === 0) {
    return null;
  }

  const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0);
  return Number((ratingTotal / reviews.length).toFixed(1));
};

const getFavoriteIds = async (userId) => {
  if (!userId) {
    return [];
  }

  const user = await User.findById(userId).select("favoriteListings");
  return user?.favoriteListings?.map((id) => id.toString()) || [];
};

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
  const selectedFilter = req.query.filter || "trending";
  const searchQuery = req.query.q?.trim() || "";
  const selectedSort = SORT_OPTIONS[req.query.sort] ? req.query.sort : "newest";
  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  const selectedGuests = Number(req.query.guests);
  const favoritesOnly = req.query.favorites === "true";
  const favoriteIds = await getFavoriteIds(req.user?._id);
  const allListings = await Listing.find({})
    .populate("reviews")
    .sort(SORT_OPTIONS[selectedSort]);
  const listingsWithFilters = allListings.map((listing) => ({
    ...listing.toObject(),
    matchedFilters: getListingFilters(listing),
    searchText: getListingText(listing).toLowerCase(),
    averageRating: getAverageRating(listing),
    reviewCount: listing.reviews?.length || 0,
    isFavorite: favoriteIds.includes(listing._id.toString()),
  }));

  const filterMatchedListings =
    selectedFilter === "trending"
      ? listingsWithFilters
      : listingsWithFilters.filter((listing) =>
          listing.matchedFilters.includes(selectedFilter)
        );

  const filteredListings = searchQuery
    ? filterMatchedListings.filter((listing) =>
        listing.searchText.includes(searchQuery.toLowerCase())
      )
    : filterMatchedListings;

  const priceFilteredListings = filteredListings.filter((listing) => {
    const aboveMin = Number.isFinite(minPrice) ? listing.price >= minPrice : true;
    const belowMax = Number.isFinite(maxPrice) ? listing.price <= maxPrice : true;
    const enoughGuests = Number.isFinite(selectedGuests) ? listing.guests >= selectedGuests : true;
    const favorited = favoritesOnly ? listing.isFavorite : true;

    return aboveMin && belowMax && enoughGuests && favorited;
  });

  res.render("listings/index.ejs", {
    allListings: priceFilteredListings,
    filters: FILTERS,
    selectedFilter,
    searchQuery,
    selectedSort,
    minPrice: Number.isFinite(minPrice) ? minPrice : "",
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : "",
    selectedGuests: Number.isFinite(selectedGuests) ? selectedGuests : "",
    favoritesOnly,
    reactExploreData: {
      listings: priceFilteredListings.map((listing) => ({
        id: listing._id.toString(),
        title: listing.title,
        location: listing.location,
        country: listing.country,
        price: listing.price,
        guests: listing.guests || 2,
        bedrooms: listing.bedrooms || 1,
        bathrooms: listing.bathrooms || 1,
        imageUrl: listing.image?.url,
        averageRating: listing.averageRating,
        isFavorite: listing.isFavorite,
        href: `/listings/${listing._id}`,
      })),
      initialSearch: searchQuery,
      favoritesOnly,
    },
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs", { filters: FILTERS, amenities: AMENITIES });
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

  const favoriteIds = await getFavoriteIds(req.user?._id);
  const averageRating = getAverageRating(listing);
  res.render("listings/show.ejs", {
    listing,
    averageRating,
    isFavorite: favoriteIds.includes(listing._id.toString()),
  });
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
  
  res.render("listings/edit.ejs", { listing, originalImageUrl, filters: FILTERS, amenities: AMENITIES });
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

module.exports.toggleFavorite = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing does not exist");
    return res.redirect("/listings");
  }

  const user = await User.findById(req.user._id);
  const favoriteIndex = user.favoriteListings.findIndex((listingId) =>
    listingId.equals(listing._id)
  );

  if (favoriteIndex === -1) {
    user.favoriteListings.push(listing._id);
    req.flash("success", "Saved to your favorites");
  } else {
    user.favoriteListings.splice(favoriteIndex, 1);
    req.flash("success", "Removed from your favorites");
  }

  await user.save();
  res.redirect(req.get("Referer") || `/listings/${id}`);
};
