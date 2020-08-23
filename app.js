const express = require("express")
const session = require("express-session")
const flash = require("connect-flash")
const MongoStore = require("connect-mongo")(session)
const markdown = require("marked")
const sanitize = require("sanitize-html")

const app = express()

let sessionOptions = session({
    secret: "raikokruvta",
    store: new MongoStore({client: require("./db")}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000*60*60*24, httpOnly: true}
})


const router = require("./router")

app.use(sessionOptions)
app.use(express.static("public"))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(flash())

app.use(function(req, res, next){
    //markdown
    res.locals.filterUserHtml = function(content){
        return sanitize(markdown(content), {allowedTags: ['p','li','ul','ol','strong','i', 'em','br','h1', 'h2','h3','h4','h5','h6'], allowedAttributes: []})
    }
    //make flash msgs available from everywhere
    res.locals.errors = req.flash('errors')
    res.locals.success = req.flash('success')
    //send visitor id to views
    if(req.session.user){
        req.visitorId = req.session.user._id
    }else{
        req.visitorId = 0
    }
    //make session data available in the views
    res.locals.user = req.session.user
    next()
})

app.set("views", "views")
app.set("view engine", "ejs")

app.use("/", router)
module.exports = app