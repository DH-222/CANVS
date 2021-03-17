const fs = require('fs')
const multiparty = require('multiparty')
const path = require('path')
const gm = require('gm').subClass({ imageMagick: true })
const aws = require('./awsS3')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')

const maxFileSize = 0
const uploadedFilesPath = path.join(__dirname, 'uploads/profiles')
const uploadedFilesPathArtist = path.join(__dirname, 'uploads/artists')
const uuidv1 = require('uuid/v1')

const User = require('../models/User')

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
const lookUp = {
    JPEG: 'jpeg',
    PNG: 'png'
}
let userD
const currentUser = id => User.findById(id, exclude).exec(user => user)

const isValid = size => maxFileSize === 0 || size < maxFileSize

const moveUploadedFile = (file, user) => {
    userD = user
    const ext = path.extname(file.path)
    file.name = `profile--${user._id}--${uuidv1()}${ext}`
    const mainDir = `${uploadedFilesPath}/`
    const filePath = mainDir + file.name
    return moveFile(mainDir, file, filePath)
}

const moveFile = (mainDir, file, filePath) => new Promise((resolve, reject) => {
    mkdirp(mainDir, (error) => {
        let sourceStream,
            destStream
        if (error) {
            reject()
        } else {
            sourceStream = fs.createReadStream(file.path)
            destStream = fs.createWriteStream(filePath)

            sourceStream
                .on('error', (error) => {
                    destStream.end()
                    reject()
                })
                .on('end', () => {
                    destStream.end()
                    resolve({ filePath, mainDir, name: file.name })
                })
                .pipe(destStream)
        }
    })
})

const formatGM = fData => new Promise((resolve, reject) => {
    const image = gm(fData.filePath)
    image.format((err, value) => {
        image.size((err, size) => {
            const wd = size.width
            if (wd > 2400) {
                image.resize(2400)
            }
            image.write(`${fData.mainDir}/${fData.name}`, (err) => {
                if (err) {
                    reject()
                } else {
                    resolve({ name: fData.name })
                }
            })
        })
    })
})

exports.profilePicHandle = (user, data) => new Promise((resolve, reject) => {
    if (!isValid(data[0].size)) {
        reject(new Error('Pic is too large'))
    }
    moveUploadedFile(data[0], user)
        .then(data => formatGM(data))
        .then(fileData => aws.aS3Profiles(fileData, 'profiles'))
        .then(images => resolve(images))
        .catch((err) => reject(new Error(err)))
})

const moveUploadedFileArtist = (file) => {
    const ext = path.extname(file.path)
    file.name = `artist--${uuidv1()}${ext}`
    const mainDir = `${uploadedFilesPathArtist}/`
    const filePath = mainDir + file.name
    console.log('Did we get to file path?', filePath)
    return moveFile(mainDir, file, filePath)
}

exports.artistPicHandle = data => new Promise((resolve, reject) => {
    // const form = new multiparty.Form()
    // return form.parse(req, (err, fields, files) => {
    // onSimpleUpload(fields, files.file[0], res, req.user.id, req.body.imageType)
    if (!isValid(data[0].size)) {
        reject(new Error('Pic is too large'))
    }
    return moveUploadedFileArtist(data[0])
        .then(file => formatGM(file))
        .then(fileData => aws.aS3Profiles(fileData, 'artists'))
        .then(images => resolve(images))
        .catch(err => reject(new Error(err)))
    // })
})
