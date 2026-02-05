const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const pageRoutes = require("./routes/pages");
app.use("/", pageRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
