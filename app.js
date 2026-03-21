const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./uitls/wrapAsync.js");
const ExpressError=require("./uitls/ExpressErrors.js")
const {listingSchema}=require("./schema.js")
const Review= require("./models/review.js")

const MONGO_URL = "mongodb://127.0.0.1:27017/compass";
const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60";
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


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.engine('ejs',ejsMate);
app.use(express.urlencoded({extended:true}))
app.use(methodOverride("_method"))
app.use(express.static(path.join(__dirname,"/public")));
app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

const validateListing=(req,res,next)=>{
  let error= listingSchema.validate(req.body);
  
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(404,errMsg);
  }else{
    next();
  }
}

//Index Route
app.get("/listings", wrapAsync(async (req, res) => {
  const allListings= await Listing.find({})
  res.render("listings/index.ejs",{allListings});
}));
//new route
app.get("/listings/new",(req,res)=>{
  res.render("listings/new.ejs");
})
//show route
app.get("/listings/:id",wrapAsync(async(req,res)=>{
  let {id}=req.params
  const listing=await Listing.findById(id)
  res.render("listings/show.ejs",{listing})
}))

//create route
app.post("/listings",validateListing,wrapAsync(async(req,res,next)=>{
  const newListingData = { ...req.body.listing };
  
  const imageUrl = req.body.listing.image?.trim();
  delete newListingData.image;
  newListingData.image = {
    url: imageUrl || DEFAULT_IMAGE_URL,
  };
  const newlisting = new Listing(newListingData);
  await newlisting.save();
  res.redirect("/listings");
  })
);

//edit route
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
  let {id}=req.params
  const listing=await Listing.findById(id)
  res.render("listings/edit.ejs",{listing})
}))

//update route
app.put("/listings/:id",validateListing,wrapAsync(async(req,res)=>{
  let {id}=req.params
  const updatedListingData = { ...req.body.listing };
  const imageUrl = req.body.listing.image?.trim();

  delete updatedListingData.image;
  if (imageUrl) {
    updatedListingData.image = {
      url: imageUrl,
    };
  }

  await Listing.findByIdAndUpdate(id, updatedListingData)
  res.redirect(`/listings/${id}`)
}))
//delete route
app.delete("/listings/:id",wrapAsync(async(req,res)=>{
  let {id}=req.params
  let deletedListing= await Listing.findByIdAndDelete(id)
  console.log("delelte listing")
  res.redirect("/listings")

}))
//Reviews
//Post Route
app.post("/listings/:id/reviews",async(req,res)=>{
  let listing= await Listing.findById(req.params.id)
  let newReview= new Review(req.body.review)
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  
  res.redirect(`/listings/${listing._id}`);

})
app.all("/{*splat}",(req,res,next)=>{
  next(new ExpressError(404,"Page not found"))
})
app.use((err,req,res,next)=>{
  if (res.headersSent) {
    return next(err);
  }
  let {statusCode=500,message="Something went wrong"}=err;
  res.status(statusCode).render("error.ejs",{message})
  // res.status(statusCode).send(message);
})
app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
