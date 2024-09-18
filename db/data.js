const getDBConnection = require("./conn.js");

const data = async () => {
    try {
      const db = await getDBConnection();
      const usersCollection = await db.collection("users");
     // const profileCollection = await db.collection("profile");
      const userRecords = [
        {
          _id: "USER0001",
         // firstName: "John",
          lastName: "Doe",
          userName: "JohnDoe",
          email: "fawwaz.ahmad@zcomsystems.com",
          password: "password"
        },
      ];

      /*const delAll = {};
      const del = await usersCollection.deleteMany(delAll);
      console.log(`${del.deletedCount} documents deleted for users collection`);

      const delProfiles = await profileCollection.deleteMany(delAll);
      console.log(`${delProfiles.deletedCount} documents deleted for profile collection`);
      
      const result = await usersCollection.insertMany(userRecords);
      console.log(`${result.insertedCount} documents inserted`);*/
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  }

  module.exports = data;
