const { MongoClient } = require("mongodb");

const url = "mongodb+srv://fawwaz:throwback@cluster.eitjutm.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);
let conn;

const connectToMongoDB = async () => {
  try{
    conn = await client.connect();
  }catch(error){
    console.error("Unable to connect");
  }
};

const getDBConnection = async () => {
  if (!conn) {
    await connectToMongoDB();
    console.log("Connected to DB!");
  }
  return conn.db("socialMedia_db");
};

module.exports = getDBConnection;
