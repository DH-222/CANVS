const bluebird = require('bluebird')
const Mural = require('../../models/Mural')
const User = require('../../models/User')
const Draft = require('../../models/Draft')
// const Post = require('../../models/Post')
const Artist = require('../../models/Artist')
const Image = require('../../models/Image')
const Tag = require('../../models/Tag')
const Link = require('../../models/Link')
const Organ = require('../../models/Organization')
const mysql = require('mysql')

// const DataUtils = require('./dataUtils')
const mongoCanvs = {
    Image,
    Artist,
    Link,
    Tag,
    Organ
}
class GetMongoData {
    dbCheckUser (query) {
        return User.findOne(query).exec().then((userAdmin) => {
            if (userAdmin) {
                this.user = userAdmin
                return true
            }
            this.errz('Could not get this user')
        }).catch(err => this.errz(err.message))
    }

    errz (e) {
        throw new Error(e)
    }

    getAllMurals (query, sort, user) {
        return new Promise((resolve, reject) => {
            this.admin = (user.role === 'admin')
            if (this.admin) {
                Mural.find({}).sort(sort).exec((err, mongo) => {
                    resolve({
                        data: this.loopAssemblyData(mongo),
                        title: 'View Murals',
                        isAdmin: true
                    })
                })
            } else {
                console.log('Users here', user)
                Mural.find({ 'user.mid': user._id }).sort(sort).exec((err, mongo) => {
                    if (!mongo || !mongo.length) {
                        reject({ error: true, message: 'You have no Murals under your account that you created' })
                    }
                    resolve({
                        data: this.loopAssemblyData(mongo),
                        title: 'View Murals',
                        isAdmin: false
                    })
                })
            }
        })
    }

    loopAssemblyData (data) {
        const returnArray = []
        data.forEach((item) => {
            let tags = ''
            const links = []
            if (item.tags) {
                Object.keys(item.tags).forEach((key) => {
                    tags = `${tags}${item.tags[key].name},`
                })
                tags = tags.substring(0, tags.length - 1)
            }

            if (item.links) {
                Object.keys(item.links).forEach((key) => {
                    links.push(item.links[key].name)
                })
            }

            const formData = {
                name: item.name,
                _id: item._id,
                active: item.active,
                derelict: item.archive,
                address: item.address,
                images: (item.images) ? item.images : null,
                freshMural: item.freshMural,
                about: item.about,
                legacyID: item.legacyID,
                latitude: item.latitude,
                longitude: item.longitude,
                creationDate: item.creationDate,
                artist: (item.artist.length) ? item.artist[0] : null,
                additionalLink1: (links[0]) ? links[0] : '',
                additionalLink2: (links[1]) ? links[1] : '',
                additionalLink3: (links[2]) ? links[2] : '',
                tags
            }
            returnArray.push(formData)
        })
        return returnArray
    }

    assembleDraftData (item) {
        const formData = {
            id: item._id,
            name: item.name,
            address: item.address,
            city: item.city,
            zipcode: item.zipcode,
            state: item.state,
            imageInputs: item.imageInputs,
            freshMural: item.freshMural,
            creationDate: item.creationDate,
            recordCreated: item.recordCreated,
            about: item.about,
            legacyID: item.legacyID,
            latitude: item.latitude,
            longitude: item.longitude,
            youtube: item.youtube,
            vimeo: item.vimeo,
            status: item.status,
            artist: item.artist,
            links: item.links,
            tags: item.tags,
            organs: item.organs,
            mainThumb: item.mainThumb
        }
        return formData
    }

    assembleMuralData (item) {
        const formData = {
            id: item._id,
            name: item.name,
            address: item.address,
            city: item.city,
            zipcode: item.zipcode,
            state: item.state,
            imageInputs: item.imageInputs,
            freshMural: item.freshMural,
            creationDate: item.creationDate,
            recordCreated: item.recordCreated,
            about: item.about,
            archive: item.archive,
            active: item.active,
            legacyID: item.legacyID,
            latitude: item.latitude,
            longitude: item.longitude,
            youtube: item.youtube,
            vimeo: item.vimeo,
            status: item.status,
            artist: item.artist,
            links: item.links,
            tags: item.tags,
            organs: item.organizations,
            images: item.images,
            mainThumb: item.mainThumb
        }
        return formData
    }

    errorShow (err) {
        console.log(err)
        this.req.flash('errors', { msg: `Error Message: ${err}` })
        this.res.redirect('/')
    }

    getSingleMural (query) {
        return new Promise((resolve, reject) => {
            Mural.findOne(query, (err, mongo) => {
                console.log('Mongo', mongo)
                if (err) reject(err)
                if (mongo) {
                    resolve({ data: this.assembleMuralData(mongo) })
                }else {
                  reject('Could not get data point for you, or you might not have access to that Mural')
                }
            })
        })
    }

    getAllDraftStatus (query, user) {
        return this.dbCheckUser(user)
            .then(() => this.findDraft(query))
            .then(result => result)
    }

    findDraft (query, fields = {}, opts = {}) {
        return Draft.find(query, fields, opts).exec((err, draft) => {
            if (err) this.errz('Could not find data requested')
            if (draft) {
                // console.log('Draft Found:: --, ', draft)
                return draft
            }
            this.errz('Could not locate data requested')
        })
    }

    // getUserDrafts (user) {
    //     // console.log("get user DRAFTS")
    //     return this.dbCheckUser(user)
    //         .then(() => this.findDraft({ _id: { $in: this.user.drafts }, approved: false, archive: false }).exec(draft => draft))
    //         .then((draft) => {
    //             if (draft) {
    //                 return { data: { count: this.user.drafts.length - 1, uuid: this.user.drafts } }
    //             }
    //             this.errz('Could not find data')
    //         })
    //         .catch(e => this.errz(e.message))
    // }

    getDraft (query) {
        // console.log(process.env.S3_BUCKET)
        return this.findDraft(query)
            .then((draft) => {
                if (draft[0]) {
                    return { data: this.assembleDraftData(draft[0]) }
                }
                this.errz('Could not find data')
            })
            .catch(e => this.errz(e.message))
    }
    getSearchArtist (query) {
        return new Promise((resolve, reject) => {
            Artist.find(query, (err, artist) => {
                if (artist) {
                    resolve({ error: false, data: artist })
                }
                reject({ error: true, message: 'Could not find your requested draft.' })
            })
        })
    }
    getTypeAheadData () {
        const typeAhead = {
            Tag: null,
            Artist: null,
            Link: null,
            Organ: null,
            Image: null
        }
        return Promise.all(
            [Artist.find({}, { name: 1, _id: 1 }).exec((err, art) => {
                if (err) console.log('Error', err)
                // console.log('ArtIssues', art)
                typeAhead.Artist = art
            }),
            Link.find({}, { name: 1, _id: 1 }).exec((err, links) => { typeAhead.Link = links }),
            Tag.find({}, { name: 1, _id: 1 }).exec((err, tags) => { typeAhead.Tag = tags }),
            Organ.find({}, { name: 1, _id: 1 }).exec((err, organs) => { typeAhead.Organ = organs })]
        ).then(() => typeAhead)
    }
    getDraftStatus (query) {
        const fields = { name: 1, user: 1, artist: 1, draftDate: 1 }
        return this.findDraft(query, fields)
            .then((err, draft) => {
                if (err) this.errz(err.message)
                if (draft) {
                    // console.log('Draft: --', draft)
                    return { data: draft }
                }
                this.errz('Could not find Data')
            })
    }

    updateDraft (query, options) {
        return Draft.findOneAndUpdate(query, options, {}).exec()
            .then((err, draft) => {
                if (err) this.errz('Failed to update data')
                return { data: draft }
            })
            .catch(e => this.errz(e.message))
    }

    getModelID (id, model) {
        return mongoCanvs[model].find({ _id: id }).exec(data => data)
            .then(result =>
                // console.log('Ugly Folks', result)
                result[0]
            )
            .catch(e => this.errz(e))
    }
    getAllArtist (req, sort) {
        return new Promise((resolve, reject) => {
            this.admin = (req.user.role === 'admin')
            if (this.admin) {
                Artist.find({}).sort(sort).exec((err, artist) => {
                    if (err) reject({ error: true, message: 'You have no Artists under your account.' })
                    resolve({
                        data: artist,
                        title: 'Artist Directory',
                        isAdmin: true
                    })
                })
            } else {
                Artist.find({ 'user.mid': req.user._id }).sort(sort).exec((err, artist) => {
                    if (err || !artist.length) {
                        reject({ error: true, message: 'You have no Artists under your account.' })
                    }
                    resolve({
                        data: artist,
                        title: 'Artist Directory',
                        isAdmin: false
                    })
                })
            }
        })
    }
    getSingleArtist (req) {
        return new Promise((resolve, reject) => {
            const id = req.params.id
            if (req.user.role === 'admin') {
                this.admin = (req.user.role === 'admin')
                Artist.findOne({ _id: id }, (err, artist) => {
                    if (err) reject(err)
                    if (artist) {
                        resolve({ data: artist })
                    }
                    reject('Could not get data point for you, or you might not have access to that Mural')
                })
            } else {
                Artist.findOne({ _id: id, 'user.mid': req.user._id }, (err, artist) => {
                    if (err) reject(err)
                    if (artist) {
                        resolve({ data: artist })
                    }
                    reject('Could not get data point for you, or you might not have access to that Mural')
                })
            }
        })
    }
}

module.exports = GetMongoData
