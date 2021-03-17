const fs = require('fs')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const multiparty = require('multiparty')
const path = require('path')
const gm = require('gm').subClass({ imageMagick: true })

const chunkDirName = 'chunks'
const maxFileSize = 0
const fileInputName = 'qqfile'
const publicDir = path.join(__dirname, 'imagePub')
const nodeModulesDir = path.join(__dirname, 'node_modules')
const uploadedFilesPath = path.join(__dirname, 'uploads')

const List = require('../models/List')

const lookUp = {
    JPEG: 'jpeg',
    PNG: 'png'
}

const getList = () => List.findById('5c44d0975e8f745b54508f3f').exec(li => li)

exports.imageHandler = (req, res, next) => {
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        const partIndex = fields.qqpartindex
        res.set('Content-Type', 'text/plain')
        if (partIndex == null) {
            onSimpleUpload(fields, files[fileInputName][0], res)
        } else {
            onChunkedUpload(fields, files[fileInputName][0], res)
        }
    })
}

const onSimpleUpload = (fields, file, res) => {
    const uuid = fields.qquuid
    const responseData = {
        success: false
    }

    file.name = fields.qqfilename

    if (isValid(file.size)) {
        moveUploadedFile(file, uuid, () => {
            getList().then((li) => {
                const hasEle = li.draftImages.indexOf(uuid[0])
                if (hasEle === -1) {
                    li.draftImages.push(uuid[0])
                    li.save().then(() => {
                        responseData.success = true
                        res.send(responseData)
                    })
                } else {
                    responseData.success = true
                    res.send(responseData)
                }
            })
        },
        () => {
            responseData.error = 'Problem copying the file!'
            res.send(responseData)
        })
    } else {
        failWithTooBigFile(responseData, res)
    }
}

const onChunkedUpload = (fields, file, res) => {
    let size = parseInt(fields.qqtotalfilesize),
        uuid = fields.qquuid,
        index = fields.qqpartindex,
        totalParts = parseInt(fields.qqtotalparts),
        responseData = {
            success: false
        }

    file.name = fields.qqfilename

    if (isValid(size)) {
        storeChunk(file, uuid, index, totalParts, () => {
            if (index < totalParts - 1) {
                responseData.success = true
                res.send(responseData)
            } else {
                combineChunks(file, uuid, () => {
                    responseData.success = true
                    res.send(responseData)
                },
                () => {
                    responseData.error = 'Problem conbining the chunks!'
                    res.send(responseData)
                })
            }
        },
        (reset) => {
            responseData.error = 'Problem storing the chunk!'
            res.send(responseData)
        })
    } else {
        failWithTooBigFile(responseData, res)
    }
}

const failWithTooBigFile = (responseData, res) => {
    responseData.error = 'Too big!'
    responseData.preventRetry = true
    console.log(responseData)
    res.send(responseData)
}

exports.onDeleteFile = (req, res) => {
    let uuid = req.params.uuid,
        dirToDelete = `${uploadedFilesPath}/${uuid}/`

    getList().then((list) => {
        const arr = list.draftImages.map(o => o)
        const lidx = arr.findIndex(o => o === uuid)
        if (lidx > -1) {
            list.draftImages.splice(lidx, 1)
            list.save()
        }
        rimraf(dirToDelete, (error) => {
            if (error) {
                console.error(`Problem deleting file! ${error}`)
                res.status(500)
            }
            res.send({ error: false, message: 'file deleted' })
        })
    })
}

exports.getImage = (req, res, next) => {
    res.sendFile(`${uploadedFilesPath}/${req.params.uuid}/${req.params.name}`)
}

const isValid = size => maxFileSize === 0 || size < maxFileSize

const moveUploadedFile = (file, uuid, success, failure) => {
    const destinationDir = `${uploadedFilesPath}/${uuid}/`
    const fileDestination = destinationDir + file.name
    moveFile(destinationDir, file.path, fileDestination, success, failure, file.name, uuid)
}

const moveFile = (destinationDir, sourceFile, destinationFile, success, failure, fname, uuid) => {
    mkdirp(destinationDir, (error) => {
        let sourceStream,
            destStream

        if (error) {
            console.error(`Problem creating directory ${destinationDir}: ${error}`)
            failure()
        } else {
            sourceStream = fs.createReadStream(sourceFile)
            destStream = fs.createWriteStream(destinationFile)

            sourceStream
                .on('error', (error) => {
                    console.error(`Problem copying file: ${error.stack}`)
                    destStream.end()
                    failure()
                })
                .on('end', () => {
                    formatGM(destinationFile, destinationDir, 'large', fname, uuid)
                    formatGM(destinationFile, destinationDir, 'thumb', fname, uuid)
                    destStream.end()
                    success()
                })
                .pipe(destStream)
        }
    })
}
// needs error handling
const formatGM = (destFile, dir, type, fname) => {
    const dest = gm(destFile)
    dest.format((err, value) => {
        const format = lookUp[value]
        console.log('Format  ', format)
        // dest.identify((err, value) => {
        // // console.log('gmv: - ', value)
        // })
        dest.size((err, size) => {
            const wd = size.width
            const ht = size.height
            if (type === 'large') {
                if (wd > 1242 && wd < 2484) {
                    dest.resize(1242)
                } else if (wd > 2484) {
                    dest.resize(2484)
                }
            } else {
                dest.resize(400)
            }
            dest.write(`${dir}/${type}-${fname}`, () => {

            })
        })
    })
}

const storeChunk = (file, uuid, index, numChunks, success, failure) => {
    let destinationDir = `${uploadedFilesPath + uuid}/${chunkDirName}/`,
        chunkFilename = getChunkFilename(index, numChunks),
        fileDestination = destinationDir + chunkFilename

    moveFile(destinationDir, file.path, fileDestination, success, failure)
}

const combineChunks = (file, uuid, success, failure) => {
    let chunksDir = `${uploadedFilesPath + uuid}/${chunkDirName}/`,
        destinationDir = `${uploadedFilesPath + uuid}/`,
        fileDestination = destinationDir + file.name

    fs.readdir(chunksDir, (err, fileNames) => {
        let destFileStream

        if (err) {
            console.error(`Problem listing chunks! ${err}`)
            failure()
        } else {
            fileNames.sort()
            destFileStream = fs.createWriteStream(fileDestination, { flags: 'a' })

            appendToStream(destFileStream, chunksDir, fileNames, 0, () => {
                rimraf(chunksDir, (rimrafError) => {
                    if (rimrafError) {
                        console.log(`Problem deleting chunks dir! ${rimrafError}`)
                    }
                })
                success()
            },
            failure)
        }
    })
}

const appendToStream = (destStream, srcDir, srcFilesnames, index, success, failure) => {
    if (index < srcFilesnames.length) {
        fs.createReadStream(srcDir + srcFilesnames[index])
            .on('end', () => {
                appendToStream(destStream, srcDir, srcFilesnames, index + 1, success, failure)
            })
            .on('error', (error) => {
                console.error(`Problem appending chunk! ${error}`)
                destStream.end()
                failure()
            })
            .pipe(destStream, { end: false })
    } else {
        destStream.end()
        success()
    }
}

const getChunkFilename = (index, count) => {
    let digits = new String(count).length,
        zeros = new Array(digits + 1).join('0')

    return (zeros + index).slice(-digits)
}
