const getDBConnection = require("../db/conn.js");

module.exports = {
    addFriendHelper: async (friendObj) => {
        console.log("addFriendHelper: ");
        //console.log(friendObj);

        if (!friendObj || !friendObj.userName || !friendObj.friendUserName) {
            throw { success: false, message: "Invalid input: userName and friendUserName are required " };
        }

        try {
            const doesFriendExist = await module.exports.existingFriend(friendObj);

            if (doesFriendExist.success === false) {
                console.log(doesFriendExist.message);
                //throw { success: doesFriendExist.success, message: doesFriendExist.message };
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
        try {
            const db = await getDBConnection();

            if(friendObj.userName === friendObj.friendUserName){
                return { success: false, message: "Can't add self as a friend"};
            }

            const result = await db.collection("following").findOne({
                user_id: friendObj.userName,
                friend_id: friendObj.friendUserName
            });

            console.log("RESULT");
            console.log(result);

            if (result) {
                console.log("Found matching record... don't insert into table ");
                return { success: false, message: "Friend already exists" };
            } else {
                console.log("No matching record found... insert into table");
                return { success: true, message: "No matching record found... insert into table" };
            }
        } catch (error) {
            console.log(error);
            return { success: false, message: "Error checking existing friend" , error: error };
        }
    },

    getFollowingFollowersHelper: async (userName) => {
        console.log("getFollowingFollowersHelper");

        try{
            const db = await getDBConnection();
            //toArray returns a promise so must await and wait for the response in order to .map it directly
            const followingUsernames = (await db.collection("following").find({ user_id: userName }).toArray())
                                        .map(items => items.friend_id);
            const followersUsernames = (await db.collection("following").find({friend_id: userName}).toArray())
                                        .map(items => items.user_id);

            console.log("Following user ids");
            console.log(followingUsernames);

            console.log("Followers user ids");
            console.log(followersUsernames);

            const followingFollowersData = {
                following: followingUsernames,
                followers: followersUsernames
            };

            if(followingUsernames.length > 0 || followersUsernames.length > 0){
                return { success: "Found all following and followers", followingFollowersData};
            }else{
                return { success: false, message: "No following and followers found" };
            }
        }catch(error){
            console.log(error);
            return { success: false, message: "Error fetching following", error: error };
        }
    }
}
