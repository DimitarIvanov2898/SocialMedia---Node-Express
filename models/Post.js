const postsCollection = require("../db").db().collection("posts")
const ObjectId = require("mongodb").ObjectID
const User = require("./User")
const sanitize = require("sanitize-html")

let Post = function(data, userId, requestedPostId) {
    this.data = data
    this.errors = []
    this.userId = userId
    this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function() {
    if(typeof(this.data.title) != 'string'){
        this.data.title = ''
    }
    if(typeof(this.data.body) != 'string'){
        this.data.body = ''
    }
    this.data = {
        title: sanitize(this.data.title.trim(), {allowedTags: [], allowedAttributes: []}),
        body: sanitize(this.data.body.trim(), {allowedTags: [], allowedAttributes: []}),
        createdDate: new Date(),
        userId: ObjectId(this.userId)
    }
}

Post.prototype.validate = function() {
    if(this.data.title == ''){
        this.errors.push("Title can not be blank")
    }
    if(this.data.body == ''){
        this.errors.push("Body can not be blank")
    }
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()

        if(!this.errors.length){
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.ops[0]._id)
            }).catch(() => {
                this.errors.push("Db error, try again")
                reject(this.errors)
            })

        }else{
            reject(this.errors)
        }
    }) 
}

Post.prototype.update = function(){
    return new Promise(async (resolve, reject) => {
        try{
            let post = await Post.findSingleById(this.requestedPostId, this.userId)
            if(post.isVisitorOwner) {
                let status = await this.actuallyUpdate()
                resolve(status)
            }else{
                reject
            }
        }catch{
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async (resolve, reject)=>{
        this.cleanUp()
        this.validate()

        if(!this.errors.length){
            await postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, {$set:{title: this.data.title, body: this.data.body}})
            resolve("success")
        }else{
            resolve("error")
        }
    })
}

Post.postQuery = function(operations, visitorId) {
    return new Promise(async function(resolve, reject){
        let aggOperations = operations.concat([
            {$lookup: {from: "users", localField: "userId", foreignField: "_id", as: "authorDocument"}},
            {$project: {
              title: 1,
              body: 1,
              createdDate: 1,
              authorId: "$userId",
              author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
          ])
        let posts = await postsCollection.aggregate(aggOperations).toArray()

        //clean up posts
        posts = posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorId)
            post.authorId = "undefined"
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            
            return post
        }) 
        
        resolve(posts)
        
    })
}


Post.findSingleById = function(id, visitorId) {
    return new Promise(async function(resolve, reject){
        if(typeof(id) != "string" || !ObjectId.isValid(id)){
            reject()
            return
        }
        
        let posts = await Post.postQuery([
            {$match: {_id: new ObjectId(id)}}
        ], visitorId)
        
        if(posts){
            resolve(posts[0])
        }else{
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId) {
    return Post.postQuery([
        {$match: {userId: authorId}},
        {$sort: {createdDate: -1}}
    ])
}

Post.delete = function(id, visitorId){
    return new Promise(async (resolve, reject) => {
        try{
            let post = await this.findSingleById(id, visitorId)
            if(post.isVisitorOwner){
                await postsCollection.deleteOne({_id: new ObjectId(id)})
                resolve()
            }else{
                reject()
            }
        }catch{
            reject()
        }
    })
}

Post.search = function(searchTerm) {
    return new Promise(async (resolve, reject) => {
        if(typeof(searchTerm) == 'string'){
            let posts = await Post.postQuery([
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {score: {$meta: "textScore"}}}
            ])
            resolve(posts)
        }else{
            reject()
        }
    })
}

Post.countPostsByAuthor = function(id) {
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({userId: id})
        resolve(postCount)
    })
}

module.exports = Post