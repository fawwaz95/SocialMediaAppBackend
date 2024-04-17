const { MongoClient } = require("mongodb");

const url = "mongodb+srv://fawwaz:throwback@cluster.eitjutm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";
          //"mongodb+srv://fawwaz:throwback@cluster.eitjutm.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(url);
let conn;

const connectToMongoDB = async () => {
  try {
    conn = await client.connect();
    console.log("Connected to DB!");
  } catch (error) {
    console.error("Unable to connect:", error);
    throw "Internal Error occurred...please contact admin....";
  }
};

const getDBConnection = async () => {
  if (!conn) {
    await connectToMongoDB();
  }
  return conn.db("socialMedia_db");
};

module.exports = getDBConnection;
