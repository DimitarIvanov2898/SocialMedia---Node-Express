const postsCollection = require("../db").db().collection("posts")
const ObjectId = require("mongodb").ObjectID
const User = require("./User")

let Post = function(data, userId) {
    this.data = data
    this.errors = []
    this.userId = userId
}

Post.prototype.cleanUp = function() {
    if(typeof(this.data.title) != 'string'){
        this.data.title = ''
    }
    if(typeof(this.data.body) != 'string'){
        this.data.body = ''
    }
    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
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
            postsCollection.insertOne(this.data).then(() => {
                resolve()
            }).catch(() => {
                this.errors.push("Db error, try again")
                reject(this.errors)
            })

        }else{
            reject(this.errors)
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

module.exports = Post