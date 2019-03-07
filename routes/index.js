var express = require("express");
var passport = require("passport");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");

router.get("/", function(req, res){
   res.render("landing"); 
});

//==================
//  AUTH ROUTES
//==================

router.get("/register", function(req, res){
    res.render("register", {page: "register"});
});

router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username, email: req.body.email});
    if(req.body.adminCode === process.env.ADMINCODE){
        newUser.isAdmin = true;
    }
    
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err)
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp "+user.username);
            res.redirect("/campgrounds");
        });
    });
});

router.get("/login", function(req, res){
   res.render("login", {page: "login"}); 
});

router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: 'Welcome to YelpCamp!'
    }), function(req, res){
});

router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "You have been logged out");
   res.redirect("/");
});

router.get("/users/:id", function(req, res){
   User.findById(req.params.id, function(err, foundUser){
       if(err){
           req.flash("error", "User not found");
           res.redirect("back");
       }
       Campground.find().where("author.id").equals(foundUser.id).exec(function(err, campgrounds){
           if(err){
           req.flash("error", "Campgrounds not found from user");
           res.redirect("back");
       }
       res.render("users/show", {user: foundUser, campgrounds: campgrounds});
       });
       
   }) 
});


module.exports = router;