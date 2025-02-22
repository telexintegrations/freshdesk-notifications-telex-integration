const express = require("express");
const cors = require("cors");
require("dotenv").config();
const freshdeskRoute = require("./routes/freshdesk");

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.json("Freshdesk Telex Integration");
});
app.use(freshdeskRoute);

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
