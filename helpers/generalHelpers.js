const getDBConnection = require("../db/conn.js");

module.exports = {
    addFriendHelper: async (friendObj) => {
        console.log("addFriendHelper: ");
        console.log(friendObj);

        // Validate input
        if (!friendObj || !friendObj.userName || !friendObj.friendUserName) {
            throw { success: false, message: "Invalid input: userName and friendUserName are required" };
        }

        try {
            const doesFriendExist = await module.exports.existingFriend(friendObj);

            if (doesFriendExist.success === false) {
                throw { success: doesFriendExist.success, message: doesFriendExist.message };
            }

            const db = await getDBConnection();
            const result = await db.collection("following").insertOne({
                user_id: friendObj.userName,
                friend_id: friendObj.friendUserName,
            });

            return { success: true, ...result };
        } catch (err) {
            throw { success: false, message: "Error adding friend", error: err };
        }
    },

    existingFriend: async (friendObj) => {
        console.log("existingFriend");
        try {
            const db = await getDBConnection();
            const result = await db.collection("following").findOne({
                user_id: friendObj.userName,
                friend_id: friendObj.friendUserName
            });

            if (result) {
                console.log("Found matching record... don't insert into table");
                return { success: false, message: "Friend already exists" };
            } else {
                console.log("No matching record found... insert into table");
                return { success: true, message: "No matching record found... insert into table" };
            }
        } catch (error) {
            console.log(error);
            return { success: false, message: "Error checking existing friend", error: error };
        }
    },

    getFollowingHelper: async (userName) => {
        console.log("getFollowingHelper");

        try{
            const db = await getDBConnection();
            const result = await db.collection("following").find({user_id: userName}).toArray();
            const totalFollowing = result.map(items => items.friend_id);
            console.log("All Following");
            console.log(totalFollowing);

            if(result.length > 0){
                return { success: "Found all following users", totalFollowing};
            }else{
                return { success: false, message: "No following users found" };
            }
        }catch(error){
            console.log(error);
            return { success: false, message: "Error fetching following", error: error };
        }
    }
}
