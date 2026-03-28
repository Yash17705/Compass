const multer = require("multer");
const { storage } = require("../cloudConfig.js");

module.exports = multer({ storage });
