const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");

const upload = require("../utils/upload.js");
const {
  isLoggedIn,
  isOwner,
  normalizeListingBody,
  validateListing,
} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("image"),
    normalizeListingBody,
    validateListing,
    wrapAsync(listingController.createListing),
  );

//new route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.get("/favorites", isLoggedIn, (req, res) => {
  const params = new URLSearchParams({ ...req.query, favorites: "true" });
  res.redirect(`/listings?${params.toString()}`);
});

//edit route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm),
);

router.post(
  "/:id/favorite",
  isLoggedIn,
  wrapAsync(listingController.toggleFavorite),
);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("image"),
    normalizeListingBody,
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

module.exports = router;
