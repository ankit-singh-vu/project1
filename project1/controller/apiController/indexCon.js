const AWS = require('aws-sdk');
// const { admin } = require('../../config/fbConfig');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const tokens = require('../../config/tokens');
const User = require('../../model/users');
const Category = require("../../model/category");
const Question = require("../../model/question");


const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

// var multer      = require('multer');
// var path        = require('path');
// var csv         = require('csvtojson');
// var bodyParser  = require('body-parser');

// var storage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'./public/uploads');
//     },
//     filename:(req,file,cb)=>{
//         cb(null,file.originalname);
//     }
// });

// var uploads = multer({storage:storage});

module.exports = {

    userRegistration : async (req, res) => {
        try {
            const { phone,password } = req.body;
            // const { name,email,phone,password,referalCode } = req.body;
            // if((name) && (name !== "") && (email) && (email !== "") && (password) && (password !== "") && (phone) && (phone !== "")){
            if( (password) && (password !== "") && (phone) && (phone !== "")){
                // const checkUser = await User.find({ $or: [{ email: email }, { phone: phone }] });
                const checkUser = await User.find({ phone: phone });
                console.log(checkUser.length);
                if(checkUser.length === 0){
                    const user = new User({
                        // name: name,
                        // email: email,
                        phone: phone,
                        password: await bcrypt.hash(password, 10),
                        // referalCode: referalCode
                    });
                    const result1 = await user.save();
                    let result = result1.toObject();
                    delete result.password;
                    // console.log(result)
                    // delete result.data.password;
                    const accesstoken = tokens.createAccessToken(result._id);
                    const refreshToken = tokens.createRefreshToken(result._id);
                    await User.findByIdAndUpdate(result._id,{
                        refreshToken: refreshToken,
                        updatedAt: Date.now()
                    }, {new: true});

                    if(result.progileImg){
                        result.progileImg = await getSignedUrl(result.progileImg);
                    }
                    // res.status(200).json({ status: 'success', data: result, accessToken: accesstoken, refreshToken: refreshToken });
                    res.status(200).json({ status: 'success', data: result, accessToken: accesstoken});
                }else{
                    return res.status(400).json({ status: 'error', error: 'Phone number already exists' });
                }
            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },

    userLogin: async (req, res) => {
        try {
            const { username, password } = req.body;
            if(username && (username !== "") && password && (password !== "")){
                const result = await User.findOne({ $or: [{ phone: username }, { email: username }] }).lean()
                // .select("-password");
                // .select("-refreshToken");
                if(result){
                    if(result.status === 'Y'){
                        const matchResult = await bcrypt.compare(password, result.password);
                        if(matchResult === true){
                            const accesstoken = tokens.createAccessToken(result._id);
                            // const refreshToken = tokens.createRefreshToken(result._id);
                            // await User.findByIdAndUpdate(result._id,{
                            //     refreshToken: refreshToken,
                            //     updatedAt: Date.now()
                            // }, {new: true});
                            if(result.progileImg){
                                result.progileImg = await getSignedUrl(result.progileImg);
                            }
                            // return res.status(200).json({ status: 'success', data: result, accessToken: accesstoken, refreshToken: refreshToken });
                            delete result.password 

                            return res.status(200).json({ status: 'success', data: result, accessToken: accesstoken });
                        }else{
                            return res.status(400).json({ status: 'error', error: "Incorrect Password." });
                        }
                    }else{
                        return res.status(400).json({ status: 'error', error: "Sorry! account is Temporarily blocked by administrator." });
                    }
                }else{
                    return res.status(400).json({ status: 'error', error: "Sorry! No accounts found." });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', error: error.message });
        }
    },

    getUserInfo: async (req, res) => {
        try {
          const { userId } = req.params;
          if (userId && userId !== "") {
            const user = await User.findById({ _id: userId })
            .select("-password")
            .lean();
    
            if(user.progileImg){
              user.progileImg = await getSignedUrl(user.progileImg);
            }
          
    
            return res
              .status(200)
              .json({ status: "success", data: user });
          } else {
            return res
              .status(400)
              .json({ status: "error", error: "user Id missing" });
          }
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },

    editProfile: async (req, res) => {
        try {
            console.log(req)

            const {status, gender, phone, name, email, password, userId } = req.body;
            // const { name, email, password, userId } = req.body;
            if(userId && (userId !== "") && (userId !== null) && (userId !== undefined)){
                const updateData = { updatedAt: Date.now() };
                if(email && (email !== "") && (email !== undefined) && (email !== "")){
                    const checkUserEmail = await User.findOne({ 
                        $and: [
                            { _id: { $ne: userId } },
                            { $or: [{ email: email }] }
                        ]
                    });
                    if(checkUserEmail){
                        return res.status(400).json({ status: 'error', error: "Sorry! Email Id already registered." });
                    }else{
                        updateData['email'] = email;
                    }
                }
                // if(req.files && req.files.profilePic){
                //     const allowType = ['image/png', 'image/jpeg', 'image/jpg'];
                //     const uploadedFile = req.files.profilePic;
                //     updateData['progileImg'] = await fileUpload(uploadedFile,"profile-pic-"+userId,allowType);
                // }
                if(name && (name !== "") && (name !== undefined)) updateData['name'] = name;
                if(phone && (phone !== "") && (phone !== undefined)) updateData['phone'] = phone;
                if(gender && (gender !== "") && (gender !== undefined)) updateData['gender'] = gender;
                if(status && (status !== "") && (status !== undefined)) updateData['status'] = status;
                if(password && (password !== "") && (password !== undefined)) updateData['password'] = await bcrypt.hash(password, 10);
                const updateResult = await User.findByIdAndUpdate(userId,updateData, {new: true}).select("-password");
                if(updateResult){
                    if(updateResult.progileImg){
                        updateResult.progileImg = await getSignedUrl(updateResult.progileImg);
                    }
                    return res.status(200).json({ status: 'success', data: updateResult });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    },

    addCategory: async (req, res) => {
        try {
          const {
            name
          } = req.body;
          if (
            name &&
            name !== ""
          ) {
              const category = new Category({
                name:name
              });
              const result = await category.save();
              return res
              .status(200)
              .json({ status: "success", data: result });

          } else {
            return res.status(400).json({
              status: "error",
              error: "Sorry! Parameter missing.",
            });
          }
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },

    getCategoryList: async (req, res) => {
        try {
            const category = await Category.find();
            return res
            .status(200)
            .json({ status: "success", items_returned:category.length, data: category });
        } catch (error) {
            return res.status(400).json({ status: "error", error: error.message });
        }
    },  

    getQuestions: async (req, res) => {
        try {
          const { Category_id } = req.params;
          if (Category_id && Category_id !== "") {
            const question = await Question.find({ Category_id: Category_id })
            .populate("Category_id")
            .lean();
    
            return res
              .status(200)
              .json({ status: "success",items_returned: question.length , data: question });
          } else {
            return res
              .status(400)
              .json({ status: "error", error: "Category_id  missing" });
          }
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },    

    addQuestion: async (req, res) => {
        try {
            const {
                Category_id,
                name
            } = req.body;
            if(Category_id && Category_id !== ""){
                const question = new Question({
                    name:name,
                    Category_id:Category_id
                });
                const result1 = await question.save();

                return res
                .status(200)
                .json({ status: "success",data: result1 })

            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },  

    addQuestioncsv: async (req, res) => {
        try {
            const {
                Category_id,
                name
            } = req.body;
            if(Category_id && Category_id !== ""){
                const question = new Question({
                    name:name,
                    Category_id:Category_id
                });
                const result1 = await question.save();

                return res
                .status(200)
                .json({ status: "success",data: result1 })

            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },  

    // updatemany: async (req, res) => {
    //     try {
    //         let condition={}
    //         let update_data={}
    //         update_data.rating_avg="5";
    //         update_data.reviews_count=1;
    //         await Retailer.updateMany(condition, {"$set":update_data},{new: true});
    //         return res.status(200).json({ status: 'success',message: "updated succesfully"});
    //     } catch (error) {
    //         return res.status(400).json({ status: 'error', message: error.message });
    //     }
    // },
}


async function getSignedUrl(keyName){
    try {
        const s3 = new AWS.S3({
            signatureVersion: 'v4',
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        });
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: keyName
        };
        
        const headCode = await s3.headObject(params).promise();
        if(headCode){
            const signedUrl = s3.getSignedUrl('getObject', params);
            return signedUrl;
        }else{
            throw new Error('Sorry! File not found 1')
            
        }
    } catch (error) {
        if (error.code === 'NotFound' || error.code === 'Forbidden') {
            // throw new Error('Sorry! File not found 2')
            return keyName;

        }
    }
    
}

async function fileUpload(requestFile,fileName,allowType){
    try {
        return new Promise(function(resolve, reject) {
            const uploadedFile = requestFile;
            if(allowType.includes(uploadedFile.mimetype)) {
                let uploadedFileName = uploadedFile.name;
                const filenameSplit = uploadedFileName.split('.');
                const fileExtension = filenameSplit[filenameSplit.length-1];
                uploadedFileName = fileName.toLowerCase().replace(" ", "-") +'-'+ Date.now()+ '.' + fileExtension;
                fs.readFile(uploadedFile.tempFilePath, (err, uploadedData) => {
                    const params = {
                        Bucket: process.env.BUCKET_NAME,
                        Key: "images/"+ uploadedFileName, // File name you want to save as in S3
                        Body: uploadedData 
                    };
                    s3.upload(params, async (err, data) => {
                        if (err) {
                            return reject("Sorry! File upload failed. " + err.message);
                        }else{
                            resolve(data.Key);
                        }
                    });
                });
            }else{
                return reject("Sorry! Invalid File.");
            }
        });
    } catch (error) {
        return reject(error.message);
    }
}

