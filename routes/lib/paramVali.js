const vali = require('validator')

const Validate = class {
    constructor () {
    }
    // TODO sanitize and clean up user inputs
    lookUpParams (req, res, next) {
        this.isValidCount = 0
        this.models = ['mural', 'artist', 'tag', 'link', 'organ', 'image']
        this.modelsMid = ['artist', 'tag', 'link', 'organ', 'image']
        this.keys = ['freshMural', 'spottedCount', 'likesCount', 'city', 'state', 'zipcode', 'active', 'country']
        this.legacyStats = ['favorite', 'seen']
        this.lookUp = {
            id: {
                func: id => vali.isMongoId(id),
                err: 'Not a valid Id'
            },
            uid: {
                func: uid => vali.isMongoId(uid),
                err: 'Not a valid uid'
            },
            dataId: {
                func: uid => vali.isMongoId(uid),
                err: 'Not a valid uid'
            },
            name: {
                func: name => name !== '' || name !== undefined,
                err: 'mName Name is not correctly inputted'
            },
            key: {
                func: key => this.keys.indexOf(key) >= 0,
                err: 'Could not process query key'
            },
            val: {
                func: val => val !== '' || val !== undefined,
                err: 'Value Name is not correctly inputted'
            },
            searchType: {
                func: smodel => this.models.indexOf(smodel) >= 0,
                err: 'Model for search not supported'
            },
            term: {
                func: term => term !== '' || term !== undefined,
                err: 'Term for search is not correctly inputted'
            },
            model: {
                func: model => this.models.indexOf(model) >= 0,
                err: 'Must supply model to query'
            },
            type: {
                func: type => this.models.indexOf(type) >= 0,
                err: 'Must supply model to query'
            },
            stat: {
                func: type => this.legacyStats.indexOf(type) >= 0,
                err: 'Must supply model to query for state'
            },
            mural: {
                func: term => term !== '' || term !== undefined,
                err: 'Must supply model to query for state'
            },
            modelMID: {
                func: model => model !== '' || model !== undefined,
                err: 'Must supply model to query for state'
            },
            baseModel: {
                func: model => this.modelsMid.indexOf(model) >= 0,
                err: 'Must supply model to query for state'
            }
        }
        this.loopValidity(req)
        this.returnProcess(res, next)
    }

    loopValidity (req) {
        const self = this
        this.lookUpMap = Object.keys(req.params).map((key) => {
            req.params[key] = vali.stripLow(req.params[key])
            req.params[key] = req.params[key].replace(/[^a-zA-Z0-9-_]/g, '')
            console.log('Value -- pV', req.params)
            if (!self.lookUp[key]) {
                return { name: key, valid: false, err: 'Cannot process query param' }
            }
            if (this.lookUp[key] && this.lookUp[key].func(req.params[key]) === true) {
                self.isValidCount++
                return { name: key, valid: true }
            }
            return { name: key, valid: false, err: self.lookUp[key].err }
        })
    }

    returnProcess (res, next) {
        if (this.isValidCount === this.lookUpMap.length) {
            next()
        } else {
            res.status(403).send({ error: true, message: this.lookUpMap.map(m => ((m.err) ? `${m.err}. ` : '')).join('') })
        }
    }
}
module.exports = Validate
