const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.render("home"));
router.get("/user", (req, res) => res.render("user"));
router.get("/map", (req, res) => res.render("map"));
router.get("/predictor", (req, res) => res.render("predictor"));
router.get("/benefits", (req, res) => res.render("benefits"));
router.get("/about", (req, res) => res.render("about"));

module.exports = router;
