const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

exports.login = function(req, res) {
    let user = new User(req. body)
    user.login().then(function(result){
        req.session.user = {username:user.data.username, avatar: user.avatar,_id: user.data._id}
        req.session.save(function(){
            res.redirect("/")
        })

    }).catch(function(err){
        req.flash('errors',err)
        req.session.save(function(){
            res.redirect("/")
        })
        
    })
}

exports.logout = function(req, res) {
    req.session.destroy(function(){
        res.redirect("/")
    })
    
}

exports.register = function(req, res) {
    let user = new User(req.body)
    user.register().then(()=>{
        req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
        req.session.save(function(){
            res.redirect("/")
        })
    }).catch((regErrors)=>{
        regErrors.forEach(function(item){
            req.flash('regErrors', item)
        })
        req.session.save(function(){
            res.redirect("/")
        })
    })
    
}

exports.home = function(req, res) {
    if(req.session.user){
        res.render("home-dashboard")
    }else{
        res.render("home-guest", {regErrors: req.flash("regErrors")})
    }
    
}

exports.checkLogin = function(req, res, next) {
    if(req.session.user){
        next()
    }else{
        req.flash("errors", "You must be logged in to perform that action!")
        req.session.save(function(){
            res.redirect("/")
        })
    }
}

exports.userExists = function(req, res, next){
    User.findByUsername(req.params.username).then(function(userDocument){
        req.profileUser = userDocument
        next()
    }).catch(function(){
        res.render("404")
    })
}

exports.profilePostScreen = function(req, res){
    
    Post.findByAuthorId(req.profileUser._id)
    .then(function(posts){    
        res.render("profile",{
            username: req.profileUser.username,
            currentPage: "posts",
            avatar: req.profileUser.avatar,
            posts: posts,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postsCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }).catch(function(){
        
        res.render("404")
    })

}

exports.profileFollowersScreen = async function(req, res){
    
    try{
        let followers = await Follow.getFollowersById(req.profileUser._id)
        
        
        res.render("profile-followers", {
            username: req.profileUser.username,
            currentPage: "followers",
            followers: followers,
            avatar: req.profileUser.avatar,    
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postsCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }catch(e){
        res.render("404")
    }
}

exports.profileFollowingScreen = async function(req, res){
    
    try{
        let following = await Follow.getFollowingById(req.profileUser._id)
        
        
        res.render("profile-following", {
            username: req.profileUser.username,
            currentPage: "following",
            following: following,
            avatar: req.profileUser.avatar,    
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postsCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }catch(e){
        res.render("404")
    }
}

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsProfile = false;
    let isFollowing = false;

    if(req.session.user){
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    }
    
    req.isVisitorFollowing = isVisitorsProfile
    req.isFollowing = isFollowing

    //retrive posts, followers, following count
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id)
    //array destructioring results will be returned to said value
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
    
    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount

    next()
}