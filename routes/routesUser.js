const userController = require('../controllers/user')
// const passportConfig = require('../config/passport')
const mysqlController = require('../controllers/mysql')
const homeController = require('../controllers/home')
// need a better naming convention for all routes....
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
})
const signUpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutes
    max: 10 // limit each IP to 100 requests per windowMs
})
const routes = function (app, passportConfig) {
    app.get('/', homeController.index)
    app.get('/mysql', mysqlController.index)
    app.get('/login', userController.getLogin)
    app.post('/login', limiter, userController.postLogin)
    app.get('/logout', userController.logout)
    // app.get('/forgot', userController.getForgot)
    // app.post('/forgot', userController.postForgot)
    // app.get('/reset/:token', userController.getReset)
    // app.post('/reset/:token', userController.postReset)
    app.get('/signup', userController.getSignup)
    app.post('/signup', signUpLimiter, userController.postSignup)
    app.get('/account', passportConfig.isAuthenticated, userController.getAccount)
    app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile)
    app.get('/account/password', passportConfig.isAuthenticated, userController.getUpdatePassword)
    app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword)
    app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount)
    app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink)
    app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink)
}

module.exports = routes
