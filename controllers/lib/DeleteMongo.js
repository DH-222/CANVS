const Mural = require('../../models/Mural')
const User = require('../../models/User')
const Artist = require('../../models/Artist')
const Image = require('../../models/Image')
const Tag = require('../../models/Tag')
const Organ = require('../../models/Organization')
const Link = require('../../models/Link')
const List = require('../../models/List')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const uploadedFilesPath = path.join(__dirname, '/../uploads/')
const DataUtils = require('./DataUtils')

const modelLookup = {
    organ: 'organizations',
    link: 'links',
    tag: 'tags',
    artist: 'artist',
    image: 'images'
}

const Models = {
    mural: Mural,
    user: User,
    artist: Artist,
    image: Image,
    tag: Tag,
    organ: Organ,
    link: Link
}

class DeleteMongoData {
    deleteModelMural (muralId, modelId, modelType) {
        const modelKey = modelLookup[modelType]
        return new Promise((resolve, reject) => {
            Mural.findById(muralId, (err, mural) => {
                if (err || !mural) {
                    return reject(new Error(`Could not locate Mural`))
                }
                const keyIdx = mural[modelKey].findIndex(n => n.mid === modelId)
                if (keyIdx > -1) {
                    mural[modelKey].splice(keyIdx, 1)
                    return mural.save((err, data) => this.deleteModel(muralId, modelId, modelType)
                        .then(() => resolve(`Mural deleted data for model ${modelType}`))
                        .catch(err => err))
                }
                return reject(new Error(`Could not locate ${modelType} document in dataset`))
            })
        })
    }
    deleteModel (muralId, modelId, modelType) {
        return Models[modelType].findById(modelId, (err, model) => {
            if (err || !model) return Promise.reject(new Error(`Could not locate data from ${modelType} to delete`))
            const keyIdx = model.murals.findIndex(n => n.mid === muralId)
            if (keyIdx > -1) {
                model.murals.splice(keyIdx, 1)
                return model.save()
            }
            return reject(new Error(`Could not locate ${modelType} document in dataset`))
        })
    }


    // delete Draft Images
    checkDraftImageFS (folder) {
        return new Promise((resolve, reject) => {
            console.log(folder)

            if (fs.existsSync(folder)) {
                console.log('exist1', folder)
                fs.stat(folder, (err, data) => {
                    if (err) {
                        console.log(err)
                        resolve('error')
                    }
                    console.log('exist2', folder)
                    const breakDate = new Date()
                    const dirDate = new Date(data.birthtimeMs)
                    breakDate.setDate(breakDate.getDate() - 15)
                    if (+dirDate < +breakDate) {
                        rimraf(folder, () => {
                            resolve('deleted')
                        })
                        // resolve('deleted')
                    }
                    resolve('none')
                })
            } else {
                resolve('not-found')
            }
        })
    }

    deleteAllButDraftImafeFS (data) {
        const deleteDir = []
        return new Promise((resolve, reject) => {
            const files = fs.readdirSync(uploadedFilesPath)
            files.forEach((file, idx) => {
                let hasItem = false
                data.forEach((item) => {
                    if (item === file) {
                        hasItem = true
                    }
                })
                if (!hasItem) {
                    deleteDir.push(file)
                }
                if (idx >= files.length - 1) {
                    resolve(deleteDir)
                }
            })
        })
    }

    tailedDraftImageFunc (it, data, resolve) {
        const folder = `${uploadedFilesPath}${data[it]}/`
        return this.checkDraftImageFS(folder).then((result) => {
            if (result === 'deleted' || result === 'not-found') {
                this.deletionArr.push(data[it])
            }
            it += 1
            if (it >= data.length - 1) {
                console.log(this.deletionArr)
                const uuidDeleteArr = this.deletionArr.map(item => data[item])
                return resolve(uuidDeleteArr.join(','))
            }
            this.tailedDraftImageFunc(it, data, resolve)
        })
    }

    cleanFilesFS (folder) {
        return new Promise((resolve, reject) => {
            rimraf(folder, () => {
                resolve('deleted')
            })
        })
    }

    tailedCleanFilesFunc (it, data, resolve) {
        const folder = `${uploadedFilesPath}${data[it]}/`
        return this.cleanFilesFS(folder).then((result) => {
            it += 1
            if (it >= data.length - 1) {
                return resolve('cleaned')
            }
            this.tailedCleanFilesFunc(it, data, resolve)
        })
    }

    promiseHODraftImageFunc (it, data) {
        return new Promise((resolve, reject) => this.tailedDraftImageFunc(it, data, resolve))
    }

    promiseHOCleanFilesFunc (it, data) {
        return new Promise((resolve, reject) => this.tailedCleanFilesFunc(it, data, resolve))
    }

    deleteDraftImages () {
        this.deletionArr = []
        return new Promise((resolve, reject) => {
            List.findById('5c44d0975e8f745b54508f3f', (err, li) => {
                if (err) reject(err)
                this.promiseHODraftImageFunc(0, li.draftImages).then((result) => {
                    const mapDRAFTS = li.draftImages.map(it => it)
                    this.deletionArr.forEach((item) => {
                        const findUUID = mapDRAFTS.findIndex(n => n === item)
                        if (findUUID > -1) {
                            mapDRAFTS.splice(item, 1)
                        }
                    })
                    li.draftImages = mapDRAFTS
                    li.save(() => {
                        this.deleteAllButDraftImafeFS(li.draftImages).then((result) => {
                            this.promiseHOCleanFilesFunc(0, result).then((final) => {
                                resolve(`removed folders ${final}`)
                            })
                        })
                    })
                })
            })
        })
    }
}

class MakeData extends DataUtils(DeleteMongoData) {}
module.exports = MakeData
