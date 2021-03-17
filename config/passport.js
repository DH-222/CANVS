const passport = require('passport')
const request = require('request')
const LocalStrategy = require('passport-local').Strategy
// const FacebookStrategy = require('passport-facebook').Strategy

const exclude = {
    organizations: 0,
    murals: 0,
    artist: 0,
    drafts: 0,
    role: 0,
    tags: 0,
    created_at: 0,
    updatedAt: 0,
    createdAt: 0,
    is_approved: 0,
    updated_at: 0,
    sign_in_count: 0,
    current_sign_in_at: 0,
    last_sign_in_at: 0,
    __v: 0
}

const User = require('../models/User')
// const Contributor = require('../models/Contributor');

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user)
    })
})

/**
 * Sign in using Email and Password.utor
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: email.toLowerCase() }, exclude, (err, user) => {
        if (err) {
            return done(err)
        }
        if (!user) {
            return done(null, false, { msg: `Email ${email} not found.` })
        }
        user.comparePassword(password, (err, isMatch) => {
            if (err) {
                return done(err)
            }
            if (isMatch) {
                return done(null, user)
                //   user.sign_in_count++
                // user.
            }
            return done(null, false, { msg: 'Invalid email or password.' })
        })
    })
}))

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
    const provider = req.path.split('/').slice(-1)[0]
    const token = req.user.tokens.find(token => token.kind === provider)
    if (token) {
        next()
    } else {
        res.redirect(`/auth/${provider}`)
    }
}
