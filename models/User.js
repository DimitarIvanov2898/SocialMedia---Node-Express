const validator = require('validator')

let User = function(data) {
    this.data = data
    this.errors = []
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

User.prototype.validate = function(){
    if(this.data.username != '' && !validator.isAlphanumeric(this.data.username)){
        this.errors.push('Username must contain only letters and numbers')
    }
    if(this.data.username == ''){
        this.errors.push('Username can not be empty')
    }
    if(!validator.isEmail(this.data.email)){
        this.errors.push('You must provide a valid email')
    }
    if(this.data.password == ''){
        this.errors.push('Password can not be empty')
    }
    if(this.data.password.lenght> 0 && this.data.password.lenght < 6){
        this.errors.push('Password must be atleast six symbols')
    }

}

User.prototype.register = function() {
    this.cleanUp()
    this.validate()
}

module.exports = User