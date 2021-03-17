// const homeController = require('../controllers/home');
// const mysqlController = require('../controllers/mysql')
// const userController = require('../controllers/user')
// const apiController = require('../controllers/api')
// const contactController = require('../controllers/contact')
// const artistController = require('../controllers/artist')
const userController = require('../controllers/user');
const imageController = require('../controllers/imageUploader');
const passportConfig = require('../config/passport');
const utilsController = require('../controllers/mailer');
const expressJwt = require('express-jwt');
const passport = require('passport');
const uV = require('./lib/testVali');

const jwtAuthCheck = expressJwt({ secret: passportConfig.pubKey });
const BodyVal = require('./lib/bodyVali');
const ParamVal = require('./lib/paramVali');

const bodyVal = new BodyVal();
const checkBody = bodyVal.lookUpParams.bind(bodyVal);
const paramVal = new ParamVal();
const checkParams = paramVal.lookUpParams.bind(paramVal);

const routes = (app, passportConfig) => {
  app.post('/set/signup', checkParams, checkBody, userController.signUp);
  app.post('/set/signup/fb', userController.signUpFB);
  app.put('/set/login', checkBody, userController.login, passportConfig.generateToken);
  app.put('/set/update/user/profile', checkBody, jwtAuthCheck, userController.updateUser);
  app.post('/set/update/user/data/', checkBody, jwtAuthCheck, userController.updateUserData);
  app.delete('/set/update/user/data/', checkBody, jwtAuthCheck, userController.updateUserData);
  app.post('/set/update/user/profile/pic', jwtAuthCheck, imageController.imageHandler); // add, remove,

  app.post('/collection/', checkBody, jwtAuthCheck, userController.collectionHandling); // add, remove, rename
  app.delete('/collection/',checkBody, jwtAuthCheck, userController.collectionHandling); // add, remove, rename
  app.put('/collection/', checkBody, jwtAuthCheck, userController.collectionHandling); // add, remove, rename

  app.post('/collection/data/', checkBody, jwtAuthCheck, userController.collectionDataHandling); // add, remove,
  app.delete('/collection/data/', checkBody, jwtAuthCheck, userController.collectionDataHandling); // add, remove,
  app.put('/collection/data/', checkBody, jwtAuthCheck, userController.collectionDataHandling); // add, remove,

  app.post('/artist/follow/',checkBody,  jwtAuthCheck, userController.artistFollowHandling); // add, remove,
  app.delete('/artist/follow/', checkBody, jwtAuthCheck, userController.artistFollowHandling); // add, remove,

  // app.get('/get/auth', jwtAuthCheck, userController.test);
  //app.get('/get/user/:uid', checkParams, jwtAuthCheck, userController.getUser);

  // app.get('/auth/facebook/handle/callback', passport.authenticate('facebook'));
  // app.post('set/signup/user/facebook/', passport.authenticate('facebook'));
  // app.post('set/signup/user/facebook/', passport.authenticate('facebook'));

  // app.get('/auth/facebook/callback', passport.authenticate('facebook'), userController.test);
  app.post('/send/email', utilsController.emailer);
};

module.exports = routes;
