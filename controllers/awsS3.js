const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const uuidv1 = require('uuid/v1')
const gm = require('gm')

const filesPath = path.join(__dirname, 'uploads')
const filesPaths = {
    profiles: path.join(__dirname, 'uploads/profiles'),
    artists: path.join(__dirname, 'uploads/artists')
}
const lookUp = {
    JPEG: 'image/jpeg',
    PNG: 'image/png'
}
AWS.config.update({
    accessKeyId: 'AKIAIOROFFFZWFYDFFIQ',
    secretAccessKey: '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'
})

const s3 = new AWS.S3()

const getImageFormat = imgLoc => new Promise((resolve, reject) => {
    gm(imgLoc).format((err, value) => {
        if (err) reject('issues with image format')
        resolve(lookUp[value])
    })
}).catch(() => 'Could not save image')

const uploadS3 = (imgLoc, uuid, oldImage) =>
    new Promise((resolve, reject) => {
        getImageFormat(imgLoc).then((format) => {
            const params = {
                ACL: 'public-read',
                Bucket: process.env.S3_BUCKET,
                Body: fs.createReadStream(imgLoc),
                Key: `${uuid}/${path.basename(imgLoc)}`,
                ContentType: 'image/png'
            }

            s3.upload(params, (err, data) => {
                if (err) return reject(err)
                data.uuid = uuid
                data.name = path.basename(imgLoc)
                data.oldName = oldImage.oldName
                data.thumbId = oldImage.uuid
                resolve(data)
            })
        })
    }).catch(() => { throw new Error('Could not save images') })

const formThumbsLarge = (imageArr) => {
    const newArr = []
    imageArr.forEach((image) => {
        const name = image.name
        const tempThumb = Object.assign({}, image)
        const tempLarge = Object.assign({}, image)
        tempThumb.name = `thumb-${name}`
        tempLarge.name = `large-${name}`
        tempThumb.oldName = name
        tempLarge.oldName = name
        newArr.push(tempLarge)
        newArr.push(tempThumb)
    })
    return newArr
}

const assembleS3Post = (imageArr) => {
    const promArray = []
    const uuid = uuidv1()
    const assembleImages = formThumbsLarge(imageArr)
    const resultsHelper = {}
    assembleImages.forEach((image) => {
        const imgLoc = `${filesPath}/${image.uuid}/${image.name}`
        promArray.push(uploadS3(imgLoc, uuid, image))
    })
    return Promise.all(promArray).then((results) => {
        results.forEach((image) => {
            const delivery = {
                bucket: image.Bucket,
                name: image.oldName,
                thumbName: `thumb-${image.oldName}`,
                largeName: `large-${image.oldName}`,
                uuid: image.uuid,
                thumbId: image.thumbId,
                urlThumb: `${image.uuid}/thumb-${image.oldName}`,
                urlLarge: `${image.uuid}/large-${image.oldName}`,
                Etags: []
            }
            const etag = {
                name: image.name,
                tag: image.ETag
            }
            // console.log('imageData::--', image)
            resultsHelper[image.oldName] = resultsHelper[image.oldName] || delivery
            resultsHelper[image.oldName].Etags.push(etag)
        })
        return resultsHelper
    }).catch(() => { throw new Error('Could save image to S3') })
}

const getImageFormatProfilePics = imgLoc => new Promise((resolve, reject) => {
    gm(imgLoc).format((err, value) => {
        if (err) reject('issues with image format')
        resolve(lookUp[value])
    })
}).catch(() => 'Could not save image')

const uploadS3ProfilePics = (imgLoc, type) =>
    new Promise((resolve, reject) => {
        getImageFormatProfilePics(imgLoc).then((format) => {
            const params = {
                ACL: 'public-read',
                Bucket: process.env.S3_BUCKET,
                Body: fs.createReadStream(imgLoc),
                Key: `${type}/${path.basename(imgLoc)}`,
                ContentType: 'image/png'
            }

            s3.upload(params, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        })
    }).catch(() => { throw new Error('Could not save images') })

const assembleS3ProfilePics = (file, type) => {
    const imgLoc = `${filesPaths[type]}/${file.name}`
    return uploadS3ProfilePics(imgLoc, type)
        .then(result => result)
}

module.exports.aS3Profiles = (file, type) => assembleS3ProfilePics(file, type)

module.exports.aS3 = imageArr => assembleS3Post(imageArr)
