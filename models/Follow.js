const usersCollection = require("../db").db().collection("users")
const followsCollection = require("../db").db().collection("follows")
const ObjectId = require("mongodb").ObjectID

let Follow = function(followedUsername, authorId) {
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanUp = function() {
    if(typeof(this.followedUsername) != 'string'){
        this.followedUsername = ''
    }
}
Follow.prototype.validate = async function(action) {
    //check if exists
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if(followedAccount){
        this.followedId = followedAccount._id

    }else{
        this.errors.push("There is no such user!")
    }

    let doesFollowAlreadyExists = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
    if(action == 'create'){
        if(doesFollowAlreadyExists){
            this.errors.push("You are already following this user!")
        }
    }else if(action == 'delete'){
        if(!doesFollowAlreadyExists){
            this.errors.push("You are not following this user!")
        }
    }

    if(this.followedId == this.authorId){
        this.errors.push("You can not follow yourself!")
    }
}
Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")

        if(!this.errors.length){
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

Follow.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")

        if(!this.errors.length){
            await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {
    
    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectId(visitorId)})
    if(followDoc){
        return true
    }else{
        return false
    }
}
module.exports = Follow