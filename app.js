if(process.env.NODE_ENV != "production")
{
    require('dotenv').config();
}



const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing =require("./models/listing.js");
const path = require("path");
const methodOverride =require("method-override");
const ejsMate=require('ejs-mate');
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
const Review = require("./models/review.js");
const session= require("express-session");
const MongoStore = require('connect-mongo');
const flash =require("connect-flash");
const passport=require("passport");
const LocalStrategy = require("passport-local");
const User=require("./models/user.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");


//CONNECTING DB
// const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

const dbUrl=process.env.ATLASDB_URL;

main()
  .then(()=>{console.log("connected to db");})
  .catch((err)=>{console.log(err);});

async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
// mongo store
const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
})

store.on("error",()=>{
    console.log("error in mongo session store",err);
})

const sessionOptions=
{   store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now()+ 7*24*60*60*1000,
        maxAge:  7*24*60*60*1000,
        httpOnly:true,// for security purpose(prevents from cross_scripting attacks);
    },
};

//Creating API at root route
// app.get("/",(req,res)=>{
//     res.send("Hi I am Root");
// });

// sessions
app.use(session(sessionOptions));
app.use(flash());

// implementing passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.curUser=req.user;
    next();
})

//  app.get("/demouser",async(req,res)=>{
//      let fakeUser = new User({
//          email:"student@gmail.com",
//          username:"delta-student",
//      });
//    let registeredUser= await User.register(fakeUser,"helloworld");
//    res.send(registeredUser);
//  });

// Listings Restructured using express router
app.use("/listings",listingRouter);

// Reviews restructured using express router
app.use("/listings/:id/reviews",reviewRouter);

// User model restructured using express router
app.use("/",userRouter);



//-------------------------------------------------------------


// app.get("/testListing",async (req,res)=>{
//     let sampleListing = new Listing({
//         title:"My new Villa",
//         description:"By the beach",
//         price:1200,
//         location:"Calangute ,Goa",
//         country:"India",
//     });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("succesfull testing");
// });
app.all("*",(req,res,next)=>
{
    next(new ExpressError(404,"Page Not Found!!"));
});

app.use((err,req,res,next)=>
{let {statusCode=500,message="Something Went Wrong!!"}=err;
//res.status(statusCode).send(message)
//res.send("something went wrong!");
res.status(statusCode).render("error.ejs",{err});
});

//Setting up the server at port 8080
const port =8080;
app.listen(port,()=>{
    console.log(`server is listening to port ${port}`);
});
