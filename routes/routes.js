const express = require("express");
const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const router = express.Router();

const bcrypt = require("bcrypt");

const checkIfUserExists = async (username, password) => {
  const db = await getDBConnection();
  const user = await db.collection('users').findOne({ userName: username });
  return user;
}

const registerUser = async (firstName, lastName, userName, email, password) => {

  if (!firstName || !lastName || !userName || !email || !password) {
    return { success: false, message: "All fields are required." };
  }

  const hashPassword = await bcrypt.hash(password, 12);

  const db = await getDBConnection();
  const insertUser = await db.collection("users").insertOne({firstName: firstName, lastName: lastName, userName: userName, email: email, password: hashPassword});

  if(insertUser && insertUser.insertedId){
    console.log("User was created! " + insertUser[0].userName);
    return insertUser;
  }else{
    console.error("Error registering user......" + insertUser);
    console.error(insertUser);
  }
}

/*router.get("/", async (req, res) => {
  const insertUsers = await data();
  console.log("Inserted a user......." + insertUsers);
  res.send("Created a user....").status(200);
});*/

router.get("/getUsers", async (req, res) => {
  const db = await getDBConnection();
  const usersCollection = await db.collection("users");
  const results = await usersCollection.find({}).toArray();
  res.json(results).status(200);
});

router.post("/login", async (req, res) => {
  const {userName, password} = req.query;
  const doesUserExist = await checkIfUserExists(userName, password);
  doesUserExist ?  res.send(doesUserExist).status(200) :  res.sendStatus(401);
});


router.post("/register", async (req, res) => {
  console.log("HIT?");
  const {firstName, lastName, userName, email, password} = req.query;
  const doesUserExist = await checkIfUserExists(userName, password);

  if(doesUserExist){
    console.log("Users already exist, logging in........");
    return res.send("User exists.........").status(401);
  }else{
    console.log("Registering user........");
    const userRegistered = await registerUser(firstName, lastName, userName, email, password);
    return res.send(userRegistered).status(200);
  }
});

module.exports = router;
