const Listing=require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

//index route callback
module.exports.index= async(req,res)=>{
    //res.send("listing route working!");
    const allListings= await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};

//new route callback
module.exports.renderNewForm= (req,res)=>{
    res.render("listings/new.ejs");
};

//show route callback
module.exports.showListing=async (req,res)=>{
    let {id}=req.params;
    const listing =await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
            path:"author",
        },
    })
    .populate("owner");
    if(!listing)
    {
        req.flash("error","Listing you requested does not exist!");
        res.redirect("/listings");
         
    }
    //console.log(listing);
    res.render("listings/show.ejs",{listing});

};


//create route
module.exports.createLisitng=async (req,res,next)=>{

  let response= await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
        .send();
    let url= req.file.path;
    let filename= req.file.filename;
    //--instead of using so many if statements for individual schema item use JOI package in npm
// if(!req.body.listing)
// {
//     throw new ExpressError(400,"Send valid data for listing");
// }
 

//  if(!newListing.title)
//  {
//      throw new ExpressError(400,"Title is missing");
//  }

//  if(!newListing.description)
//  {
//      throw new ExpressError(400,"Description is missing");
//  }

//  if(!newListing.location)
//  {
//      throw new ExpressError(400,"Location is missing");
//  }

const newListing =new Listing(req.body.listing);
newListing.owner=req.user._id;
newListing.image={url,filename};
newListing.geometry= response.body.features[0].geometry ;
let savedListing= await newListing.save();
console.log(savedListing);
 req.flash("success","New Listing Created!");
 res.redirect("/listings");
};


//edit 
module.exports.renderEditForm=async (req,res)=>
{
    let {id}=req.params;
    const listing =await Listing.findById(id);
    if(!listing)
    {
        req.flash("error","Listing you requested does not exist!");
        res.redirect("/listings");
         
    }
    let originalImageUrl= listing.image.url;
    originalImageUrl= originalImageUrl.replace("/upload","/upload/w_250");
     res.render("listings/edit.ejs",{listing,originalImageUrl});
};

//update 
module.exports.updateListing=async (req,res)=>
{
let {id}=req.params;
 let listing=   await Listing.findByIdAndUpdate(id,{...req.body.listing});

 if( typeof req.file!="undefined")
 {
 let url= req.file.path;
 let filename= req.file.filename;
 listing.image={url,filename};
 await listing.save();
 }
req.flash("success","Listing Updated!");

res.redirect(`/listings/${id}`);
};

//delete
module.exports.destroyListing=async (req,res)=>
{
let {id} = req.params;
let deletedListing= await Listing.findByIdAndDelete(id);
console.log(` deleted listing is :${deletedListing}`);
req.flash("success","Listing Deleted!");

res.redirect("/listings");

};