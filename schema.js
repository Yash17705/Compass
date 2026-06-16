const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string()
      .valid(
        "beach",
        "mountains",
        "cabins",
        "villas",
        "city",
        "luxury",
        "pools",
        "countryside",
      )
      .required(),
    amenities: Joi.array().items(Joi.string().trim().max(40)).default([]),
    guests: Joi.number().required().min(1),
    bedrooms: Joi.number().required().min(0),
    bathrooms: Joi.number().required().min(0),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    image: Joi.string().allow("", null),
  }).required(),
}).unknown();

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().trim().required(),
  }).required(),
}).unknown();
