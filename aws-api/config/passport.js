const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync(`${__dirname}/key/private.key`, 'utf8');
const publicKey = fs.readFileSync(`${__dirname}/key/public.key`, 'utf8');

const expressJwt = require('express-jwt');

const jwtAuthCheck = expressJwt({ secret: publicKey });


const User = require('../models/User');

let envProcess = {};
let fbCred = {};
const signOptions = {
  issuer: 'canvs llc',
  subject: 'info@canvsart.com',
  audience: 'canvs.app',
  expiresIn: '12h',
  algorithm: 'RS256',
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// console.log('Log dev env: --', process.env.FACEBOOK_ID);
exports.envProcessPassport = (process) => {
  envProcess = process;
  const { data: d, place } = process;
  fbCred = {
    id: d.FACEBOOK_ID,
    secret: d.FACEBOOK_SECRET,
    callBack:
      (place === 'DEV')
        ? `http://localhost:${d.PORT}/${d.FACEBOOK_CALLBACK}` : `http://canvs.app/api/${d.FACEBOOK_CALLBACK}`
  };
  console.log('FBCRED', fbCred);

  passport.use(new FacebookStrategy({
    clientID: fbCred.id,
    clientSecret: fbCred.secret,
    callbackURL: fbCred.callBack,
  }, (token, refreshToken, profile, done) => {
    User.findOne({ 'faceBookAuth.id': profile.id }, (err, user) => {
      if (err) { return done(err); }
      if (user) {
        return done(null, user);
      }
      console.log('FaceBook Profile', profile);
      const newUserData = {
        id: profile.id,
        token,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        emails: profile.emails,
      };
      const newUser = new User(newUserData);
      newUser.save((err) => {
        if (err) throw err;
        return done(null, newUser);
      });
    });
  })
  );
};


/**
 * Sign in using Email and Password.utor
 */
const exclude = {
  organizations: 0,
  murals: 0,
  artist: 0,
  drafts: 0,
  role: 0,
  tags: 0,
  created_at: 0,
  updatedAt: 0,
  is_approved: 0,
  updated_at: 0,
  sign_in_count: 0,
  current_sign_in_at: 0,
  last_sign_in_at: 0,
  __v: 0
};
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  User.findOne({ email: email.toLowerCase() }, exclude, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, { msg: `Email ${email} not found.` });
    }
    user.comparePassword(password, (err, isMatch) => {
      if (err) {
        return done(err);
      }
      if (isMatch) {
        return done(null, user);
      }
      return done(null, false, { msg: 'Invalid email or password.' });
    });
  });
}));

passport.use('fb-app-auth', new LocalStrategy((id, done) => {
  User.findOne({ 'faceBookAuth.id': id }, exclude, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, { msg: `Email ${email} not found.` });
    }

    return done(null, user);
  });
}));
exports.pubKey = publicKey;
/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */


/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];
  const token = req.user.tokens.find(token => token.kind === provider);
  if (token) {
    next();
  } else {
    res.status(401).send({ error: true, message: 'Could not authenticate user' });
    res.redirect(`/auth/${provider}`);
  }
};

exports.generateToken = (req, res, next) => {
  req.token = jwt.sign({ id: req.user.id }, privateKey, signOptions);
  // const dataCopy = Object.assign({},req.user);
  // delete dataCopy.password;
  req.user.password = null;
  res.send({
    user: req.user,
    token: req.token,
  });
  // next();
};

exports.generateFBToken = (req, res, next) => {
  req.token = jwt.sign({ id: req.user.faceBookAuth.id, fbUser: true }, privateKey, signOptions);
  // const dataCopy = Object.assign({},req.user);
  // delete dataCopy.password;
  req.user.password = null;
  res.send({
    user: req.user,
    token: req.token,
  });
  // next();
};

exports.authenticated = (req, res, next) => jwtAuthCheck;
