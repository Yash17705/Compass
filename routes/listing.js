const express= require("express")
const router= express.Router()
const wrapAsync=require("../utils/wrapAsync.js");
const {listingSchema}=require("../schema.js")
const ExpressError=require("../utils/ExpressErrors.js")
const Listing = require("../models/listing.js");

const validateListing=(req,res,next)=>{
  let error= listingSchema.validate(req.body);
  
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(404,errMsg);
  }else{
    next();
  }
}
router.get("/", wrapAsync(async (req, res) => {
  const allListings= await Listing.find({})
  res.render("listings/index.ejs",{allListings});
}));
//new route
router.get("/new",(req,res)=>{
  res.render("listings/new.ejs");
})
//show route
router.get("/:id",wrapAsync(async(req,res)=>{
  let {id}=req.params
  const listing=await Listing.findById(id).populate("reviews")
  res.render("listings/show.ejs",{listing})
}))

//create route
router.post("/",validateListing,wrapAsync(async(req,res,next)=>{
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
router.get("/:id/edit",wrapAsync(async(req,res)=>{
  let {id}=req.params
  const listing=await Listing.findById(id)
  res.render("listings/edit.ejs",{listing})
}))

router.put("/:id",validateListing,wrapAsync(async(req,res)=>{
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
  })
)
router.delete("/:id",wrapAsync(async(req,res)=>{
  let {id}=req.params
  let deletedListing= await Listing.findByIdAndDelete(id)
  console.log("delelte listing")
  res.redirect("/listings")

}))
//Reviews
//Post Route


module.exports= router;
