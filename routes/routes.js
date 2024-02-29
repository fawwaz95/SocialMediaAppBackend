const express = require("express");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const {v2: cloudinary} = require("cloudinary");
const { v4: uuidv4 } = require('uuid');

const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const { getUser, getUserProfile, createProfile, registerUser, loginUser } = require("../helpers/loginHelpers");
const { editProfile } = require("../helpers/profileHelpers");
const router = express.Router();


          
cloudinary.config({ 
  cloud_name: 'digzdsqjz', 
  api_key: '349114513971677', 
  api_secret: 'fPRkdAbwaVwtFhOb8VQUSabbDII' 
});

router.get("/getUsers", async (req, res) => {
  const db = await getDBConnection();
  const usersCollection = await db.collection("users");
  const results = await usersCollection.find({}).toArray();
  res.json(results).status(200);
});

router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const login = await loginUser(userName, password);

    console.log("User profile.....");
    console.log(login);

    res.status(200).json(login)
  } catch (error) {
    console.error(error.statusCode + " " + error.message);
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
});

router.post("/register", async (req, res) => {
  try {
    await data();
    const { firstName, lastName, userName, email, password } = req.body;
    
    await registerUser(firstName, lastName, userName, email, password);
    await createProfile(firstName, lastName, userName, email);
    const userProfile = await getUserProfile(userName);
    return res.status(200).json(userProfile);

  } catch (error) {
    console.error(error.statusCode + " " + error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});


router.post("/editProfile", async (req, res) => {
  try{
   
    const {findUser, userName, firstName, lastName, location, bio} = req.body;
    console.log("what is find user");    
    console.log(findUser); 
    
    const getUserInfo = await getUser(findUser);
    console.log("getUserInfo");
    console.log(getUserInfo);
    const editUserProfile = await editProfile(getUserInfo.userName, userName, firstName, lastName, location, bio);
    console.log("editUserProfile");
    console.log(editUserProfile);

    return res.status(200).json(editUserProfile);

  }catch(error){
    console.error(error.statusCode + " " + error.message);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
})

router.post("/fileUpload", upload.single('file'), async (req, res) => {
  console.log("Uploaded file: ", req.file);
  console.log("Uploaded email: ", req.body.email);

  const uuid = uuidv4();

    //Overwrite existing cloudinary.uploader.upload_stream object attributes
    const uploadOptions = {
      public_id: `${req.body.email}-${uuid}`,  //Unique id for pictures
      folder: 'User_Uploads',     //Folder with all user uploads
    };

  cloudinary.uploader.upload_stream(
    uploadOptions,
    (error, result) => {
      if (error) {
        console.error("Error uploading file to Cloudinary:", error);
        return res.status(500).json({ error: 'Failed to upload file to Cloudinary' });
      }
      console.log("Upload result:", result);
      res.status(200).json({ message: 'File uploaded successfully', cloudinaryResult: result });
    }
  ).end(req.file.buffer);
});


router.get("/getUserUploads", async (req, res) => {
  const email = req.query.email;

  try {
    const result = await cloudinary.search
      .expression(`folder:User_Uploads AND filename:${email}`)
      .execute();

    if (result.resources.length === 0) {
      return res.status(404).send("No uploads found for this user.");
    }

    //console.log("FUll results...");
    //console.log(result);

   const getAllUploads = result.resources.map(arrayItems => {
      return {
        url: arrayItems.url,
        upload_date: arrayItems.uploaded_at
      }
    });

    console.log("DO we have an array of uplaods?");
    console.log(getAllUploads);


    return res.status(200).send(getAllUploads);
  } catch (error) {
    console.error('Error fetching images:', error);
    return res.status(500).send("An error occurred while fetching user uploads.");
  }
});



module.exports = router;
