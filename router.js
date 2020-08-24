const express = require("express")
const router = express.Router()
const userController = require("./controllers/userController")
const postController = require("./controllers/postController")

router.get("/", userController.home)

//user routes
router.post("/register", userController.register)
router.post("/login", userController.login)
router.post("/logout", userController.logout)

//profile routes
router.get("/profile/:username", userController.userExists, userController.profilePostScreen)

//post routes
router.get("/create-post", userController.checkLogin, postController.viewCreateScreen)
router.post("/create-post", userController.checkLogin, postController.create)
router.get("/post/:id", postController.viewSingle)
router.get("/post/:id/edit", userController.checkLogin, postController.viewEditSingle)
router.post("/post/:id/edit", userController.checkLogin, postController.edit)
router.post("/post/:id/delete", userController.checkLogin, postController.delete)
router.post("/search", postController.search)

module.exports = router