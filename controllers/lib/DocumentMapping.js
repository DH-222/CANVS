const Artist = require('../../models/Artist')
const Image = require('../../models/Image')
const Tag = require('../../models/Tag')
const Organization = require('../../models/Organization')
const Link = require('../../models/Link')
const Mural = require('../../models/Mural')

// handle mapping of tags, images, organizations, links to murals, artist, user
// needs error handling work
// need to sanitize body images
const DocMapping = superclass => class extends superclass {
    constructor () {
        super()
        this.docArgFunc = {
            links: data => this.formArguments(data, 0, Link, 'links'),
            tags: data => this.formArguments(data, 0, Tag, 'tags'),
            organizations: data => this.formArguments(data, 0, Organization, 'organizations'),
            artist: 'artistCreateUpdate',
            images: 'imageCreateUpdate',
            mural: 'muralUpdate'
        }
        this.formArguments = (keys, idx, targetDoc, model1) => ({
            keys,
            idx,
            targetDoc,
            model1
        })
    }

    artistImageHandler (allData, type) {
        // console.log("allData, type",allData, "  ",type)
        return new Promise((resolve, reject) => {
            const idx = 0
            if (allData.length > 0) {
                this.artistImageRecursion(idx, allData, this.docArgFunc[type]).then((result) => {
                    if (result === 'done') {
                        // console.log('DONEARTIMG', type)
                        resolve({ error: false, data: `${type}(s) have been saved` })
                    }
                }).catch((err) => {
                    resolve({ error: true, data: `${type}(s) has errors ---- ${err}` })
                })
            } else {
                resolve({ error: true, data: `${type}(s) has no data to inputted` })
            }
        })
    }

    artistMuralHandler (allData, type) {
    //console.log("allData, type",allData, "  ",type)
        return new Promise((resolve, reject) => {
            const idx = 0
            if (allData.murals.length > 0) {
                this.artistMuralRecursion(idx, allData, this.docArgFunc[type]).then((result) => {
                    if (result === 'done') {
                        resolve({ error: false, data: `${type}(s) have been saved` })
                    }
                }).catch((err) => {
                    resolve({ error: true, data: `${type}(s) has errors ---- ${err}` })
                })
            } else {
                resolve({ error: true, data: `${type}(s) has no data to inputted` })
            }
        })
    }

    artistImageRecursion (idx, allData, docType) {
        return this[docType](idx, allData).then((result) => {
            const finalWrite = (result >= (allData.length - 1))
            if (finalWrite) {
                return 'done'
            }
            const i = idx + 1
            return this.artistImageRecursion(i, allData, docType)
        })
    }

    artistMuralRecursion (idx, allData, docType) {
        return this[docType](idx, allData).then((result) => {
            const finalWrite = (result >= (allData.murals.length - 1))
            if (finalWrite) {
                return 'done'
            }
            const i = idx + 1
            return this.artistMuralRecursion(i, allData, docType)
        })
    }

    docHandler (dataArr, type) {
        return new Promise((resolve, reject) => {
            if (dataArr.length > 0) {
                const args = this.docArgFunc[type](dataArr)
                this.docRecurseContainer(args).then((result) => {
                    if (result === 'done') {
                        // console.log('DONETAGGING', type)
                        resolve({ error: false, data: `${type}(s) have been saved` })
                    }
                }).catch((err) => {
                    resolve({ error: true, data: `${type}(s) has errors ---- ${err}` })
                })
            } else {
                resolve({ error: true, data: `${type}(s) has no data to inputted` })
            }
        })
    }

    docRecurseContainer (args) {
        return this.checkInputDocs(args).then((result) => {
            const finalWrite = (result >= (args.keys.length - 1))
            if (finalWrite) {
                return 'done'
            }
            args.idx += 1
            return this.docRecurseContainer(args)
        })
    }

    checkInputDocs (args) {
        return new Promise((resolve, reject) => {
            const { keys: k, idx: i, targetDoc } = args
            const name = k[i].trim()
            return targetDoc.findOne({ name }, (err, doc) => {
                if (err) console.log(err)
                this.createOrUpdateDoc(doc, args, name, resolve)
            })
        }).catch(() => { resolve({ error: true, data: `${name}(s) has no data to inputted` }) })
    }

    createOrUpdateDoc (doc, ar, name, resolve) {
        const { keys: k, idx: i, model1: m, targetDoc } = ar
        if (doc) {
            this.updateExistingDoc(doc)
                .then((modelD) => {
                    const docMap = { name: modelD.name, mid: modelD._id.toString() }
                    const hasDoc = this.mural[m].findIndex(n => n.mid === docMap.mid)
                    if (hasDoc < 0) {
                        this.mural[m].push(docMap)
                    }
                    resolve(i)
                }).catch(() => ({ error: true, data: `${name}(s) has no data to inputted` }))
        } else {
            this.createNewDoc(name, targetDoc, m)
                .then((modelD) => {
                    const docMap = { name: modelD.name, mid: modelD._id.toString() }
                    this.mural[m].push(docMap)
                    resolve(i)
                }).catch(() => ({ error: true, data: `${m}(s) has no data to inputted` }))
        }
    }

    createNewDoc (name, Model, modelname) {
        this[modelname] = new Model({
            name,
            murals: []
        })
        const docMap = { name: this.mural.name, mid: this.mural._id.toString() }
        this[modelname].murals.push(docMap)
        this[modelname].creationDate = new Date()
        return this[modelname].save()
    }

    updateExistingDoc (existingDoc) {
        const docMap = { name: this.mural.name, mid: this.mural._id.toString() }
        const hasDoc = existingDoc.murals.findIndex(n => n.mid === docMap.mid)
        // existingDoc.murals = this.addModelMap(existingDoc, 'murals', docMap)
        if (hasDoc < 0) {
            existingDoc.murals.push(docMap)
        }
        return existingDoc.save()
    }
    // this methid does not handle image updates in mural sets
    imageCreateUpdate (idx, imagesInput) {
        return new Promise((resolve, reject) => {
            const fullData = Object.assign(imagesInput[idx], {
                text: '',
                creationDate: new Date(),
                user: this.mural.user,
                murals: [],
                newImage: true
            })
            this.image = new Image(fullData)
            const docMap1 = { name: this.mural.name, mid: this.mural._id.toString() }
            this.image.murals.push(docMap1)
            this.image.save().then((err) => {
                const copy = Object.assign({}, this.image._doc)
                copy.mid = copy._id.toString()
                delete copy._id
                this.mural.images.push(copy)
                resolve(idx)
            })
        }).catch(() => { resolve({ error: true, data: `Image(s) has no data to inputted` }) })
    }

    createArtistDoc (idx, artD, resolve) {
        const name = artD.name
        this.artist = new Artist({
            name,
            about: (artD.about !== '') ? artD.about : null,
            facebookLink: (artD.facebookLink !== '') ? artD.facebookLink : null,
            instagramLink: (artD.instagramLink !== '') ? artD.instagramLink : null,
            twitterLink: (artD.twitterLink !== '') ? artD.twitterLink : null,
            youtubeLink: (artD.youtubeLink !== '') ? artD.youtubeLink : null,
            webUrl: (artD.webUrl !== '') ? artD.webUrl : null,
            picture: (artD.picture !== '') ? artD.picture : null,
            user: this.mural.user,
            followed: artD.followed || [],
            murals: []
        })

        const docMap = { name: this.mural.name, mid: this.mural._id.toString() }
        this.artist.murals.push(docMap)
        this.artist.save((err) => {
            if (err) return this.errorShow(err)
            const deepArt = Object.assign({}, this.artist._doc)
            deepArt.mid = deepArt._id.toString()
            delete deepArt._id
            this.mural.artist.push(deepArt)
            resolve(idx)
        }).catch(() => ({ error: true, data: `Artist(s) has no data to inputted` }))
    }

    muralUpdate (idx, artistData) {
        const data = artistData.murals[idx];
        return new Promise((resolve, reject) => {
            Mural.findById(data.mid, (err, mural) => {
                if (err) return this.errorShow(err)
                if (mural) {
                    const artistFind = mural.artist.findIndex(n => n.mid === artistData._id.toString())
                    if (artistFind > -1) {
                        const art = mural.artist[artistFind]
                        art.facebookLink = (artistData.facebookLink !== '') ? artistData.facebookLink : null
                        art.instagramLink = (artistData.instagramLink !== '') ? artistData.instagramLink : null
                        art.twitterLink = (artistData.twitterLink !== '') ? artistData.twitterLink : null
                        art.youtubeLink = (artistData.youtubeLink !== '') ? artistData.youtubeLink : null
                        art.webUrl = (artistData.webUrl !== '') ? artistData.webUrl : null
                        art.name = (artistData.name !== '') ? artistData.name : null
                        art.about = (artistData.about !== '') ? artistData.about : null
                        art.followed = artistData.followed
                        art.murals = artistData.murals
                        art.picture = (artistData.picture !== '' && artistData.picture !== null) ? artistData.picture : artistData.avatar
                    }
                    mural.save().then((result) => {
                        resolve(idx)
                    }).catch(() => { resolve({ error: true, data: `Mural data could not be saved` }) })
                }
            })
        }).catch(() => { resolve({ error: true, data: `Could find requested mural` }) })
    }

    artistCreateUpdate (idx, artistArr) {
        const data = artistArr[idx]
        const name = data.name
        return new Promise((resolve, reject) => {
            Artist.findOne({ name }, (err, art) => {
                if (err) return this.errorShow(err)
                if (art) {
                    art.facebookLink = (data.facebookLink !== '') ? data.facebookLink : null
                    art.instagramLink = (data.instagramLink !== '') ? data.instagramLink : null
                    art.twitterLink = (data.twitterLink !== '') ? data.twitterLink : null
                    art.youtubeLink = (data.youtubeLink !== '') ? data.youtubeLink : null
                    art.webUrl = (data.webUrl !== '') ? data.webUrl : null
                    this.artist = art
                    const docMap = { name: this.mural.name, mid: this.mural._id.toString() }
                    const hasDoc = this.artist.murals.findIndex(n => n.mid === docMap.mid)
                    if (hasDoc < 0) {
                        this.artist.murals.push(docMap)
                    }
                    art.save().then((result) => {
                        const deepArt = Object.assign({}, this.artist._doc)
                        deepArt.mid = deepArt._id.toString()
                        delete deepArt._id
                        const hasDoc = this.mural.artist.findIndex(n => n.mid === deepArt.mid)
                        if (hasDoc < 0) {
                            this.mural.artist.push(deepArt)
                        }
                        resolve(idx)
                    }).catch(() => { resolve({ error: true, data: `Image(s) has no data to inputted` }) })
                } else {
                    this.createArtistDoc(idx, data, resolve)
                }
            })
        }).catch(() => { resolve({ error: true, data: `Image(s) has no data to inputted` }) })
    }
}

module.exports = DocMapping
