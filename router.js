const express = require("express")
const router = express.Router()
const userController = require("./controllers/userController")
const postController = require("./controllers/postController")
const followController = require("./controllers/followController")

router.get("/", userController.home)

//user routes
router.post("/register", userController.register)
router.post("/login", userController.login)
router.post("/logout", userController.logout)
router.post("/doesUsernameExists", userController.doesUsernameExists)
router.post("/doesEmailExists", userController.doesEmailExists)

//profile routes
router.get("/profile/:username", userController.userExists, userController.sharedProfileData, userController.profilePostScreen)
router.get("/profile/:username/followers", userController.userExists, userController.sharedProfileData, userController.profileFollowersScreen)
router.get("/profile/:username/following", userController.userExists, userController.sharedProfileData, userController.profileFollowingScreen)

//post routes
router.get("/create-post", userController.checkLogin, postController.viewCreateScreen)
router.post("/create-post", userController.checkLogin, postController.create)
router.get("/post/:id", postController.viewSingle)
router.get("/post/:id/edit", userController.checkLogin, postController.viewEditSingle)
router.post("/post/:id/edit", userController.checkLogin, postController.edit)
router.post("/post/:id/delete", userController.checkLogin, postController.delete)
router.post("/search", postController.search)

//follow routes
router.post("/addFollow/:username", userController.checkLogin,followController.addFollow)
router.post("/removeFollow/:username", userController.checkLogin,followController.removeFollow)

module.exports = router