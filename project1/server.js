const dotenv = require('dotenv').config();
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const app = express();
const cors = require('cors');
const http = require('http').Server(app);
require('./config/db.config');

// let mongoose    = require('mongoose');
let multer      = require('multer');
let csvModel    = require('./model/question');
let csv         = require('csvtojson');
let bodyParser  = require('body-parser');

let storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./public/uploads');
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
});

let uploads = multer({storage:storage});

const upload = multer({ dest: './public/uploads/' })
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});


//fetch data from the request
// app.use(bodyParser.urlencoded({extended:false}));

//static folder
app.use(express.static(path.resolve(__dirname,'public')));

app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    useTempFiles : true,
}));

app.use(cors());

////////////// Configuration //////////////
app.set('views',__dirname + '/views');
app.set('vew engine', 'ejs');



app.engine('html', require('ejs').renderFile);
app.use(express.json()); // parse form data client
app.use(express.urlencoded({ extended: true }));
// // configure express to use public folder for app front end
// app.use('/app-property',express.static(path.join(__dirname, 'public')));



//////////// Routes Start //////////////
app.get('/', (req, res) => {
    res.send("Welcome to RGrow User Website API. nov 16th 6:00");
});
app.use('/api', require('./routes/api'));
//////////// Routes End //////////////




app.post('/uploadcsv/',upload.single('csv'),(req,res)=>{
    //convert csvfile to jsonArray   
    
    // console.log("hi");
    // console.log(req);
    // console.log(req.body);
    csv()
    .fromFile(req.file.path)
    .then((jsonObj)=>{
        // console.log(jsonObj);
        for(let x=0;x<jsonObj.length;x++){
            jsonObj[x].Category_id=req.body.Category_id;
        }
        // console.log(jsonObj);

        csvModel.insertMany(jsonObj,(err,data)=>{
            if(err){
                console.log(err);
            }else{
                // console.log(data);
                return res
                .status(200)
                .json({ status: "success",data: data })
            }
        });
    });
});


http.listen(process.env.PORT, () => {
    console.log(`Server running on port : http://localhost:${process.env.PORT}`);
    // console.log(`Branch  : ${process.env.BRANCH}`);
});