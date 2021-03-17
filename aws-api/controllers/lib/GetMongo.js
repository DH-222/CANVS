// const Promise = require('bluebird');
const Mural = require('../../models/Mural')
const User = require('../../models/User')
const Artist = require('../../models/Artist')
const Image = require('../../models/Image')
const Tag = require('../../models/Tag')
const Organ = require('../../models/Organization')
const List = require('../../models/List')
// const ObjectId = require('mongoose').Types.ObjectId;
const Models = {
    mural: Mural,
    user: User,
    artist: Artist,
    image: Image,
    tag: Tag,
    organ: Organ,
    list: List
}
module.exports = class GetMongoData {
    constructor () {
        this.docMap = {
            mural: {},
            links: [],
            tags: [],
            organizations: [],
            images: [],
            likes: [],
            fav: [],
            artist: {}
        }
    }

    resetDocMap () {
        this.docMap = {
            mural: {},
            links: [],
            tags: [],
            organizations: [],
            images: [],
            likes: [],
            fav: [],
            artist: {}
        }
    }

    jsonAssemSingle () {
        const item = this.docMap
        const formData = {
            _id: item.mural._id,
            name: item.mural.name,
            active: item.mural.active,
            archive: item.mural.archive,
            address: item.mural.address,
            images: item.mural.images ? item.mural.images : [],
            freshMural: item.mural.freshMural,
            creationDate: `${new Date(item.mural.creationDate).getFullYear()}-01-01`,
            about: item.mural.about,
            legacyID: item.mural.legacyID,
            latitude: item.mural.latitude,
            longitude: item.mural.longitude,
            youtube: item.mural.youtube,
            vimeo: item.mural.vimeo,
            artist: item.mural.artist ? item.mural.artist : [],
            links: (item.mural.links) ? item.mural.links : [],
            organizations: (item.mural.organizations) ? item.mural.organizations : [],
            tags: (item.mural.tags) ? item.mural.tags : []
        }
        return formData
    }

    // mural single view full query
    getSingleModel (query, options, model) {
        this.resetDocMap()
        console.log('Query', query, model)
        return new Promise((resolve, reject) => {
            Models[model].findOne(query, options, (err, result) => {
                if (err) reject({ error: true, message: `Could not retieve data for ${model}`, err })
                if (result) {
                    this.docMap.mural = result
                    const data = this.jsonAssemSingle()
                    resolve({ data })
                    // Promise.all([this.getMuralArtist(result), this.getMuralTags(result), this.getMuralImages(result)])
                    //   .then(
                    //     () => {
                    //       const data = this.jsonAssemSingle();
                    //       resolve({ data });
                    //     },
                    //     (error) => {
                    //       reject({ status: 400, message: error });
                    //     }
                    //   );
                } else {
                    reject({ error: true, message: 'Could not get data point for you, or you might not have access to that Mural' })
                }
            })
        })
    }
    // end -- mural single view full query

    getModels (modelQuery, options, model) {
        const op = options || {}
        return new Promise((resolve, reject) => {
            console.log('Search Query', modelQuery)
            Models[model].count(modelQuery, (err, totalCount) => {
                if (err) { reject({ error: true, message: `Could not locate ${model}s, Please check query` }) }
                if (totalCount === 0) {
                    if (err) { reject({ error: true, message: `There are no results for data type ${model}s in your request` }) }
                }
                const pageReset = this.shouldResetPage(totalCount, op)
                Models[model].find(modelQuery, {}, op, (err1, models) => {
                    if (err1) reject({ error: true, message: 'Error creating pagination for model' })

                    if (!models || !models.length) {
                        reject({ error: true, message: `There are no results for data type ${model}s in your request` })
                    }
                    const totalPages = Math.ceil(totalCount / op.limit)
                    resolve({ totalPages, totalCount, pageReset, data: models })
                })
            })
        })
    }

    getLikeSpottedCount (modelQuery) {
    // const op = options || {};
    // Get mural data from artist id - likes aggregate count
    // dataQuery
        return new Promise((resolve, reject) => {
            Artist.findById(modelQuery._id).exec(result => result)
                .then((result) => {
                    console.log('Artist Found', result)
                    const ids = result.murals.map(mural => mural.mid)
                    console.log('Artist Found', ids)
                    Mural.find(modelQuery.dataQuery(ids), { spottedCount: 1, likesCount: 1 }, (err, results) => {
                        if (err) { reject({ error: true, message: 'Could not locate Murals, Please check query' }) }
                        if (!results || !results.length) {
                            return reject({ error: true, message: 'Could not locate Murals for spotted or like count' })
                        }
                        const add = (a, b) => a + b
                        const spottedCount = results.map(item => item.spottedCount).reduce(add)
                        const likesCount = results.map(item => item.likesCount).reduce(add)
                        console.log('Total Count: --', spottedCount)
                        resolve({ data: {
                            counts: {
                                spottedCount,
                                likesCount,
                                muralCount: ids.length
                            },
                            artistId: modelQuery._id,
                            muralIds: ids
                        } })
                    })
                })
        })
    }

    getMuralsFromModelMid (modelQuery, model, options) {
        return new Promise((resolve, reject) => {
            const op = options || {}
            Models[model].findById(modelQuery._id, (err, result) => {
                if (err || !result) {
                    return reject({ error: true, message: 'Could not locate model id provided' })
                }
                const ids = result.murals.map(mural => mural.mid)
                Mural.count(modelQuery.dataQuery(ids), (err, totalCount) => {
                    if (err) { reject({ error: true, message: 'Could not locate Murals, Please check query' }) }
                    if (totalCount === 0) {
                        if (err) { reject({ error: true, message: 'Could not locate Murals, Please check query' }) }
                    }
                    const pageReset = this.shouldResetPage(totalCount, op)
                    Mural.find(modelQuery.dataQuery(ids), {}, op, (err1, models) => {
                        if (err1) reject({ error: true, message: `There are no results for data type ${model}s in your request` })

                        if (!models || !models.length) {
                            reject({ error: true, message: `There are no results for data type ${model}s in your request` })
                        }
                        const totalPages = Math.ceil(totalCount / op.limit)
                        resolve({ totalPages, totalCount, pageReset, data: models })
                    })
                })
            })
        })
    }

    getModelsAggregate (modelQuery, options, model) {
        const op = options || {}
        return new Promise((resolve, reject) => {
            Models[model].aggregate(modelQuery, (err, totalCount) => {
                if (err) { reject({ error: true, message: 'Could not locate Murals, Please check query' }) }
                if (totalCount === 0) {
                    if (err) { reject({ error: true, message: 'Could not locate Murals, Please check query' }) }
                }
                const pageReset = this.shouldResetPage(totalCount, op)
                Models[model].find(modelQuery, {}, op, (err1, models) => {
                    if (err1) reject({ error: true, message: 'Error creating pagination for model' })

                    if (!models || !models.length) {
                        reject({ error: true, message: 'Please check page size and page requested' })
                    }
                    const totalPages = Math.ceil(totalCount / op.limit)
                    resolve({ totalPages, totalCount, pageReset, data: models })
                })
            })
        })
    }

    getModel (modelQuery, options, model) {
        const op = options || {}
        return new Promise((resolve, reject) => {
            Models[model].find(modelQuery, {}, op, (err1, models) => {
                console.log(op, modelQuery)
                if (!models || !models.length) {
                    reject({ error: true, message: `Could not find requested ${model}` })
                }
                resolve({ data: models })
            })
        })
    }

    getQuickMural (modelQuery) {
        const include = {
            _id: 1,
            name: 1,
            images: 1
        }
        return new Promise((resolve, reject) => {
            Models.murals.find(modelQuery, include, (err1, murals) => {
                if (!murals || !murals.length) {
                    reject({ error: true, message: 'Could not find requested mural' })
                }
                resolve({ data: murals })
            })
        })
    }

    getMuralLocation (coords) {
        const returnFields = {
            latitude: 1,
            longitude: 1,
            images: 1,
            name: 1,
            address: 1,
            state: 1,
            zipcode: 1,
            likes: 1,
            spotted: 1,
            freshMural: 1,
            artist: 1
        }
        return new Promise((resolve, reject) => {
            Mural.find({
                location: {
                    $near: {
                        $maxDistance: coords.distance,
                        $geometry: {
                            type: 'Point',
                            coordinates: [coords.lon, coords.lat]
                        }
                    }
                }
            }, returnFields, (err, results) => {
                if (err) reject({ error: true, message: 'Could  not find murals within those coord parameters' })
                resolve({ data: results })
            })
        })
    }

    getMuralLocationPaged (coords, options, user) {
        const op = options || {}
        const arrayQuery = { 'spotted.legacy': ['DA713FD9-9E48-416E-B375-307C0646E17F'] }
        // 'likes.legacy': '484F783C-B5D6-4DF7-87CE-5AF13F6552C1',
        // 'spotted.legacy': '484F783C-B5D6-4DF7-87CE-5AF13F6552C1',
        const coordQuery = {
            // about: null,
            // 'spotted.legacy': '484F783C-B5D6-4DF7-87CE-5AF13F6552C1',
            active: true,
            location: {
                $near: {
                    $maxDistance: coords.distance,
                    $geometry: {
                        type: 'Point',
                        coordinates: [coords.lon, coords.lat]
                    }
                }
            }
        }
        return new Promise((resolve, reject) => {
            Mural.count(coordQuery, (err, totalCount) => {
                if (err) reject({ error: true, message: 'Could  not find murals within those coord parameters' })
                if (totalCount === 0) {
                    reject({ error: true, message: 'There are no results for data type in your request' })
                }
                const pageReset = this.shouldResetPage(totalCount, op)
                Mural.find(coordQuery, {}, op, (err1, results) => {
                    if (err1) reject({ error: true, message: 'Error creating pagination for model' })

                    if (!results || !results.length) {
                        reject({ error: true, message: 'There are no results for data type in your request' })
                    }
                    const totalPages = Math.ceil(totalCount / op.limit)
                    resolve({ totalPages, totalCount, pageReset, data: results })
                })
            })
        })
    }

    shouldResetPage (totalCount, op) {
        if ((totalCount < op.limit) || (totalCount === op.limit)) {
            op.skip = 0
            return true
        } else if ((op.skip > totalCount)) {
            op.skip = 0
            return true
        }
        return false
    }

    getAllMurals () {
        Mural.find({ active: true }, {}, {}, (err1, results) => {
            if (err1) reject({ error: true, message: 'Error creating pagination for model' })

            if (!results || !results.length) {
                reject({ error: true, message: 'There are no results for data type in your request' })
            }
            resolve({ data: results })
        })
    }
}
