const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressErrors.js")
const listings= require("./routes/listing.js")
const reviews= require("./routes/review.js")

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
app.use("/listings",listings)
app.use("/listings/:id/reviews",reviews)

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
