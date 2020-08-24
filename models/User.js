const bcrypt = require("bcryptjs")
const usersCollection = require("../db").db().collection("users")
const validator = require('validator')
const md5 = require("md5")
const { use } = require("marked")


let User = function(data, getAvatar) {
    this.data = data
    this.errors = []
    if(getAvatar == "undefined"){
        getAvatar = false
    }
    if(getAvatar){
        
        this.getAvatar()
    }
}

User.prototype.cleanUp = function() {
    if(typeof(this.data.username) != 'string'){this.data.username = ''}
    if(typeof(this.data.email) != 'string'){this.data.email = ''}
    if(typeof(this.data.password) != 'string'){this.data.password = ''}

    //get rid of unwanted properties
    this.data = {
        username: this.data.username.trim(),
        email: this.data.email.trim(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if(this.data.username != '' && !validator.isAlphanumeric(this.data.username)){
            this.errors.push('Username must contain only letters and numbers')
        }
        if(this.data.username == ''){
            this.errors.push('Username can not be empty')
        }else{
            //check if username and email is taken
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if(usernameExists){this.errors.push("That username is already taken")}
        }
        if(!validator.isEmail(this.data.email) || this.data.email == ''){
            this.errors.push('You must provide a valid email')
        }else{
            //check if username and email is taken
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if(emailExists){this.errors.push("That email is already taken")}
        }
        if(this.data.password == ''){
            this.errors.push('Password can not be empty')
        }
        if(this.data.password.lenght> 0 && this.data.password.lenght < 6){
            this.errors.push('Password must be atleast six symbols')
        }
        resolve()
    })
}

User.prototype.register = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate()
    
        if(!this.errors.length){
            //hash password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)  
            this.getAvatar()
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
                this.data = attemptedUser
                this.getAvatar()
                resolve("Congrats")
            }else{
                reject("Username and password do not match")
            }
        }).catch(() => {
            reject("Db fail, try again later")
        })
    })
}

User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username) {
    return new Promise(function(resolve, reject){
        if(typeof(username) != "string"){
            reject()
            return
        }

        usersCollection.findOne({username: username}).then(function(userDoc){
            if(userDoc){
                
                userDoc = new User(userDoc, true)
                
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                resolve(userDoc)
            }else{
                reject()
            }
        }).catch(function(){
            reject()
        })
    })
}

module.exports = User