const postsCollection = require("../db").db().collection("posts")
const ObjectId = require("mongodb").ObjectID

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

module.exports = Post