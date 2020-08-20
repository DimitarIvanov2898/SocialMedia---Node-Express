const express = require("express")
const router = express.Router()
const userController = require("./controllers/userController")
const postController = require("./controllers/postController")

router.get("/", userController.home)

//user routes
router.post("/register", userController.register)
router.post("/login", userController.login)
router.post("/logout", userController.logout)

//post routes
router.get("/create-post", userController.checkLogin, postController.viewCreateScreen)
router.post("/create-post", userController.checkLogin, postController.create)

module.exports = router