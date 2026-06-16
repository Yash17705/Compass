const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review({
    ...req.body.review,
    comment: req.body.review.comment.trim(),
  });

  newReview.author = req.user._id;
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  if (req.get("Accept")?.includes("json")) {
    return res.json({
      success: true,
      review: {
        id: newReview._id.toString(),
        rating: newReview.rating,
        comment: newReview.comment,
        author: {
          id: req.user._id.toString(),
          username: req.user.username,
        },
      },
    });
  }

  req.flash("success", "new Review Created");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  if (req.get("Accept")?.includes("json")) {
    return res.json({
      success: true,
      message: "Review Deleted",
    });
  }

  req.flash("success", "Review Deleted");
  res.redirect(`/listings/${id}`);
};
