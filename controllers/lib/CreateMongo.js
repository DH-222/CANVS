const Mural = require('../../models/Mural')
const Artist = require('../../models/Artist')
const Draft = require('../../models/Draft')
const User = require('../../models/User')
const DocMapping = require('./DocumentMapping')
const DataUtils = require('./DataUtils')
const aws = require('../awsS3')
const mysql = require('mysql')
const localImages = require('../localImages')

class CreateMongoData {
    muralDraft (query, user, mysqlC) {
        this.mysqlConfig = mysqlC
        this.mural = null
        this.draft = null
        this.s3 = null
        // const hasImages = (this.draft.imageInputs.length) ? aws.aS3 : () => null
        return this.dbCheckAdminUser(user)
            .then(() => this.mDfindDraft(query))
            .then(() => ((this.draft.imageInputs.length) ? aws.aS3(this.draft.imageInputs) : null))
            .then(s3 => this.mDmural(s3))
            .then(() => this.mDpromiseDocs())
            .then(results => this.mDmuralSave(results))
            .then(results => this.mDresponse(results))
            .catch(e => this.errz(e.message))
    }

    mDfindDraft (query) {
        return Draft.findOne(query).exec()
            .then((draft) => {
                if (!draft) {
                    return errz('This draft has already been approved')
                }
                this.draft = draft
            })
    }
    ckVal (val) {
        return (val !== '') ? val : null
    }
    mDmural (s3) {
        const { draft: d, ckVal: ck } = this
        this.s3 = (s3) ? Object.keys(s3).map(key => s3[key]) : null
        const thumbID = (this.s3 && (d.mainThumb === '0')) ? this.s3[0].thumbId : d.mainThumb
        this.mural = new Mural({
            name: ck(d.name),
            freshMural: ck(d.freshMural),
            about: ck(d.about),
            address: ck(d.address),
            archive: false,
            city: ck(d.city),
            state: ck(d.state),
            zipcode: ck(d.zipcode),
            country: ck(d.country),
            latitude: ck(d.latitude),
            longitude: ck(d.longitude),
            youtube: ck(d.youtube),
            creationDate: d.creationDate,
            recordCreated: d.recordCreated,
            vimeo: ck(d.vimeo),
            mainThumb: thumbID,
            spottedCount: 0,
            likesCount: 0,
            user: this.draft.user,
            isCVNew: true,
            artist: [],
            tags: [],
            images: [],
            organizations: [],
            location: {
                type: 'Point',
                coordinates: [this.draft.longitude || 33.33, this.draft.latitude || 33.33]
            },
            active: !((!this.draft.longitude || this.draft.longitude === 33))
        })
    }
    mDmuralSave (results) {
        return this.mural.save().then(() => results)
    }
    mDpromiseDocs () {
        console.log('S##33 ==', this.s3)
        const artist = (this.draft.artist && this.draft.artist.length) ? this.draft.artist : []
        const images = (this.s3 && this.s3.length) ? this.s3 : []
        const links = (this.draft.links && this.draft.links.length) ? this.draft.links.map(i => i.link) : []
        const tags = (this.draft.tags && this.draft.tags.length) ? this.draft.tags.map(i => i.tag) : []
        const organizations = (this.draft.organs && this.draft.organs.length) ? this.draft.organs.map(i => i.organ) : []
        return Promise.all([
            this.artistImageHandler(artist, 'artist'),
            this.artistImageHandler(images, 'images'),
            this.docHandler(links, 'links'),
            this.docHandler(tags, 'tags'),
            this.docHandler(organizations, 'organizations')
        ])
    }
    mDresponse (results) {
        this.draft.approved = true
        return User.findById(this.draft.user.mid, (err, user) => {
            if (err) throw Error('User not asscociated with Draft')
            const dUsIDX = user.drafts.findIndex(o => o.mid === this.draft._id.toString())
            if (dUsIDX > -1) {
                user.drafts.splice(dUsIDX, 1)
                user.murals.push({ mid: this.mural._id.toString(), name: this.mural.name })
                user.save()
            }
            return this.draft.save()
                .then(() => this.writeMysql())
                .then(() => `Mural from draft '${this.mural.name}' has been saved`)
        })
    }

    errz (e) {
        throw new Error(e)
    }
    // end mD mural from draft

    updateMural (query, mysqlC) {
        this.mysqlConfig = mysqlC
        this.muralNewImage = null
        this.mural = null
        return this.dbCheckUser(query.user)
            .then(() => this.includeNewImages(query))
            .then(() => this.updateMuralFind(query))
            .then(mural => this.updateMuralData(query, mural))
            .then(() => this.updateModelDocs(query))
            .then(results => this.updateModelResponse(results))
            .catch(e => this.errz(e.message))
    }
    includeNewImages (query) {
        const images = query.body.imageInputs ? JSON.parse(query.body.imageInputs) : []
        if (images.length) {
            return aws.aS3(images)
                .then((imagesD) => {
                    this.muralNewImage = Object.keys(imagesD).map(key => imagesD[key])
                })
        }
    }

    updateMuralFind (data) {
        let query
        if (this.user.role === 'admin') {
            query = { _id: data.id }
        } else {
            query = { _id: data.id, 'user.mid': this.user._id.toString() }
        }
        return Mural.findOne(query).exec()
            .then((mural) => {
                if (!mural) {
                    return errz('This draft has already been approved')
                }
                return mural
            })
    }
    updateMuralData (query, mural) {
        const m = mural
        m.name = query.body.name
        m.freshMural = query.body.freshMural
        m.about = query.body.about
        m.address = query.body.address
        m.active = (!query.body.longitude || query.body.longitude === 33.33) ? false : query.body.active
        m.archive = query.body.archive
        m.city = query.body.city
        m.state = query.body.state
        m.zipcode = query.body.zipcode
        m.country = query.body.country
        m.latitude = query.body.latitude
        m.longitude = query.body.longitude
        m.youtube = query.body.youtube
        m.creationDate = query.body.creationDate
        m.recordCreated = query.body.recordCreated
        m.mainThumb = query.body.mainThumb
        m.vimeo = query.body.vimeo
        // m.imageInputs = req.body.imageInputs ? JSON.parse(req.body.imageInputs) : []
        m.location = {
            type: 'Point',
            coordinates: [query.body.longitude, query.body.latitude]
        }
        this.mural = m
    }
    updateModelDocs (query) {
        const artist = (query.body.artist && query.body.artist.length) ? query.body.artist : []
        const images = (this.muralNewImage && this.muralNewImage.length) ? this.muralNewImage : []
        const links = (query.body.links && query.body.links.length) ? query.body.links.map(i => i.link) : []
        const tags = (query.body.tags && query.body.tags.length) ? query.body.tags.map(i => i.tag) : []
        const organizations = (query.body.organs && query.body.organs.length) ? query.body.organs.map(i => i.organ) : []

        return Promise.all([
            this.artistImageHandler(artist, 'artist'),
            this.artistImageHandler(images, 'images'),
            this.docHandler(links, 'links'),
            this.docHandler(tags, 'tags'),
            this.docHandler(organizations, 'organizations')
        ])
    }

    updateModelResponse (results) {
        return this.mural.save()
            .then(() => this.writeMysql(true)) // create update to mysql instead of create
            .then(() => `Mural from draft '${this.mural.name}' has been saved`)
    }

    // create Draft
    createDraft (data, user) {
        const images = (data.imageInputs) ? JSON.parse(data.imageInputs) : []
        this.draft = new Draft({
            name: data.name || 'Unknown',
            freshMural: data.freshMural || true,
            about: data.about || '',
            draftDate: new Date(),
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            zipcode: data.zipcode || '',
            country: data.country || '',
            status: data.status || '',
            approved: false,
            artist: data.artist || [],
            tags: data.tags || [],
            organs: data.organs || [],
            links: data.links || [],
            latitude: data.latitude || '33.33',
            longitude: data.longitude || '33.33',
            youtube: data.youtube || '',
            mainThumb: data.mainThumb || '',
            creationDate: data.creationDate || new Date(),
            recordCreated: new Date(),
            vimeo: data.vimeo || '',
            location: {
                type: 'Point',
                coordinates: [data.longitude || '33.33', data.latitude || '33.33']
            },
            imageInputs: images
        })
        // console.log(this.draft)
        return this.dbCheckUser(user)
            .then(() => this.cDsaveDraft())
            .then(() => this.cDsaveUser())
            .then(() => 'Your draft has been created')
            .catch((e) => { this.errz(e.message) })
    }

    cDsaveDraft () {
        const dObj = { name: this.draft.name, mid: this.draft._id.toString() }
        this.user.drafts.push(dObj)
        this.draft.user = { name: this.user.email, mid: this.user._id.toString() }
        return this.draft.save()
    }
    cDsaveUser () {
        this.user.save((e, u) => {
            if (e) this.errz(e.message)
        })
    }
    // endCreate Draft

    updateDraft (query, req) {
        // console.log('ReqThumb:', req.body.mainThumb)
        const set = {
            $set: {
                name: req.body.name,
                freshMural: req.body.freshMural,
                about: req.body.about,
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                zipcode: req.body.zipcode,
                country: req.body.country,
                status: req.body.status,
                artist: req.body.artist,
                tags: req.body.tags,
                organs: req.body.organs,
                links: req.body.links,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                youtube: req.body.youtube,
                mainThumb: req.body.mainThumb,
                vimeo: req.body.vimeo,
                creationDate: req.body.creationDate,
                location: {
                    type: 'Point',
                    coordinates: [req.body.longitude, req.body.latitude]
                },
                imageInputs: req.body.imageInputs ? JSON.parse(req.body.imageInputs) : []
            }
        }
        return Draft.findOneAndUpdate(query, set, {}).exec()
            .then((draft) => {
                if (!draft) this.errz('Could not update Draft')
                return ' Draft Updated'
            }).catch(() => this.errz('Could not update Draft'))
    }
    isNull (data) {
        return (data === null) ? '' : data
    }
    isAddyNull (data) {
        return (data === null) ? '' : `, ${data}`
    }
    hasNewImage (item) {
        if (item.isCVNew === true) {
            return true
        } else if (item.images[0].newImage === true) {
            return true
        }
        return false;
    }
    writeMysql (update) {
        const { isNull: nu, isAddyNull: nua } = this

        this.mysqlConnection = mysql.createConnection({
            host: this.mysqlConfig.url,
            user: this.mysqlConfig.user,
            password: this.mysqlConfig.pass,
            database: this.mysqlConfig.db
        })
        this.mysqlConnection.connect()
        const item = this.mural
        const links = item.links.map(l => l.name) || null
        const tags = item.tags.map(t => t.name).join() || null
        const artist = item.artist.map(a => a.name).join(', ') || 'Unknown'
        const createDate = `${new Date(item.creationDate).getFullYear()}-01-01`
        const payload = {
            active: item.active,
            freshWhenAdded: item.freshMural,
            tags,
            muralTitle: item.name || 'Untitled',
            artistName: artist,
            creationDate: createDate,
            newImage: this.hasNewImage(item),
            urlThumb: (item.images.length) ? item.images[0].urlThumb : '00',
            urlLarge: (item.images.length) ? item.images[0].urlLarge : '00',
            imageResourceID: (item.images.length) ? item.images[0].name : '00',
            locationText: `${nu(item.address)}
${nu(item.city)}${nua(item.state)} ${nu(item.zipcode)}`,
            aboutArtistText: item.artist[0] ? nu(item.artist[0].about) : null,
            aboutThisText: nu(item.about),
            latitude: item.latitude,
            derelict: item.archive,
            longitude: item.longitude,
            additionalLink1: (links[0]) ? links[0].trim() : null,
            additionalLink2: (links[1]) ? links[1].trim() : null,
            additionalLink3: (links[2]) ? links[2].trim() : null
        }

        if (update) {
            this.mysqlConnection.query(
                'UPDATE Murals SET ? WHERE id = ?',
                [payload, this.mural.legacyID],
                (err, results, fields) => {
                    if (err) console.log(err)
                    this.mysqlConnection.end()
                })
        } else {
            this.mysqlConnection.query(
                'INSERT INTO Murals SET ?',
                payload,
                (err, results, fields) => {
                    // need to return id from mysql on save then write back to mongo
                    if (err) this.errz(err)
                    console.log('Results', results)
                    this.mural.legacyID = String(results.insertId)
                    this.mural.save()
                    this.mysqlConnection.end()
                })
        }
    }
    createArtist (query) {
    // this.s3 = (s3) ? Object.keys(s3).map(key => s3[key]) : null
    // const thumbID = (this.s3 && (d.mainThumb === '0')) ? this.s3[0].thumbId : d.mainThumb
        const { user, data } = query
        return new Promise((resolve, reject) => {
            this.dbCheckUser(user)
                .then(() => {
                    const artist = new Artist({
                        name: data.name,
                        about: data.about,
                        facebookLink: data.facebookLink,
                        instagramLink: data.instagramLink,
                        twitterLink: data.twitterLink,
                        youtubeLink: data.youtubeLink,
                        webUrl: data.webUrl,
                        murals: [],
                        user: {
                            name: this.user.email,
                            mid: this.user._id
                        },
                        followed: [],
                        spottedCount: 0,
                        likesCount: 0
                    })
                    if (data.picture[0].size > 0) {
                        localImages.artistPicHandle(data.picture)
                            .then((result) => {
                                artist.picture = result.key
                                artist.save((errA, result) => {
                                    if (errA) reject('Could not locate artist')
                                    this.user.artist.push({ name: artist.name, mid: artist._id })
                                    this.user.save((err, result) => {
                                        if (err) {
                                            reject(new Error('Could not locate artist'))
                                        } else {
                                            resolve('Artist Created')
                                        }
                                    })
                                })
                            })
                    } else {
                        artist.save((errA, result) => {
                            if (errA) reject('Could not locate artist')
                            this.user.artist.push({ name: artist.name, mid: artist._id })
                            this.user.save((err, result) => {
                                if (err) {
                                    reject(new Error('Could not locate artist'))
                                } else {
                                    resolve('Artist Created')
                                }
                            })
                        })
                    }
                })
        })
    }

    artistUpdate (query) {
        // console.log('Query DAta', query.data)
        return new Promise((resolve, reject) => {
            if (query.user.role === 'admin') {
                return Artist.findById(query.id, (err, artist) => {
                    if (err) reject(new Error('Could not locate artist'))
                    console.log('artist', artist)
                    return this.artistQueryUpdate(query, artist, resolve, reject)
                })
            }
            return Artist.findOne({ _id: query.id, 'user.mid': query.user._id }, (err, artist) => {
                if (err) reject(new Error('Could not locate artist'))
                return this.artistQueryUpdate(query, artist, resolve, reject)
            })
        })
    }

    artistQueryUpdate (query, artist, resolve, reject) {
        // console.log("Query data for artist: -- ", query.data.picture[0].originalFilename)
        Object.keys(query.data).forEach((key) => {
            if (key !== 'picture') {
                artist[key] = query.data[key]
            }
        })
        if (query.data.picture[0].size > 0) {
            localImages.artistPicHandle(query.data.picture)
                .then((image) => {
                    artist.picture = image.key
                    artist.save((errA, result) => {
                        if (errA) reject(new Error('Could not locate artist'))
                        this.artistMuralHandler(artist, 'mural').then(() => {
                            resolve('Artist updated Inside')
                        })
                    })
                })
        } else {
            artist.save((errA, result) => {
                if (errA) reject(new Error('Could not locate artist'))
                this.artistMuralHandler(artist, 'mural').then(() => {
                    resolve('Artist updated Inside')
                })
            })
        }
    }
}

class MakeData extends DocMapping(DataUtils(CreateMongoData)) {}
module.exports = MakeData
