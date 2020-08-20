const dotenv = require("dotenv")
dotenv.config()
const mongodb = require("mongodb")

mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
    const db = client.db("SocialMedia")
    module.exports = db
    const app = require('./app')
    app.listen(process.env.PORT)
})