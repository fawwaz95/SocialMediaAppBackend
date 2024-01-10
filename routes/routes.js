const express = require("express");
const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const router = express.Router();


router.get("/getUsers", async (req, res) => {
  const insertUsers = await data();
  console.log("The data............." + insertUsers);

  const db = await getDBConnection();
  const usersCollection = await db.collection("users");
  const results = await usersCollection.find({}).toArray();
  res.json(results).status(200);
});

router.post("/createUser", async (req, res) => {
  /*console.log("The user req to create......." + req.userName);
  const db = await getDBConnection();
  const usersCollection = await db.collection("users");*/
  res.send("createUser endpoint hit!").status(200);
});

module.exports = router;
