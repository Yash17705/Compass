const express= require("express")
const router= express.Router()
const wrapAsync=require("../utils/wrapAsync.js");
const {listingSchema}=require("../schema.js")
const ExpressError=require("../utils/ExpressErrors.js")
const Listing = require("../models/listing.js");

const validateListing=(req,res,next)=>{
  let { error } = listingSchema.validate(req.body);
  
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
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
  if(!listing){
    req.flash("error"," Listing does not exist")
    res.redirect("/listings")
  }
  res.render("listings/show.ejs",{listing})
}))

//create route
router.post("/",validateListing,wrapAsync(async(req,res,next)=>{
  const newListingData = { ...req.body.listing };
  
  const imageUrl = req.body.listing.image?.trim();
  delete newListingData.image;
  if (imageUrl) {
    newListingData.image = {
      url: imageUrl,
    };
  }
  const newlisting = new Listing(newListingData);
  await newlisting.save();
  req.flash("success","New Listing Created")
  res.redirect("/listings");
  })
);

//edit route
router.get("/:id/edit",wrapAsync(async(req,res)=>{
  let {id}=req.params
  const listing=await Listing.findById(id)
  if(!listing){
    req.flash("error"," Listing does not exist")
    res.redirect("/listings")
  }
  res.render("listings/edit.ejs",{listing})
}))

//Update route

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
    req.flash("success","Listing Updated")
    res.redirect(`/listings/${id}`)
  })
)
router.delete("/:id",wrapAsync(async(req,res)=>{
  let {id}=req.params
  let deletedListing= await Listing.findByIdAndDelete(id)
  console.log("deletedListing")
  req.flash("success","Listing Deleted")
  res.redirect("/listings")

}))
//Reviews
//Post Route


module.exports= router;
