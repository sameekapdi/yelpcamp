var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'sameekapdi', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);




// INDEX - 
router.get("/", function(req,res) {
    var noMatch;
    //fuzzy search
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                if(allCampgrounds.length < 1){
                    noMatch = "Could not find a campground with that name";
                } else {
                    noMatch = "Search results";
                }
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", noMatch: noMatch});
            }
        });
    } else { // render all campgrounds
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", noMatch: noMatch});
            }
        });
    }
    
});

// NEW
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

// CREATE - 
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res){
    var name = req.body.name;
    var cost = req.body.cost;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, function(err, data){
        if(err || !data.length){
            req.flash("error", "Invalid Address");
            return res.redirect("back");
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        
        cloudinary.v2.uploader.upload(req.file.path,{moderation: "webpurify"}, function(err, result){
            if(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
            var image = result.secure_url;
            var imageId = result.public_id;
            
            var newCampground = {name: name, image: image, imageId: imageId, cost: cost, location: location, lat: lat, lng: lng, description: description, author: author};
            // Create new campground and add to database
            Campground.create(newCampground, function(err, campground){
                if(err){
                    req.flash('error', err.message);
                    return res.redirect('back');
                } else {
                    res.redirect("/campgrounds/" + campground.id);
                }
            });
        });
    });
});

// SHOW
router.get("/:id", function(req, res){
    //find campground by id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
    
});

//EDIT
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
        Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});

//UPDATE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
    geocoder.geocode(req.body.campground.location, function(err, data){
        console.log(err);
        if(err || !data.length){
            req.flash("error", "Invalid Address");
            return res.redirect("back");
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        Campground.findById(req.params.id, async function(err, campground){
            if (err){
                req.flash("error", err.message);
                return res.redirect("back");
            } else {
                if (req.file){
                    try{
                        await cloudinary.v2.uploader.destroy(campground.imageId);
                        var result = await cloudinary.v2.uploader.upload(req.file.path,{moderation: "webpurify"});
                        campground.image = result.secure_url;
                        console.log(campground.image);
                        campground.imageId = result.public_id;
                    }
                    catch (err){ 
                            req.flash("error", err.message);
                            return res.redirect("back");
                    }
                }
                console.log(campground);
                campground.name = req.body.campground.name;
                campground.description = req.body.campground.description;
                campground.cost = req.body.campground.cost;
                campground.save();
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + req.params.id);
                
            }
        });
    });
});

//DESTORY
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try{
            await cloudinary.v2.uploader.destroy(campground.imageId);
            campground.remove();
            req.flash("success", "Campground deleted succesfully");
            res.redirect("/campgrounds");
        }
        catch(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;