/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
// const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
// const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
// const expressStatusMonitor = require('express-status-monitor');
const ErrorHandler = require('./routes/lib/errorHandler');

const errorHandler = new ErrorHandler();
const envPlace = process.env.PLACE;
const muralRoutes = require('./routes/murals');
const legacyRoutes = require('./routes/legacy');
const userRoutes = require('./routes/user');

if (envPlace === 'DEV') {
  dotenv.load({ path: '.env.dev' });
} else if (envPlace === 'PROD') {
  dotenv.load({ path: '.env.prod' });
} else {
  dotenv.load({ path: '.env.stage' });
}

const mysqlConfig = {
  url: process.env.MYSQL_URI,
  user: process.env.MYSQL_USER,
  pass: process.env.MYSQL_PASS,
  db: process.env.MYSQL_DB
};

// console.log("Log dev env: --", process.env.FACEBOOK_CALLBACK, "app.host: --", app.get('host'));

// console.log("MYSQL: ", mysqlConfig)
const passportConfig = require('./config/passport');

// passportConfig.envProcessPassport({ place: envPlace, data: process.env });
const app = express();
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3333);
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// app.use(expressStatusMonitor());
app.use(compression());
app.set('mysqlConfig', mysqlConfig);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());

app.use(passport.initialize());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// get Routes
muralRoutes(app, passportConfig);
legacyRoutes(app, passportConfig);
userRoutes(app, passportConfig);

app.use((err, req, res, next) => { errorHandler.finalProcess(err, req, res, next); });


app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
