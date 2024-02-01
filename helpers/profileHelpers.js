const getDBConnection = require("../db/conn.js");

module.exports = {
    editProfile: async (originalUserName, userName, firstName, lastName, location, bio) => {
        const db = await getDBConnection();

        if(!db){
            throw { statusCode: 400, message: "Internal Error occured...." };        
        }

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

        if(editProfileCollection.ok === 0){
            throw { statusCode: 400, message: editUserCollection.err };
        }

        console.log("EDIT PROFILE VALUE");
        console.log(editProfileCollection.value);

        return editProfileCollection.value;
    }
}



