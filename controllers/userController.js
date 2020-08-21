const User = require('../models/User')
const Post = require('../models/Post')

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
        res.render("home-guest", {errors: req.flash("errors"), regErrors: req.flash("regErrors")})
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
            avatar: req.profileUser.avatar,
            posts: posts
        })
    }).catch(function(){
        res.render("404")
    })

}