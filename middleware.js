const Listing= require("./models/listing")
const Review= require("./models/review")
const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressErrors.js");
module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
      req.session.redirectUrl= req.originalUrl
      req.flash("error","you must be logged in")
      return res.redirect("/login")
    }
  next()
}
module.exports.saveRedirectUrl=(req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl=req.session.redirectUrl
    delete req.session.redirectUrl
  }
  next()
}

module.exports.normalizeListingBody = (req, res, next) => {
  if (req.body.listing) {
    return next();
  }

  const listing = {
    title: req.body["listing[title]"] ?? req.body.title,
    description: req.body["listing[description]"] ?? req.body.description,
    location: req.body["listing[location]"] ?? req.body.location,
    country: req.body["listing[country]"] ?? req.body.country,
    price: req.body["listing[price]"] ?? req.body.price,
    image: req.body["listing[image]"] ?? req.body.image,
  };

  if (Object.values(listing).some((value) => value !== undefined)) {
    req.body.listing = listing;
  }

  next();
}

module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);

  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
}

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);

  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
}

module.exports.isOwner=async(req,res,next)=>{
  let {id}=req.params
  let listing= await Listing.findById(id)
  if(!listing){
    req.flash("error","Listing does not exist")
    return res.redirect("/listings")
  }
  if(!listing.owner.equals(res.locals.currUser._id)){
    req.flash("error","you do not have permission to perform this action")
    return res.redirect(`/listings/${id}`)
  }
  next()
}

module.exports.isReviewAuthor=async(req,res,next)=>{
  let {id,reviewId}=req.params
  let review= await Review.findById(reviewId)
  if(!review){
    req.flash("error","Review does not exist")
    return res.redirect(`/listings/${id}`)
  }
  if(!review.author.equals(res.locals.currUser._id)){
    req.flash("error","you are not the author of this review")
    return res.redirect(`/listings/${id}`)
  }
  next()
}
