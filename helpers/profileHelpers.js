const getDBConnection = require("../db/conn.js");
const {checkValidUsername} = require("./loginHelpers");

module.exports = {

    checkValidFirstName: async (firstName) => {
        if(!firstName){
            throw { statusCode: 400, message: "First name field is mandatory" }
        }
    },

    checkValidLastName: async (lastName) => {
        if(!lastName){
            throw { statusCode: 400, message: "First name field is mandatory" }
        }
    },

    editProfile: async (originalUserName, userName, firstName, lastName, location, bio) => {
        const db = await getDBConnection();

        if(!db){
            throw { statusCode: 400, message: "Internal Error occured...." };        
        }

        await checkValidUsername(userName);
        await module.exports.checkValidFirstName(firstName);
        await module.exports.checkValidLastName(lastName);

        const editProfile = {
            $set: {
                userName: userName,
                firstName: firstName,
                lastName: lastName,
                location: location,
                bio: bio,
            },
        }

        const editUser = {
            $set: {
                userName: userName,
                firstName: firstName,
                lastName: lastName,
            },
        }

        const editProfileCollection = await db.collection("profile").findOneAndUpdate({ userName: originalUserName }, editProfile, { returnDocument: 'after' });
        const editUserCollection = await db.collection("users").findOneAndUpdate({ userName: originalUserName }, editUser, { returnDocument: 'after' } );

        if(editProfileCollection.ok === 0){
            throw { statusCode: 400, message: editProfileCollection.err };
        }

        if(editUserCollection.ok === 0){
            throw { statusCode: 400, message: editUserCollection.err };
        }

        console.log("EDIT PROFILE VALUE");
        console.log(editProfileCollection.value);

        return editProfileCollection.value;
    }
}



