const express = require("express");
const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const router = express.Router();

router.get("/", async (req, res) => {
  const insertUsers = await data();
  console.log("Inserted a user......." + insertUsers);
  res.send("Created a user....").status(200);
});

router.get("/getUsers", async (req, res) => {
  const db = await getDBConnection();
  const usersCollection = await db.collection("users");
  const results = await usersCollection.find({}).toArray();
  res.json(results).status(200);
});

router.post("/login", async (req, res) => {
  const db = await getDBConnection();
  const findUser = await db.collection("users").find({userName: req.params.userName, password: req.params.password}).toArray();

  console.log("Does the user exist? " + findUser);

  res.send(findUser).status(200);
});

module.exports = router;
