const getDBConnection = require("./conn.js");

const data = async () => {
    try {
      const db = await getDBConnection();
      const usersCollection = await db.collection("users");
      const userRecords = [
        {
          _id: "USER0001",
          firstName: "John",
          lastName: "Doe",
          userName: "JohnDoe",
          email: "fawwaz.ahmad@zcomsystems.com",
          password: "password"
        },
      ];

      const delRecord = {};
      const del = await usersCollection.deleteMany(delRecord);
      console.log(`${del.deletedCount} documents deleted`);
      const result = await usersCollection.insertMany(userRecords);
      console.log(`${result.insertedCount} documents inserted`);
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  }

  module.exports = data;
