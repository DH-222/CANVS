const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const UserMongo = require('./lib/UserMongo');
const passportConfig = require('../config/passport');

const userMongo = new UserMongo();


// login
exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    console.log('User', user);
    if (err) { return next(err); }
    if (!user) {
      next({ error: true, message: 'We could not authenticate your credentials' });
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) { next(err); }
      next();
    });
  })(req, res, next);
};

exports.fbLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    console.log('User', user);
    if (err) { return next(err); }
    if (!user) {
      next({ error: true, message: 'We could not authenticate your credentials' });
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) { next(err); }
      next();
    });
  })(req, res, next);
};

exports.test = (req, res, next) => {
  res.send(req.user);
};

exports.getUser = (req, res, next) => {
  const id = req.params.uid;
  if (req.user.id === id) {
    userMongo.getUserTest(id, req)
      .then((user) => {
        res.send(user);
      })
      .catch((error) => {
        res.status(401).send({ error });
      });
  } else {
    res.status(401).send({ error: true, message: 'We could not authenticate your credentials' });
  }
};

// create user account
exports.signUp = (req, res, next) => {
  const userData = {
    email: req.body.email,
    password: req.body.password,
    created_at: new Date(),
    role: 'user',
    is_approved: true,
    active: true,
  };
  userMongo.userSignUp(userData)
    .then(
      (user) => {
        req.logIn(user, { session: false }, (err) => {
          if (err) next(err);
          passportConfig.generateToken(req, res, next);
        });
      })
    .catch((error) => {
      res.status(403).send({ error: true, message: 'error' });
    // next(err);
    });
};

// create user account
exports.signUpFB = (req, res, next) => {
  const userData = {
    token: req.body.fbToken,
    created_at: new Date(),
    role: 'user',
    is_approved: true,
    active: true,
  };
  userMongo.userSignUpFB(userData)
    .then(
      (user) => {
        req.body.id = user.faceBookAuth.id;
        req.logIn(user, { session: false }, (err) => {
          if (err) next(err);
          passportConfig.generateToken(req, res, next);
        });
      })
    .catch((error) => {
      res.status(403).send({ error: true, message: error });
      // next(err);
    });
};
exports.updateUser = (req, res, next) => {
  const userData = {
    query: { _id: req.user.id },
    data: req.body
  };
  userMongo.updateUser(userData)
    .then(
      (result) => {
        res.send(result);
      })
    .catch((error) => {
      res.status(403).send({ error: true, message: error });
    });
};

exports.updateUserData = (req, res, next) => {
  const userData = {
    query: { _id: req.user.id },
    data: req.body,
    type: req.method
  };
  delete userData.data.email;
  userMongo.updateUserData(userData)
    .then(
      (result) => {
        res.send(result);
      })
    .catch((error) => {
      res.status(403).send({ error: true, message: error });
    });
};

exports.collectionHandling = (req, res, next) => {
  const userData = {
    query: { _id: req.user.id },
    data: req.body,
    type: req.method
  };
  userMongo.collectionHandle(userData)
    .then(
      (result) => {
        res.send(result);
      })
    .catch((error) => {
      res.status(403).send({ error: true, message: error });
    });
};

exports.collectionDataHandling = (req, res, next) => {
  const userData = {
    query: { _id: req.user.id },
    data: req.body,
    type: req.method
  };
  userMongo.collectionDataHandle(userData)
    .then(
      (result) => {
        res.send(result);
      })
    .catch((err) => {
      res.status(403).send({error:true,message:err});
    });
};

exports.artistFollowHandling = (req, res, next) => {
  console.log('request: -- ', req.method);
  const userData = {
    query: { _id: req.user.id },
    data: req.body,
    type: req.method
  };
  userMongo.artistFollowHandling(userData)
    .then(
      (result) => {
        res.send(result);
      })
    .catch((err) => {
      res.status(403).send({error:true,message:err});
    });
};
