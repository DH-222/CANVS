const mysql = require('mysql')
const User = require('../../models/User')
const List = require('../../models/List')

const DataUtils = superclass => class extends superclass {
    dbCheckAdminUser (userQ) {
        return User.findOne(userQ).exec().then((userAdmin) => {
            if (userAdmin) {
                this.user = userAdmin
                return true
            }
            this.errz('Could not get this user')
        }).catch(err => this.errz(err.message))
    }
    dbCheckUser (userQ) {
        return User.findOne(userQ).exec().then((user) => {
            if (user) {
                this.user = user
                return true
            }
            this.errz('Could not get this user')
        }).catch(err => this.errz(err.message))
    }
    errz (e) {
        throw new Error(e)
    }
    errorShow (err) {
        this.req.flash('errors', { msg: `Error Message: ${err}` })
        this.res.redirect('/')
    }

    addModelMap (model, doc, compare) {
        let found = false
        const returnArr = (model[doc]) ? model[doc].map(item => item) : []
        for (let i = 0; i < returnArr.length; i++) {
            if (returnArr[i].mid === compare.mid) {
                found = true
            }
        }
        if (!found) {
            returnArr.push(compare)
        }
        return returnArr
    }
}

module.exports = DataUtils
