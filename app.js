const express = require("express")
const session = require("express-session")
const flash = require("connect-flash")
const MongoStore = require("connect-mongo")(session)
const markdown = require("marked")
const csrf = require("csurf")
const sanitize = require("sanitize-html")
const app = express()

app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use("/api", require("./router-api"))



let sessionOptions = session({
    secret: "raikokruvta",
    store: new MongoStore({client: require("./db")}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000*60*60*24, httpOnly: true}
})


const router = require("./router")
const { urlencoded } = require("express")

app.use(sessionOptions)
app.use(express.static("public"))
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

app.use(csrf())
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use("/", router)
app.use(function(err, req, res, next){
    if(err){
        if(err.code == "EBADCSRFTOKEN"){
            req.flash("errors", "Cross site request forgery detected")
            req.session.save(()=>{
                res.redirect("/")
            })
        }else{
            res.render("404")
        }
    }

})

//socket.io config
const server = require("http").createServer(app)
const io = require("socket.io")(server)

//not worth memorising 
io.use(function(socket, next) {
    sessionOptions(socket.request, socket.request.res, next)
})

io.on("connection", function(socket) {
    if(socket.request.session.user) {
        let user = socket.request.session.user
        socket.emit("welcome", {username: user.username, avatar: user.avatar})

        socket.on("chatMessageFromBrowser", function(data){
            socket.broadcast.emit("chatMessageFromServer", {message: sanitize(data.message, {allowedTags: [], allowedAttributes:[]}), username: user.username, avatar: user.avatar})
        })
    }
})

module.exports = server