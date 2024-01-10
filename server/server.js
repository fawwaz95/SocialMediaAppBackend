const express = require("express");
const cors = require("cors");
const routes = require("../routes/routes.js");
const conn = require("../db/conn.js");
const { Db } = require("mongodb");

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/routes", routes);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
