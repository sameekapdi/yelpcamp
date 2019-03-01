var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
    {
        name: "Granite Hill",
        image: "https://images.unsplash.com/photo-1537565266759-34bbc16be345",
        description: "Beautiful camping grounds amongst the trees",
        author: {
            id: "588c2e092403d111454fff76",
            username: "Shakespeare"
        }
    },
    {
        name: "Salmon Creek", 
        image: "https://images.unsplash.com/photo-1471115853179-bb1d604434e0",
        description: "Amazing view overlooking the creek",
        author: {
            id: "588c2e092403d111454fff71",
            username: "Homer"
        }
    },
    {
        name: "Mountain Rest",
        image: "https://farm1.staticflickr.com/82/225912054_690e32830d.jpg",
        description: "Superb scenic view surrounded by mountains",
        author: {
            id: "588c2e092403d111454fff77",
            username: "Sun Tzu"
        }
    }
]

function seedDB(){
    Campground.deleteMany({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed all campgrounds");
        Comment.deleteMany({}, function(err){
            if(err){
                console.log(err);
            }
            console.log("removed all comments");
            data.forEach(function(seed){
                Campground.create(seed, function(err, campground){
                    if(err){
                        console.log(err);
                    } else {
                        console.log("added a campground");
                        Comment.create(
                            {
                                text: "Wow! What a fantastic place! Can't wait to come again next year.",
                                author: {
                                    id: "588c2e092403d111454fff76",
                                    username: "Shakespeare"
                                }
                            }, function(err, comment){
                                if(err){
                                    console.log(err);
                                } else{
                                    campground.comments.push(comment);
                                    campground.save();
                                    console.log("added a comment");
                                }
                            });
                    }
                }); 
            });
        });
    });
}

module.exports = seedDB;