require("dotenv").config();
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride = require("method-override");
var Comment = require("./models/comment");
var Campground = require("./models/campground");
var User = require("./models/user");
var seedDB = require("./seeds");

var indexRoutes = require("./routes/index");
var campgroundsRoutes = require("./routes/campgrounds");
var commentsRoutes = require("./routes/comments");

var dbURL = process.env.DATABASEURL || "mongodb://localhost:27017/yelp_camp";
mongoose.connect(dbURL, {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");

//Passport Config
app.use(require("express-session")({
    secret: "This is the most secure passphrase in the world",
    resave:false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundsRoutes);
app.use("/campgrounds/:id/comments", commentsRoutes);

//seedDB();


//=============================
app.get("*", function(req,res){
   res.send("404 WRONG TURN"); 
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started.");
});
