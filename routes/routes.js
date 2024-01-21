const express = require("express");
const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const router = express.Router();

const bcrypt = require("bcrypt");

const getUser = async (username) => {
  console.log("Check username " + username);
  const db = await getDBConnection();
  const user = await db.collection('users').findOne({ userName: username });
  return user;
}

const getUserProfile = async (userName) => {
  const db = await getDBConnection();
  const getProfile = await db.collection("profile").findOne({userName: userName});

  if(getProfile && getProfile.userName){
    console.log(`Found a user with userName ${userName}`);
    const userProfile = {success: true,  ...getProfile};
    return userProfile;
  }else{
    console.log(`userName doesnt exist ${userName}`);
    const userProfile = { success: false };
    return userProfile;
  }

}

const checkIfEmailExists = async (email) => {
  const db = await getDBConnection();
  const getUserByEmail = await db.collection("users").findOne({ email: email });

  if(getUserByEmail && getUserByEmail.email){
    console.log(`Found a user with email ${email}`);
    const userInfo = {success: true,  ...getEmail};
    return userInfo;
  }else{
    console.log(`Email doesnt exist ${email}`);
    const userInfo = { success: false };
    return userInfo;
  }

}

const checkIfUserExists = async (userName, password) => {

  if (!userName || !password) {
    throw { statusCode: 400, message: "Please define both username and password." };
  }

  const user = await getUser(userName);

  if(!user){
    throw { statusCode: 400, message: `No user found for the following userName ${userName}` };
  }

  const comparePassword = await bcrypt.compare(password, user.password);

  if(!comparePassword){
    throw { statusCode: 400, message: `Password doesnt match for the following userName ${userName}` };
  }

  const userInfo = {
    success: true,
    ...user,
  };

  return userInfo;
}

const createProfile = async (firstName, lastName, userName, email) => {
  if (!firstName || !lastName || !userName || !email) {
    return res.status(400).send({success: false, message: "All fields are required." });
  }

  const db = await getDBConnection();
  const insertProfile = await db.collection("profile").insertOne({firstName, lastName, userName, email, bio: "", location: ""});

  if(insertProfile && insertProfile.insertedId){
    console.log(`Successfully created a user profile for ${userName}!`);
    const getProfile = await getUserProfile(userName);

    const userProfile = {
      success: true,
      ...getProfile,
    }

    return userProfile;
  }else{
    throw { statusCode: 400, message: `Unable to create User Profile with userName ${userName}` }
  }

}


const registerUser = async (firstName, lastName, userName, email, password) => {

  if (!firstName || !lastName || !userName || !email || !password) {
    throw {statusCode: 400, message: "All fields are required."};
  }

  const hashPassword = await bcrypt.hash(password, 12);

  const db = await getDBConnection();
  const insertUser = await db.collection("users").insertOne({firstName: firstName, lastName: lastName, userName: userName, email: email, password: hashPassword});

  if(insertUser && insertUser.insertedId){
    console.log("User was created! " + insertUser.insertedId);

    const createdUser = {
      success: true,
      ...insertUser
    };

    return createdUser;
  }else{
    throw {statusCode: 400, message: `Unable to register user.....${userName}`};
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
  try{
    const {userName, password} = req.body;
    const getUserInfo = await checkIfUserExists(userName, password);
    const userProfile = await getUserProfile(getUserInfo.userName); 
  
    console.log("User profile.....");
    console.log(userProfile);

    res.status(200).json(userProfile)
  }catch(error){
    console.error(error.statusCode + " " + error.message);
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }

});

router.post("/register", async (req, res) => {
  try{
    const {firstName, lastName, userName, email, password} = req.body;
    const doesUserExist = await getUser(userName);
    const doesEmailExist = await checkIfEmailExists(email);
  
    if(doesUserExist){
      console.log(`Username ${userName} already exist........`);
      console.log(doesUserExist);
      return res.status(400).send( { success: false, message: `Username ${userName} already exists.........`});
    }else if (doesEmailExist){
      console.log(`Email ${email} already exist........`);
      console.log(doesEmailExist);
      return res.status(400).send( { success: false, message: `Email ${email} already exists.........`});
    }else{
      console.log("Registering user........");
      const userRegistered = await registerUser(firstName, lastName, userName, email, password);
      const creatingProfile = await createProfile(firstName, lastName, userName, email);
      const userProfile = await getUserProfile(userName); 
  
      console.log("Here is the user after registration ");
      console.log(userProfile);
  
      return res.status(200).json(userProfile);
    }
  }catch(error){
    console.error(error.statusCode + " " + error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
  
});

module.exports = router;
