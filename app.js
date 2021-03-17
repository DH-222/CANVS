/**
 * Module dependencies.
 */
const express = require('express')
const compression = require('compression')
const session = require('express-session')
const bodyParser = require('body-parser')
const logger = require('morgan')
const chalk = require('chalk')
const errorHandler = require('errorhandler')
const lusca = require('lusca')
const dotenv = require('dotenv')
const MongoStore = require('connect-mongo')(session)
const flash = require('express-flash')
const path = require('path')
const mongoose = require('mongoose')
const passport = require('passport')
const expressValidator = require('express-validator')
const helmet = require('helmet')

const envPlace = process.env.PLACE
const routesMural = require('./routes/routesMural')
const routesUser = require('./routes/routesUser')
const routesDraft = require('./routes/routesDraft')
const mysql = require('mysql')

if (envPlace === 'DEV') {
    dotenv.load({ path: '.env.dev' })
} else if (envPlace === 'PROD') {
    dotenv.load({ path: '.env.prod' })
} else {
    dotenv.load({ path: '.env.stage' })
}

const mysqlConfig = {
    url: process.env.MYSQL_URI,
    user: process.env.MYSQL_USER,
    pass: process.env.MYSQL_PASS,
    db: process.env.MYSQL_DB
}
const passportConfig = require('./config/passport')

const app = express()

mongoose.Promise = global.Promise
console.log(process.env.MONGODB_URI)
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI)
mongoose.connection.on('error', (err) => {
    console.error(err)
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
    process.exit()
})


app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0')
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 4040)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.set('mysqlConfig', mysqlConfig)
app.set('resourceEnv', process.env.RESOURCE_ENV)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    next()
})
app.use(helmet())


app.use(compression())

if (envPlace === 'DEV') {
    const sass = require('node-sass-middleware')
    app.use(sass({
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'public')
    }))
}

app.use(logger('dev'))
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
        url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
        autoReconnect: true,
        clear_interval: 3600
    })
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))
app.use((req, res, next) => {
    res.locals.user = req.user
    res.locals.resEnvs = process.env.RESOURCE_ENV
    next()
})
app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' &&
        !req.path.match(/^\/auth/) &&
        !req.path.match(/\./)) {
        req.session.returnTo = req.path
    } else if (req.user &&
        req.path === '/account') {
        req.session.returnTo = req.path
    }
    next()
})
app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }))

routesMural(app, passportConfig)
routesDraft(app, passportConfig)
routesUser(app, passportConfig)
// Error Handler.

app.use(errorHandler())

app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'))
    console.log('  Press CTRL-C to stop\n')
})

module.exports = app
