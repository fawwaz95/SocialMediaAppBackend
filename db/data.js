const db = require("./conn.js");

const data = async () => {
    const collection = db.collection("users");
    const userRecords = [
      {
        _id: "USER0001",
        firstName: "John",
        lastName: "Doe",
        userName: "JohnDoe",
        email: "fawwaz.ahmad@zcomsystems.com",
        password:"password"
      },
    ];

    const delRecord = {};
    const del = await collection.deleteMany(delRecord);
    console.log(`${del.deletedCount} documents deleted`);
    const result = await collection.insertMany(userRecords);
    console.log(`${result.insertedCount} documents inserted`);
}

module.exports = data;
