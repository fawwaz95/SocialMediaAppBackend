const express = require("express");
const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const router = express.Router();

const bcrypt = require("bcrypt");

const checkIfUserNameExists = async (username) => {
  console.log("Check username " + username);
  const db = await getDBConnection();
  const user = await db.collection('users').findOne({ userName: username });
  return user;
}

const checkIfEmailExists = async (email) => {
  const db = await getDBConnection();
  const userEmail = db.collection("users").findOne({ email: email });
  return userEmail;
}

const checkIfUserExists = async (userName, password) => {
  const db = await getDBConnection();
  const getUser = await db.collection("users").findOne({userName: userName});

  if(!getUser){
    return { success: false, message: `No user found for the following userName ${userName}` };
  }

  const comparePassword = await bcrypt.compare(password, getUser.password);

  if(!comparePassword){
    return { success: false, message: `Password doesn't match for the following userName ${userName}` };
  }

  return getUser.userName;
}



const registerUser = async (firstName, lastName, userName, email, password) => {

  if (!firstName || !lastName || !userName || !email || !password) {
    return { success: false, message: "All fields are required." };
  }

  const hashPassword = await bcrypt.hash(password, 12);

  const db = await getDBConnection();
  const insertUser = await db.collection("users").insertOne({firstName: firstName, lastName: lastName, userName: userName, email: email, password: hashPassword});

  if(insertUser && insertUser.insertedId){
    console.log("User was created! " + insertUser.insertedId);
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
  const {userName, password} = req.body;
  const getUserInfo = await checkIfUserExists(userName, password);
  getUserInfo ?  res.json(getUserInfo).status(200) :  res.send(`Username ${userName} or password doesn't match....`).status(401);
});

router.post("/register", async (req, res) => {
  const {firstName, lastName, userName, email, password} = req.query;
  const doesUserExist = await checkIfUserNameExists(userName);
  const doesEmailExist = await checkIfEmailExists(email);

  if(doesUserExist){
    console.log(`Username ${userName} already exist........`);
    console.log(doesUserExist);
    return res.send(`Username ${userName} already exists.........`).status(401);
  }else if (doesEmailExist){
    console.log(`Email ${email} already exist........`);
    console.log(doesEmailExist);
    return res.send(`Email ${email} already exists.........`).status(401);
  }else{
    console.log("Registering user........");
    const userRegistered = await registerUser(firstName, lastName, userName, email, password);
    return res.send(userRegistered).status(200);
  }

});

module.exports = router;
