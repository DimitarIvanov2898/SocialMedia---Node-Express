const apiRouter = require("express").Router()
const userController = require("./controllers/userController")
const postController = require("./controllers/postController")
const followController = require("./controllers/followController")
const cors = require("cors")

apiRouter.use(cors())

apiRouter.post("/login", userController.apiLogin)
apiRouter.post("/create-post", userController.apiCheckLogin, postController.apiCreate)
apiRouter.delete("/post/:id", userController.apiCheckLogin, postController.apiDelete)
apiRouter.get("/postByAuthor/:username", userController.apiGetPostsByUsername)

module.exports = apiRouter