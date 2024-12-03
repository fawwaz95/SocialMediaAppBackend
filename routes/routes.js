const express = require("express");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const {v2: cloudinary} = require("cloudinary");
const { v4: uuidv4 } = require('uuid');

const getDBConnection = require("../db/conn.js");
const data = require("../db/data.js");
const { getUser, getUserProfileByEmail, getUserProfile, createProfile, registerUser, loginUser } = require("../helpers/loginHelpers");
const { editProfile, getProfileInfo} = require("../helpers/profileHelpers");
const { addFriendHelper, getFollowingFollowersHelper, unFollowUserHelper, removeFollowerHelper, userLikedPost, getLikedPosts } = require("../helpers/generalHelpers");
const { ReturnDocument } = require("mongodb");
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

    console.log("User profile....");
    console.log(login);

    res.status(200).json(login)
  } catch (error) {
    console.error(error.statusCode + "  " + error.message);
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
});

router.post("/register", async (req, res) => {
  try {
    //await data();
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

router.get("/getProfileInfo", async (req, res) => {
  try{ 
    const {userName} = req.query;
    console.log("userName from fornt end");    
    console.log(userName); 
    

    const profileInfo = await getProfileInfo(userName);
    console.log("profileInfo end........");
    console.log(profileInfo);

    return res.status(200).json(profileInfo);

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
        console.error("Error uploading file to Cloudinary: ", error);
        return res.status(500).json({ error: 'Failed to upload file to Cloudinary' });
      }
      console.log("Upload result:", result);
      res.status(200).json({ message: 'File uploaded successfully', cloudinaryResult: result });
    }
  ).end(req.file.buffer);
});


router.get("/getAllUserUploads", async (req, res) => {
  const email = req.query.email;

  try {
    const result = await cloudinary.search
      .expression(`folder:User_Uploads`)
      //.expression(`folder:User_Uploads AND filename: ${email}`)
      .execute();

    if (result.resources.length === 0) {
      return res.status(200).send({message:"No Posts Yet../.."});
    }

    const getUserUploads = await result.resources
        .filter(arrayItems => arrayItems.filename.includes(email))
        .map(arrayItems => ({
            url: arrayItems.url,
            upload_date: arrayItems.uploaded_at
        }));
        
    return res.status(200).send(getUserUploads);

  } catch (error) {
    console.error('Error fetching images:', error);
    return res.status(500).send("An error occurred while fetching user uploads. ");
  }
});

router.get("/getUserUpload", async (req, res) => {
  const postId = req.query.publicId;
  try {
    const result = await cloudinary.search
      .expression(`User_Uploads AND public_id=${postId}`)
      .execute();

    if (result.resources.length === 0) {
      return res.status(404).send({message:"Can't find users post with the following postId "});
    }

   const getAllUploads = await result.resources.map(arrayItems => {
      return {
        url: arrayItems.url,
      }
    });

    return res.status(200).send(getAllUploads);
  } catch (error) {
    console.error('Error fetching images: ', error);
    return res.status(500).send("An error occurred while fetching user uploads.");
  }
});

router.get("/getNewsfeed", async (req, res) => {
  console.log("Calling getNewsfeed route..........");

  try {
    console.log("Try calling User_Uploads..........");
    const result = await cloudinary.search
                  .expression(`User_Uploads`)
                  .execute();

    if(result.resources.length === 0){
      return res.status(404).send({message:"Unable to fetch Newsfeed"});
    }

    console.log("Entire newsfeed obj:");
    console.log(result);

    const newsfeedData = await Promise.all(result.resources.map(async (item) => {
      try {
        const userInfo = await getUserProfileByEmail(item.filename.split("-")[0]);
        const {userName, location} = userInfo;
        return {
          userName,
          location,
          uploadDate: item.uploaded_at,
          url: item.url,
        };
      } catch (error) {
        console.error("Error fetching user info:", error);
        return {
          userInfo: null,
          uploadDate: item.uploaded_at,
          url: item.url,
        };
      }
    }));

    console.log("Check if userInfo is here now....");
    console.log(newsfeedData);

    return res.status(200).send(newsfeedData);

  } catch (error) {
    console.error('Error fetching Newsfeed: ', error); 
    return res.status(500).send("An error occurred while fetching Newsfeed. ");
  }
});

router.post("/likedPost", async (req, res) => {
  console.log("Calling likedPost route..........");
  console.log(req.body);
  try{
    const likedPost = {
           url: req.body.likedPost.url, 
           likedBy: req.body.likedPost.likedBy
     };
    
    console.log("url:", likedPost.url);
    console.log("Liked by:", likedPost.likedBy);

    const addLikeToPost = await userLikedPost(likedPost.url, likedPost.likedBy);

    console.log("Returning addLikeToPost:");
    console.log(addLikeToPost);

    return res.status(200).send(addLikeToPost);

  }catch(error){
    console.error('Error in likedPost route: ', error); 
    return res.status(500).send("Unable to like the post");
  }

});

router.get("/getLikedPosts", async (req, res) => {
  console.log("Calling getLikedPosts route..........");
  try{
    const likedPosts = await getLikedPosts();
    return res.status(200).send(likedPosts);
  }catch(error){
    console.error('Error in getLikedPosts route: ', error);
  }
})

router.post("/followFriend", async (req, res) => {
  console.log("Calling followFriend route.........");
  //console.log(req.body);

  try{
    const addFriendToProfile = {
      userName: req.body.userName,
      friendUserName: req.body.friendUserName,
    } 
  
    const addFriend = addFriendHelper(addFriendToProfile);
  
    return res.status(200).send(addFriend);
  }catch(error){
    console.error('Error in followFriend: ', error); 
    return res.status(500).send("Unable to add Friend");
  }

})

router.get("/getFollowingFollowers", async (req, res) =>{
  console.log("Calling getFollowing route..........");
  console.log(req.query);
  try{
    const getFollowingAndFollowers = await getFollowingFollowersHelper(req.query.user_id);

    console.log("getFollowingAndFollowers result.......");
    console.log(getFollowingAndFollowers); 

    return res.status(200).send(getFollowingAndFollowers);
  }catch(error){
    console.error('Error in getFollowing: ', error);
    return res.status(500).send("Unable to get Following or Followers users");
  }
})

router.delete("/unFollowUser", async(req, res) => {
  console.log("Calling unFollowUser route..........");
  console.log(req.query);
  try{
    const unfollowUserRes = await unFollowUserHelper(req.query.user_id, req.query.friend_id);
    return res.status(200).send(unfollowUserRes);

  }catch(error){
    console.error('Error in unFollowUser: ', error);
    return res.status(500).send("Unable to unFollow user.....");
  }
})

router.delete("/removeFollower", async(req, res) => {
  console.log("Calling removeFollower route..........");
  console.log(req.query);
  try{
    const removeFollower = await removeFollowerHelper(req.query.user_id, req.query.friend_id);
    return res.status(200).send(removeFollower);
  }catch(error){
    return res.status(500).send("Unable to Remove Follower....")
  }
})


module.exports = router;
