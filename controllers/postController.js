const Post = require('../models/Post')

exports.viewCreateScreen = function(req, res) {
    res.render("create-post")
}

exports.create = function(req, res){
    
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function(id){
        req.flash("success", "Post created successfully!")
        req.session.save(()=> res.redirect(`/post/${id}`))
    }).catch(function(errors){
        errors.forEach(error => req.flash("error", error))
        req.session.save(() => res.redirect("/create-post"))
    })
}

exports.apiCreate = function(req, res){
    
    let post = new Post(req.body, req.apiUser._id)
    post.create().then(function(id){
        res.json("Congrats, post created!")
    }).catch(function(errors){
        res.json(errors)
    })
}


exports.viewSingle = async function(req, res){
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render("single-post-screen", {post: post, title: post.title})
    }catch{
        res.render("404")
    }
    
}

exports.viewEditSingle = async function(req, res){
    
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        
        if (post.isVisitorOwner) {
          res.render("edit-post", {post: post})
        } else {
          req.flash("errors", "You do not have permission to perform that action.")
          req.session.save(() => res.redirect("/"))
        }
      } catch {
        res.render("404")
      }
}

exports.edit = function(req, res){
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update().then(function(status){
        if(status == "success"){
            req.flash("success", "Post was successfully updated!")
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }else{
            post.errors.forEach(function(error){
                req.flash("errors", error)
            })
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(function(){
        req.flash("errors", "You do not have permission to perform that action")
        req.session.save(function(){
            res.redirect("/")
        })
    })
}

exports.delete = function(req, res){
    Post.delete(req.params.id, req.visitorId).then(()=>{
        req.flash("success","Post successfully deleted")
        req.session.save(()=>res.redirect("/"))
    }).catch(() => {
        req.flash("errors","You do not have permission to perform that action")
        req.session.save(()=>res.redirect("/"))
    })
}


exports.apiDelete = function(req, res){
    Post.delete(req.params.id, req.apiUser._id).then(()=>{
        res.json("success")
    }).catch(() => {
        res.json("You do not have permission to perform that action!")
    })
}

exports.search = function(req, res){
    
    Post.search(req.body.searchTerm).then((posts)=>{
        res.json(posts)
    }).catch(() => {
        res.json([])
    })
}