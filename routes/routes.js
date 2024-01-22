const express = require("express");
const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const router = express.Router();

const bcrypt = require("bcrypt");
const e = require("express");

const getUser = async (username) => {
  console.log("Check username " + username);
  const db = await getDBConnection();
  const user = await db.collection('users').findOne({ userName: username });

  console.log("User thing");
  console.log(user);

  if (!user) {
    return { success: false, message: `userName doesn't exist ${username}` };
  }

  return { success: true, ...user };
}

const getUserProfile = async (userName) => {
  const db = await getDBConnection();
  const getProfile = await db.collection("profile").findOne({ userName: userName });

  if (!getProfile) {
    return { success: false, message: `User profile doesn't exist ${userName}` }
  }

  return { success: true, ...getProfile }

}

const checkIfEmailExists = async (email) => {
  const db = await getDBConnection();
  const getUserByEmail = await db.collection("users").findOne({ email: email });

  if (!getUserByEmail) {
    return { success: false, message: `This Email is not ${email}` };
  }

  return { success: true, ...getUserByEmail };
}

const checkIfUserExists = async (userName, password) => {

  if (!userName || !password) {
    throw { statusCode: 400, message: "Please define both username and password." };
  }

  const user = await getUser(userName);

  if (!user) {
    throw { statusCode: 400, message: `No user found for the following userName ${userName}` };
  }

  const comparePassword = await bcrypt.compare(password, user.password);

  if (!comparePassword) {
    throw { statusCode: 400, message: `Password doesnt match for the following userName ${userName}` };
  }

  return { success: true, ...user };
}

const createProfile = async (firstName, lastName, userName, email) => {
  if (!firstName || !lastName || !userName || !email) {
    return res.status(400).send({ success: false, message: "All fields are required." });
  }

  try {
    const db = await getDBConnection();
    const insertProfile = await db.collection("profile").insertOne({ firstName, lastName, userName, email, bio: "", location: "" });

    if (!insertProfile) {
      return { success: false, message: "User profile not found" };
    }

    const getProfile = await getUserProfile(userName);
    return { success: true, ...getProfile };

  } catch (error) {
    console.log("Error in creatProfile " + error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }


}


const registerUser = async (firstName, lastName, userName, email, password) => {

  if (!firstName || !lastName || !userName || !email || !password) {
    throw { statusCode: 400, message: "All fields are required." };
  }

  try {
    const hashPassword = await bcrypt.hash(password, 12);

    const db = await getDBConnection();
    const insertUser = await db.collection("users").insertOne({ firstName: firstName, lastName: lastName, userName: userName, email: email, password: hashPassword });

    if(!insertUser){
      return { success: false, message: "Unable to create user" };
    }

    return { success: true, ...insertUser };
  } catch (error) {
    console.error("Unable to register user......" + error)
    res.status(error.statusCode || 500).json({ success: false, message: message });
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
  try {
    const { userName, password } = req.body;
    const getUserInfo = await checkIfUserExists(userName, password);
    const userProfile = await getUserProfile(getUserInfo.userName);

    console.log("User profile.....");
    console.log(userProfile);

    res.status(200).json(userProfile)
  } catch (error) {
    console.error(error.statusCode + " " + error.message);
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }

});

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body;
    const doesUserExist = await getUser(userName);
    const doesEmailExist = await checkIfEmailExists(email);

    if (doesUserExist.success === true) {
      console.log(`Username ${userName} already exist........`);
      console.log(doesUserExist);
      return res.status(400).send({ success: false, message: `Username ${userName} already exists.........` });
    } else if (doesEmailExist.success === true) {
      console.log(`Email ${email} already exist........`);
      console.log(doesEmailExist);
      return res.status(400).send({ success: false, message: `Email ${email} already exists.........` });
    } else {
      console.log("Registering user........");
      const userRegistered = await registerUser(firstName, lastName, userName, email, password);
      const creatingProfile = await createProfile(firstName, lastName, userName, email);
      const userProfile = await getUserProfile(userName);

      console.log("Here is the user after registration ");
      console.log(userProfile);

      return res.status(200).json(userProfile);
    }
  } catch (error) {
    console.error(error.statusCode + " " + error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }

});

module.exports = router;
