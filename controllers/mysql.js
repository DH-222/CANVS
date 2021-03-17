const mysql = require('mysql')
const bluebird = require('bluebird')
const Mural = require('../models/Mural')
const User = require('../models/User')
const Link = require('../models/Link')
const List = require('../models/List')
const Artist = require('../models/Artist')
const Organ = require('../models/Organization')
const Image = require('../models/Image')
const Tag = require('../models/Tag')
const zipcodes = require('zipcodes')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const uploadedFilesPath = path.join(__dirname, 'uploads/')
const myqlResults = []
const popResults = []
let mainIndex = 0
let mainUser
let allUsers
let list
let mural
let item
let artist
let image
// this obj hass to be reset...
let listMetrics = {
    spotted: [],
    likes: []
}
const organLookUp = {
    jcmap: 'Jersey City Mural Arts Program',
    'green villian': 'Green Villian',
    'savage habbit': 'Savage Habbit',
    'the new allen': 'The New Allen',
    'bushwick collective': 'The Bushwick Collective',
    'jmz walls': 'JMZ Walls',
    mana: 'Mana Urban Arts Project',
    '501see': '501see',
    'audubon murals': 'Audubon Mural Project',
    'The LISA Project': 'The L.I.S.A. Project',
    groundswell: 'Groundswell Community Mural Project',
    seawalls: 'Sea Walls Project',
    'The L.I.S.A. Project': 'The L.I.S.A. Project',
    'the lisa project': 'The L.I.S.A. Project',
    Groundswell: 'Groundswell Community Mural Project',
    'mural festival': 'Mural Festival',
    'life is beautiful': 'Life is Beautiful',
    spreadartnyc: 'Spread Art NYC',
    'just kids': 'Just Kids Official',
    'Pow Wow Worcester': 'Pow Wow Worcester',
    '#notacrime': 'Education is Not a Crime',
    'outerspace project': 'The Outer Space Project',
    '100 gates': '100 Gates Project',
    'sodo track': 'Sodo Track',
    'welling court': 'Welling Court Mural Project',
    'monument art': 'Monument Art Project'
}
// const listd = new List({
//     name: 'Master Record',
//     spotted: [],
//     likes: [],
//     artistFollows: [],
//     draftImages: []
// })
// listd.save()

// const ids = ['5bb61c0adb17d63d2fd0735d', '5c5f6746322cc5b288c634b4', '5c5f677f322cc5b288c634b5', '5c5f67a2322cc5b288c634b6'];
// (() => User.find({ _id: { $in: ids } }, (err, users) => {
//     if (err) throw err
//     List.findById('5c44d0975e8f745b54508f3f', (err, li) => {
//         if (err) console.log('ERRROOOR: ', err)
//         list = li
//         // list.name = 'Master Record'
//         allUsers = users
//         // console.log("User Mysql: --", user1);
//         // startMysql()
//     })
// }))()
const dir = 'uploads/'
const deletionArr = []

const checkFS = folder => new Promise((resolve, reject) => {
    if (fs.existsSync(folder)) {
        fs.lstat(folder, (err, data) => {
            if (err) {
                resolve('error')
            }
            const breakDate = new Date()
            const dirDate = new Date(data.birthtimeMs)
            breakDate.setDate(breakDate.getDate() - 1)
            if (+dirDate < +breakDate) {
                // rimraf(folder, () => {
                //     resolve('deleted')
                // })
                console.log("deleted")
                resolve('deleted')
            }
            resolve('none')
        })
    } else {
        resolve('error')
    }
})

const runImageDelete = (it, data, mainCallBack) => new Promise((resolve, reject) => {
    const folder = uploadedFilesPath + data[it]
    return checkFS(folder).then((result) => {
        if (result === 'deleted' || result === 'error') {
            deletionArr.push(it)
        }
        it += 1
        if (it >= data.length - 1) {
            return mainCallBack()
        }
        runImageDelete(it, data, mainCallBack)
    })
})

// List.findById('5c44d0975e8f745b54508f3f', (err, li) => {
//     if (err) console.log('ERRROOOR: ', err)
//     const mainCallBack = callBack('res', 'req')
//     runImageDelete(0, li.draftImages, mainCallBack)
// })

const callBack = (res, req) => () => {
    console.log('FInished Array: -- ', deletionArr, 'args: --', res, req)
}

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'root',
//     database: 'testdb'
//     // database: 'canvs_test'
// })
// connection.connect()

//
// const startMysql = () => {
//     connection.query('SELECT * from Murals', (error, results) => {
//         if (error) console.log('ERRROOOR: ', err)
//         myqlResults = results
//         connection.query('SELECT * from Popularity', (error2, pResults) => {
//             if (error2) console.log('ERRROOOR: ', err)
//             popResults = pResults
//             extractMysqlData(mainIndex)
//         })
//     })
// }

// const startMysql = () => {
//     connection.query('SELECT * from Murals', (error, results) => {
//         if (error) console.log('ERRROOOR: ', err)
//         results.forEach((item) => {
//             console.log('itemAbout: --', item.aboutThisText, ' IdLEgacy: -- ', item.id)
//             Mural.update({ legacyID: String(item.id) }, { about: item.aboutThisText }).exec((err, data) => {
//                // if (err) console.log(err)
//                 //console.log('data:', data)
//             })
//         })
//     })
// }

const resetListMetrics = () => {
    listMetrics = {
        spotted: [],
        likes: []
    }
}

const alignPopularity = (muralId) => {
    let seen = 0
    let favorite = 0
    const legacySeenUsers = []
    const legacyFavUsers = []
    popResults.forEach((item) => {
        if (item.muralID === muralId && item.userStatement === 'seen') {
            seen++
            legacySeenUsers.push(item.userIdentifier)
        }
        if (item.muralID === muralId && item.userStatement === 'favorite') {
            favorite++
            legacyFavUsers.push(item.userIdentifier)
        }
    })
    return {
        seen,
        legacySeenUsers,
        favorite,
        legacyFavUsers
    }
}

exports.index = (req, res) => {
    res.render('account/mysql', {
        title: 'Mysql'
    })
}

const extractMysqlData = (i) => {
    if (i <= myqlResults.length - 1) {
        mainUser = allUsers[Math.floor(Math.random() * allUsers.length)]

        // if (i <= 200) {
        // console.log('Results mysql: --', myqlResults.length)
        item = myqlResults[i]
        mural = new Mural(createMural(item))
        listMetricData()
        artistHandler()
        // const deleteme = createMural(item)

        // console.log('Data All', deleteme.address)
        // console.log('Create Handler: --, ', new Date ('2015-01-01').getFullYear());
        // extractMysqlData(i + 1)
    }
}

const listMetricData = () => {
    if (mural.spotted.legacy.length) {
        listMetrics.spotted.push({ mid: mural._id.toString(), legacyUser: mural.spotted.legacy, modelType: 'mural' })
    }
    if (mural.likes.legacy.length) {
        listMetrics.likes.push({ mid: mural._id.toString(), legacyUser: mural.likes.legacy, modelType: 'mural' })
    }
}

const getAddress = (item) => {
    const { locationText: addr } = item
    const lookup = ['Jersey City', 'Brooklyn', 'New York', 'Astoria', 'Newark',
        'Kearney', 'Worcester', 'Secaucus', 'Bronx', 'Jamaica', 'Woodhaven', 'Yonkers',
        'Atlanta', 'Seattle', 'San Diego', 'Ridgewood', 'Las Vegas', 'Flushing', 'Downtown', 'Montreal']
    let hit = addr
    lookup.forEach((city) => {
        if (addr.indexOf(city) > 0) {
            const temp = addr.split(city)[0]
            hit = temp.replace(',', '')
        }
    })
    return hit
}

const locateZip = (item) => {
    let zipcode
    if (item.locationText) {
        const { locationText: addr } = item
        if (addr.indexOf('QC H') > 0) {
            zipcode = addr.split('QC ')[1].split(' ')[0]
        } else if (addr.indexOf('QC H') <= 0) {
            zipcode = addr.substring(addr.length - 5, addr.length)
        }
        return {
            data: zipcodes.lookup(zipcode) || null,
            zip: zipcode
        }
    }
    return {
        data: null,
        zip: null
    }
}

const createMural = (item) => {
    const locale = locateZip(item)
    const rDate = item.recordCreated ? new Date(item.recordCreated).toISOString() : new Date().toISOString()
    const cDate = item.creationDate ? new Date(item.creationDate).toISOString() : new Date().toISOString()
    const seenFavorite = alignPopularity(item.id)
    return {
        name: item.muralTitle || 'Untitled',
        freshMural: !!(item.freshWhenAdded),
        active: !!(item.active),
        about: item.aboutThisText || null,
        address: getAddress(item),
        zipcode: locale.zip || null,
        state: locale.data ? locale.data.state : null,
        city: locale.data ? locale.data.city : null,
        country: locale.data ? locale.data.country : null,
        legacyID: item.id,
        spotted: { legacy: seenFavorite.legacySeenUsers, users: [] },
        spottedCount: seenFavorite.seen,
        likesCount: seenFavorite.favorite,
        likes: { legacy: seenFavorite.legacyFavUsers, users: [] },
        isCVNew: false,
        longitude: item.longitude,
        latitude: item.latitude,
        location: {
            type: 'Point',
            coordinates: [item.longitude, item.latitude]
        },
        archive: !!(item.derelict),
        user: { name: mainUser.email, mid: mainUser._id.toString() },
        creationDate: cDate,
        recordCreated: rDate
    }
}
const createArtist = () => {
    const name = item.artistName || 'Unknown Artist'
    artist = new Artist({
        name,
        about: item.aboutArtistText,
        user: { name: mainUser.email, mid: mainUser._id.toString() },
        creationDate: item.recordCreated,
        murals: [],
        facebookLink: '',
        instagramLink: '',
        twitterLink: '',
        youtubeLink: '',
        webUrl: '',
        followed: []
    })
    const muralId = mural._id.toString()
    const artistId = artist._id.toString()
    const docMap = { name: mural.name, mid: muralId }
    artist.murals = mapModels(artist, 'murals', docMap)
    artist.save((error) => {
        if (error) console.log('ERRROOOR: ', error)
        const { about, user, murals, facebookLink, instagramLink, twitterLink, youtubeLink, webUrl, picture } = artist
        const docMap = { name: artist.name, mid: artistId, about, user, murals, facebookLink, instagramLink, twitterLink, youtubeLink, webUrl, picture }
        mural.artist = mapModels(mural, 'artist', docMap)
        mainUser.artist = mapModels(mainUser, 'artist', { name: artist.name, mid: artistId })
        mainUser.save()
        imageHandler()
    }).catch((error) => {
        if (error) console.log('ERRROOOR: Artist Create', error)
    })
}
// magic maps artist, tags, images, links, organizations
const mapModels = (model, doc, obj) => {
    let found = false
    const returnArr = (model[doc]) ? model[doc].map(item => item) : []
    for (let i = 0; i < returnArr.length; i++) {
        if (returnArr[i].mid === obj.mid) {
            found = true
        }
    }
    if (!found) {
        returnArr.push(obj)
    }
    return returnArr
}

const createImage = () => {
    const imgName = (item.imageResourceID !== null) ? item.imageResourceID.toLowerCase() : 'default'
    image = new Image({
        name: imgName,
        urlThumb: `legacy/mural_thumb_${imgName}.jpg`,
        urlLarge: `legacy/mural_large_${imgName}.jpg`,
        thumbName: `mural_thumb_${imgName}.jpg`,
        largeName: `mural_large_${imgName}.jpg`,
        newImage: false,
        thumbId: imgName,
        text: '',
        user: { name: mainUser.email, mid: mainUser._id.toString() }
    })
    const muralId = mural._id.toString()
    const imageId = image._id.toString()
    const artistId = artist._id.toString()
    image.murals = mapModels(image, 'murals', { name: mural.name, mid: muralId })
    image.artist = mapModels(image, 'artist', { name: artist.name, mid: artistId })
    image.save((error) => {
        if (error) console.log('ERRROOOR: ', err)
        const copy = Object.assign({}, image._doc)
        copy.mid = copy._id.toString()
        delete copy._id
        mural.images = mapModels(mural, 'images', copy)
        mural.mainthumb = image.thumbId
        linkHandler()
    }).catch((error) => {
        if (error) console.log('ERRROOOR: Image create', error)
    })
}

const createTag = (name) => {
    const tag = new Tag({
        name,
        murals: [],
        artist: []
    })
    const docMap = { name: mural.name, mid: mural._id.toString() }
    tag.murals = mapModels(tag, 'murals', docMap)
    return tag.save()
}

const createOrgan = (name) => {
    const organ = new Organ({
        name,
        murals: []
    })
    const docMap = { name: mural.name, mid: mural._id.toString() }
    organ.murals = mapModels(organ, 'murals', docMap)
    return organ.save()
}

const createLink = (name) => {
    const link = new Link({
        name,
        murals: []
    })
    const docMap = { name: mural.name, mid: mural._id.toString() }
    link.murals = mapModels(link, 'murals', docMap)
    return link.save().catch((error) => {
        if (error) console.log('ERRROOOR: link create', error)
    })
}

const imageHandler = () => {
    Image.findOne({ name: `${item.imageResourceID}.jpg` }, (err, img) => {
        if (err) return err
        if (img) {
            image = img
            linkHandler()
        } else {
            createImage()
        }
    }).catch((error) => {
        if (error) console.log('ERRROOOR:  Image find one', error)
    })
}

const artistHandler = () => {
    const name = item.artistName || 'Unknown Artist'
    Artist.findOne({ name }, (err, art) => {
        if (err) return err
        if (art) {
            const muralId = mural._id.toString()
            const artistId = art._id.toString()
            artist = art
            artist.murals = mapModels(artist, 'murals', { name: mural.name, mid: muralId })
            art.save((error) => {
                if (error) console.log('ERRROOOR: ', err)
                const { about, user, murals, facebookLink, instagramLink, twitterLink, youtubeLink, webUrl, picture } = artist
                const docMap = { name: art.name, mid: artistId, about, user, murals, facebookLink, instagramLink, twitterLink, youtubeLink, webUrl, picture }
                mural.artist = mapModels(mural, 'artist', docMap)
                mainUser.artist = mapModels(mainUser, 'artist', { name: art.name, mid: artistId })
                imageHandler()
            }).catch((error) => {
                if (error) console.log('ERRROOOR: Artist Save', error)
            })
        } else {
            createArtist()
        }
    }).catch((error) => {
        if (error) console.log('ERRROOOR: Artist Find one', error)
    })
}

const linkHandler = () => {
    const linksArr = getLinks()
    if (linksArr.length > 0) {
        createUpdateLink(linksArr, 0)
    } else {
        tagHandler()
    }
}

const tagHandler = () => {
    if (item.tags) {
        const allTags = item.tags.split(',')
        createUpdateTag(allTags, 0)
    } else {
        finalWrite()
    }
}

const updateTag = (existingTag) => {
    const docMap = { name: mural.name, mid: mural._id.toString() }
    existingTag.murals = mapModels(existingTag, 'murals', docMap)
    return existingTag.save().catch((error) => {
        if (error) console.log('ERRROOOR: link create', error)
    })
}

const updateOrgan = (existingOrgan) => {
    const docMap = { name: mural.name, mid: mural._id.toString() }
    existingOrgan.murals = mapModels(existingOrgan, 'murals', docMap)
    return existingOrgan.save().catch((error) => {
        if (error) console.log('ERRROOOR: link create', error)
    })
}

const updateLinks = (existingLink) => {
    const docMap = { name: mural.name, mid: mural._id.toString() }
    existingLink.murals = mapModels(existingLink, 'murals', docMap)
    return existingLink.save()
}

const createUpdateTag = (allTags, idx) => {
    if (idx <= allTags.length - 1) {
        const isFinal = (idx === allTags.length - 1)
        const name = allTags[idx].trim()
        if (organLookUp[name]) {
            Organ.findOne({ name: organLookUp[name] }, (err, existingOrgan) => {
                if (err) return `ERROR: -- >${err}`
                if (existingOrgan) {
                    updateOrgan(existingOrgan).then(() => {
                        const dT = existingOrgan._id.toString()
                        const docMap = { name: organLookUp[name], mid: dT }
                        mural.organizations = mapModels(mural, 'organizations', docMap);
                        (isFinal === true) ? finalWrite() : createUpdateTag(allTags, idx + 1)
                    }).catch((error) => {
                        if (error) console.log('ERRROOOR: Tag Find one', error)
                    })
                } else {
                    createOrgan(organLookUp[name]).then((savedOrgan) => {
                        const sT = savedOrgan._id.toString()
                        const docMap = { name: organLookUp[name], mid: sT }
                        mural.organizations = mapModels(mural, 'organizations', docMap);
                        (isFinal === true) ? finalWrite() : createUpdateTag(allTags, idx + 1)
                    }).catch((error) => {
                        if (error) console.log('ERRROOOR: Tag create', error)
                    })
                }
            })
        } else {
            Tag.findOne({ name }, (err, existingTag) => {
                if (err) return `ERROR: -- >${err}`
                if (existingTag) {
                    updateTag(existingTag).then(() => {
                        const dT = existingTag._id.toString()
                        const docMap = { name, mid: dT }
                        mural.tags = mapModels(mural, 'tags', docMap);
                        (isFinal === true) ? finalWrite() : createUpdateTag(allTags, idx + 1)
                    }).catch((error) => {
                        if (error) console.log('ERRROOOR: Tag Find one', error)
                    })
                } else {
                    createTag(name).then((savedTag) => {
                        const sT = savedTag._id.toString()
                        const docMap = { name, mid: sT }
                        mural.tags = mapModels(mural, 'tags', docMap);
                        (isFinal === true) ? finalWrite() : createUpdateTag(allTags, idx + 1)
                    }).catch((error) => {
                        if (error) console.log('ERRROOOR: Tag create', error)
                    })
                }
            })
        }
    }
}
const createUpdateLink = (allLinks, idx) => {
    if (idx <= allLinks.length - 1) {
        const isFinal = (idx === allLinks.length - 1)
        const name = allLinks[idx].trim()
        Link.findOne({ name }, (err, existingLink) => {
            if (err) return `ERROR: -- >${err}`
            if (existingLink) {
                const dL = existingLink._id.toString()
                updateLinks(existingLink).then(() => {
                    const docMap = { name, mid: dL }
                    mural.links = mapModels(mural, 'links', docMap);
                    (isFinal === true) ? tagHandler() : createUpdateLink(allLinks, idx + 1)
                }).catch((error) => {
                    if (error) console.log('ERRROOOR: link update', error)
                })
            } else {
                createLink(name).then((savedLink) => {
                    const sL = savedLink._id.toString()
                    const docMap = { name, mid: sL }
                    mural.links = mapModels(mural, 'links', docMap);
                    (isFinal === true) ? tagHandler() : createUpdateLink(allLinks, idx + 1)
                }).catch((error) => {
                    if (error) console.log('ERRROOOR: link create', error)
                })
            }
        })
    }
}

const finalWrite = () => {
    const muralId = mural._id.toString()
    mainIndex++
    mural.save(() => {
        const docMap = { name: mural.name, mid: muralId }
        mainUser.murals = mapModels(mainUser, 'murals', docMap)
        list.spotted = listMetrics.spotted
        list.likes = listMetrics.likes

        mainUser.save(() => {
            list.save(() => {
                console.log('Record Wrote', mainIndex)
                extractMysqlData(mainIndex)
            }).catch((error) => {
                if (error) console.log('ERRROOOR: List Save', error)
            })
        }).catch((error) => {
            if (error) console.log('ERRROOOR: User save', error)
        })
    }).catch((error) => {
        if (error) console.log('ERRROOOR: Mural create', error)
    })
}

let getLinks = () => {
    const returnArray = []
    if (item.additionalLink1) returnArray.push(item.additionalLink1)
    if (item.additionalLink2) returnArray.push(item.additionalLink2)
    if (item.additionalLink3) returnArray.push(item.additionalLink3)
    return returnArray
}
