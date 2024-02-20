const express = require("express");
const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const router = express.Router();
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { getUser, getUserProfile, createProfile, registerUser, loginUser } = require("../helpers/loginHelpers");
const { editProfile } = require("../helpers/profileHelpers");


const {v2: cloudinary} = require("cloudinary");
          
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
  console.log("Uploaded file:", req.file);

    req.file.email = "fawwaz_95@hotmail.com";

    // Customize Cloudinary upload options
    const uploadOptions = {
      public_id: 'find_me',
      original_filename: req.file.originalname,
      //folder: 'custom_folder',
    };

  cloudinary.uploader.upload_stream(
    //{ resource_type: 'auto' }, // Let Cloudinary detect the file type
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



  /*console.log("Uploaded file:", req.file);

  cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { 
    public_id: "uploaded",
    original_filename: "the_original"
  }, 
  function(error, result) {console.log(result); });

  res.status(200).json({ message: 'File uploaded successfully' });*/
});



module.exports = router;
