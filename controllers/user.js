const bluebird = require('bluebird')
const crypto = bluebird.promisifyAll(require('crypto'))
const nodemailer = require('nodemailer')
const passport = require('passport')
const User = require('../models/User')
const path = require('path')
const multer = require('multer')
// const Post = require('../models/Post')
const multiparty = require('multiparty')
const localImages = require('./localImages')

const upload = multer({ dest: path.join(__dirname, 'uploads') }).single('myFile')
const vali = require('validator')
/**
 * GET /login* Login page.
 */
exports.getLogin = (req, res) => {
    if (req.user) {
        return res.redirect('/')
    }
    res.render('account/login', {
        title: 'Login'
    })
}
/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
    req.assert('email', 'Email is not valid').isEmail()
    req.assert('password', 'Password cannot be blank').notEmpty()
    req.sanitize('email').normalizeEmail({ gmail_remove_dots: false })

    const errors = req.validationErrors()

    if (errors) {
        req.flash('errors', errors)
        return res.redirect('/login')
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err)
        }
        if (!user) {
            req.flash('errors', info)
            return res.redirect('/login')
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err)
            }
            req.flash('success', { msg: 'Success! You are logged in.' })
            res.redirect(req.session.returnTo || '/')
        })
    })(req, res, next)
}

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
    req.logout()
    res.redirect('/')
}

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
    if (req.user) {
        return res.redirect('/')
    }
    res.render('account/signup', {
        title: 'Create Account'
    })
}

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        const data = { ...files }
        Object.keys(fields).forEach((key) => {
            if (key !== '_csrf' || key !== 'picture') {
                data[key] = fields[key][0]
            }
        })
        if (!vali.isEmail(data.email) || !vali.isLength(data.password, { min: 3, max: 20 })) {
            req.flash('errors', { msg: 'Please an email and password combo' })
            return res.redirect('/signup')
        }
        // vali.isEmail(data.email)
        // vali.isLength(data.password, { min: 3, max: 20 })
        // req.assert('email', 'Email is not valid').isEmail()
        // req.assert('password', 'Password must be at least 4 characters long').len(4)
        // req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password)
        // req.sanitize('email').normalizeEmail({ gmail_remove_dots: false })
        //
        // const errors = req.validationErrors()
        //
        // if (errors) {
        //     req.flash('errors', errors)
        //     return res.redirect('/signup')
        // }
        const user = new User(
            {
                email_show: false,
                firstName: data.firstName,
                lastName: data.lastName,
                userName: data.userName,
                bio: data.bio,
                webUrl: data.webUrl,
                facebookLink: data.facebookLink,
                location: data.location,
                gender: data.gender,
                instagramLink: data.instagramLink,
                twitterLink: data.twitterLink,
                youtubeLink: data.youtubeLink,
                phone: data.phone,
                phone_show: false,
                provider: null,
                role: 'contrib',
                email: data.email,
                password: data.password,
                sign_in_count: 1,
                updated_at: new Date(),
                created_at: new Date(),
                last_sign_in_at: new Date(),
                current_sign_in_at: new Date(),
                is_approved: true
            }
        )
        User.findOne({ email: req.body.email }, (err, existingUser) => {
            if (err) {
                return next(err)
            }
            if (existingUser) {
                req.flash('errors', { msg: 'Account with that email address already exists.' })
                res.redirect('/signup')
            }
            user.save((err) => {
                if (data.picture[0].size > 0) {
                    console.log('Pic', data.picture)
                    localImages.profilePicHandle(user, data.picture)
                        .then((image) => {
                            user.picture = image.key
                            user.save((errA, result) => {
                                if (errA) {
                                    req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' })
                                    return res.redirect('/account')
                                }
                                req.flash('success', { msg: `Thank you ${user.firstName}, Your account has been created` })
                                res.redirect('/login')
                            })
                        })
                } else {
                    user.save((errB, result) => {
                        if (errB) {
                            req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' })
                            return res.redirect('/account')
                        }
                        req.flash('success', { msg: `Thank you ${user.firstName}, Your account has been created` })
                      res.redirect('/login')
                    })
                }
            })
        })
    })
}

exports.getAccount = (req, res) => {
    res.render('account/profile', {
        title: 'Account Management'
    })
}

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
    // req.assert('email', 'Please enter a valid email address.').isEmail()
    // req.sanitize('email').normalizeEmail({ gmail_remove_dots: false })

    // const errors = req.validationErrors()

    // if (errors) {
    //     req.flash('errors', errors)
    //     return res.redirect('/account')
    // }

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err)
        }
        const form = new multiparty.Form()
        form.parse(req, (err, fields, files) => {
            // const data = { ...files }
            Object.keys(fields).forEach((key) => {
                if (key !== '_csrf' || key !== 'picture') {
                    user[key] = fields[key][0]
                }
            })
            user.updated_at = new Date()
            if (files.picture[0].size > 0) {
                console.log('Pic', files.picture)
                localImages.profilePicHandle(user, files.picture)
                    .then((image) => {
                        user.picture = image.key
                        user.save((errA, result) => {
                            if (errA) {
                                req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' })
                                return res.redirect('/account')
                            }
                            req.flash('success', { msg: 'Profile information has been updated.' })
                            res.redirect('/account')
                        })
                    })
            } else {
                user.save((errB, result) => {
                    if (errB) {
                        req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' })
                        return res.redirect('/account')
                    }
                    req.flash('success', { msg: 'Profile information has been updated.' })
                    res.redirect('/account')
                })
            }
        })
    })
}

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long').len(4)
    req.assert('oldPassword', 'Password must be at least 4 characters long').len(4)
    req.assert('confirm', 'Passwords do not match').equals(req.body.password)

    const errors = req.validationErrors()

    if (errors) {
        req.flash('errors', errors)
        return res.redirect('/account')
    }

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err)
        }
        user.comparePassword(req.body.oldPassword, (err, isMatch) => {
            if (err) {
                req.flash('errors', { msg: 'Old password incorrectt' })
                return res.redirect('/account/password')
            }
            if (isMatch) {
                user.password = req.body.password
                user.save((err) => {
                    if (err) {
                        return next(err)
                    }
                    req.flash('success', { msg: 'Password has been changed.' })
                    res.redirect('/')
                })
            } else {
                req.flash('errors', { msg: 'Old password incorrectt' })
                return res.redirect('/account/password')
            }
        })
    })
}

exports.getUpdatePassword = (req, res, next) => {
    res.render('account/reset')
}

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
    User.remove({ _id: req.user.id }, (err) => {
        if (err) {
            return next(err)
        }
        req.logout()
        req.flash('info', { msg: 'Your account has been deleted.' })
        res.redirect('/')
    })
}

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
    const provider = req.params.provider
    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err)
        }
        user[provider] = undefined
        user.tokens = user.tokens.filter(token => token.kind !== provider)
        user.save((err) => {
            if (err) {
                return next(err)
            }
            req.flash('info', { msg: `${provider} account has been unlinked.` })
            res.redirect('/account')
        })
    })
}

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    User
        .findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) {
                return next(err)
            }
            if (!user) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' })
                return res.redirect('/forgot')
            }
            res.render('account/reset', {
                title: 'Password Reset'
            })
        })
}

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long.').len(4)
    req.assert('confirm', 'Passwords must match.').equals(req.body.password)

    const errors = req.validationErrors()

    if (errors) {
        req.flash('errors', errors)
        return res.redirect('back')
    }

    const resetPassword = () =>
        User
            .findOne({ passwordResetToken: req.params.token })
            .where('passwordResetExpires').gt(Date.now())
            .then((user) => {
                if (!user) {
                    req.flash('errors', { msg: 'Password reset token is invalid or has expired.' })
                    return res.redirect('back')
                }
                user.password = req.body.password
                user.passwordResetToken = undefined
                user.passwordResetExpires = undefined
                return user.save().then(() => new Promise((resolve, reject) => {
                    req.logIn(user, (err) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(user)
                    })
                }))
            })

    const sendResetPasswordEmail = (user) => {
        if (!user) {
            return
        }
        const transporter = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: process.env.SENDGRID_USER,
                pass: process.env.SENDGRID_PASSWORD
            }
        })
        const mailOptions = {
            to: user.email,
            from: 'hackathon@starter.com',
            subject: 'Your Hackathon Starter password has been changed',
            text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
        }
        return transporter.sendMail(mailOptions)
            .then(() => {
                req.flash('success', { msg: 'Success! Your password has been changed.' })
            })
    }

    resetPassword()
        .then(sendResetPasswordEmail)
        .then(() => {
            if (!res.finished) res.redirect('/')
        })
        .catch(err => next(err))
}

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    res.render('account/forgot', {
        title: 'Forgot Password'
    })
}

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.').isEmail()
    req.sanitize('email').normalizeEmail({ gmail_remove_dots: false })

    const errors = req.validationErrors()

    if (errors) {
        req.flash('errors', errors)
        return res.redirect('/forgot')
    }

    const createRandomToken = crypto
        .randomBytesAsync(16)
        .then(buf => buf.toString('hex'))

    const setRandomToken = token =>
        User
            .findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash('errors', { msg: 'Account with that email address does not exist.' })
                } else {
                    user.passwordResetToken = token
                    user.passwordResetExpires = Date.now() + 3600000 // 1 hour
                    user = user.save()
                }
                return user
            })

    const sendForgotPasswordEmail = (user) => {
        if (!user) {
            return
        }
        const token = user.passwordResetToken
        const transporter = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: process.env.SENDGRID_USER,
                pass: process.env.SENDGRID_PASSWORD
            }
        })
        const mailOptions = {
            to: user.email,
            from: 'hackathon@starter.com',
            subject: 'Reset your password on Hackathon Starter',
            text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
        }
        return transporter.sendMail(mailOptions)
            .then(() => {
                req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` })
            })
    }

    createRandomToken
        .then(setRandomToken)
        .then(sendForgotPasswordEmail)
        .then(() => res.redirect('/forgot'))
        .catch(next)
}
