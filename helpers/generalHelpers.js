const getDBConnection = require("../db/conn.js");

module.exports = {
    addFriendHelper: async (friendObj) => {
        console.log("addFriendHelper: ");

        if (!friendObj || !friendObj.userName || !friendObj.friendUserName) {
            throw { success: false, message: "Invalid input: userName and friendUserName are required " };
        }

        try {
            const doesFriendExist = await module.exports.existingFriend(friendObj);

            if (doesFriendExist.success === false) {
                console.log(doesFriendExist.message);
                return { success: doesFriendExist.success, message: doesFriendExist.message };
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
    },

    unFollowUserHelper: async(userId, unfollowUserId) => {
        console.log("unFollowUserHelper");
        console.log(" userId " + userId + " unfollowUserId " + unfollowUserId);
        try{
            const db = await getDBConnection();
            const deleteRecord = await db.collection("following").deleteOne({
                user_id: userId,
                friend_id: unfollowUserId
            });

            if (deleteRecord.deletedCount === 1) {

                const unFollowResult = {
                    message: `Successfully removed user ${unfollowUserId} from account ${userId}`,
                    unFollowed: unfollowUserId,
                };

                return { success: true, ...unFollowResult};
            } else {
                return { success: false, message: `Failed to remove user ${unfollowUserId}` };
            }
        }catch(error){
            console.log(error);
            return { success: false, message: "Error in unFollowUserHelper", error: error };
        }
    },

    removeFollowerHelper: async(userAccount, removeUser) => {
        console.log("removeFollower");

        try{
            const db = await getDBConnection();
            const deleteRecord = await db.collection("following").deleteOne({user_id: removeUser, friend_id: userAccount});

            console.log("deleteRecord");
            console.log(deleteRecord);

            if (deleteRecord.deletedCount === 1) {

                const removeResult = {
                    message: `Successfully removed user ${removeUser} from account ${userAccount}`,
                    removedUser: removeUser,
                };

                return{success: true, ...removeResult}
            }else{
                return { success: false, message: `Failed to remove follower ${removeUser}` };
            }
        }catch(error){
            console.log(error);
            return { success: false, message: "Error in removeFollower", error: error };
        }
    },

    userLikedPost: async(url, likedBy) => {
        console.log("userLikedPost");
        try {
            const db = await getDBConnection();
            const updatedPost = await db.collection("likedPost").findOneAndUpdate(
                { url: url }, // Query: Find the record with the matching URL
                { $addToSet: { likes: likedBy } }, // Update: Add `likedBy` to the `likes` array if it's not already present
                { new: true, upsert: true } // Options: `new: true` returns the updated document; `upsert: true` creates a new document if it doesn't exist
            );

            const response = {
                success: true,
                data: {
                    url: updatedPost.value.url,
                    likes: updatedPost.value.likes,
                },
            };

            return { success: response.success, ...response };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Failed to interact with post" };
        }
    }
}
