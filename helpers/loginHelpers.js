const getDBConnection = require("../db/conn.js");
const bcrypt = require("bcrypt");

module.exports = {
    checkValidEmail: async (email)  => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!pattern.test(email)){
            throw {statusCode: false, message: "Please provide a valid Email address"}
        }
    },

    checkValidUsername: async (userName)  => {
        if(userName.length < 6){
            throw {statusCode: 400, message: "Username must be at least 6 characters"};
        }                                                 
    },

    checkValidPassword: async (password)  => {
        if(password.length < 6){
            throw {statusCode: 400, message: "Password must be at least 6 characters"};
        }
    },

    validateUserPassword: async (password, hashedPassword) => {
        const comparePassword = await bcrypt.compare(password, hashedPassword);
        return comparePassword;
    },

    getUser: async (username) => {
        console.log("getUser function....");
        const db = await getDBConnection();
        const user = await db.collection('users').findOne({ userName: username });
    
        if (!user) {
            throw { statusCode: 400, message: "Username not found." };
        }
    
        return { success: true, ...user };
    },

    getUserByEmail: async (email) => {
        const db = await getDBConnection();
        const getUser = await db.collection("users").findOne({ email: email });

        if (!db) {
            throw { statusCode: 400, message: "Internal Error occured...." };
        }

        return { success: true, ...getUser };
    },

    getUserProfile: async (userName) => {
        const db = await getDBConnection();
        const getProfile = await db.collection("profile").findOne({ userName: userName });

        if (!db) {
            throw { statusCode: 400, message: "Internal Error occured...." };
        }

        if (!getProfile) {
            throw { statusCode: 400, message: `User profile doesn't exist ${userName}` }
        }

        return { success: true, ...getProfile }
    },

    getUserProfileByEmail: async (email) => {
        const db = await getDBConnection();
        const getProfile = await db.collection("profile").findOne({ email: email  });

        if (!db) {
            throw { statusCode: 400, message: "Internal Error occured...." };
        }

        if (!getProfile) {
            throw { statusCode: 400, message: `User profile doesn't exist ${email}` }
        }

        return { success: true, ...getProfile }
    },

    createProfile: async (firstName, lastName, userName, email) => {
        if (!firstName || !lastName || !userName || !email) {
            throw { statusCode: 400, message: "All fields are required." };
        }

        const db = await getDBConnection();
        const insertProfile = await db.collection("profile").insertOne({ firstName, lastName, userName, email, bio: null, location: null, numberOfPosts: null, freinds: null, followers: null });

        if (!db) {
            throw { statusCode: 400, message: "Internal Error occured...." };
        }

        if (!insertProfile) {
            throw { statusCode: 400, message: "User profile not found" };
        }

        const getProfile = await module.exports.getUserProfile(userName);
        return { success: true, ...getProfile };
    },

    loginUser: async (userName, password) => {
        if (!userName || !password) {
            throw { statusCode: 400, message: "Please define both username and password." };
        }

        const doesUserNameExist = await module.exports.getUser(userName);

        if(!doesUserNameExist.userName){
             throw { statusCode: 400, message: "Username or password doesnt exist!" };
        }

        const doesUserPasswordMatch = await module.exports.validateUserPassword(password, doesUserNameExist.password);

        if(!doesUserPasswordMatch){
            throw { success: false, message: "Username or passwrod doesnt exist!" };
        }

        console.log("USEr exists!");
        const getUserProfile = await module.exports.getUserProfile(userName);
        return getUserProfile;
    },

    registerUser: async (firstName, lastName, userName, email, password) => {

        if (!firstName || !lastName || !userName || !email || !password) {
            throw { statusCode: 400, message: "All fields are required." };
        }

        await module.exports.checkValidUsername(userName);
        await module.exports.checkValidEmail(email);
        await module.exports.checkValidPassword(password);

        const doesUserExist = await module.exports.getUser(userName);
        const doesEmailExist = await module.exports.getUserByEmail(email);

        if(doesUserExist && doesUserExist.userName){
            throw { statusCode: 400, message: `Username arleady exists! ${userName}` };
        }

        if(doesEmailExist && doesEmailExist.email){
            throw { statusCode: 400, message: `Email arleady exists! ${email}` };
        }

        const hashPassword = await bcrypt.hash(password, 12);

        const db = await getDBConnection();
        const insertUser = await db.collection("users").insertOne({ firstName: firstName, lastName: lastName, userName: userName, email: email, password: hashPassword });

        if (!db) {
            throw { statusCode: 400, message: "Internal Error occured...." };
        }

        if (!insertUser) {
            throw { success: false, message: "Unable to create user" };
        }

        return { success: true, ...insertUser };
    },
}