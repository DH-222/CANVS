// const Promise = require('bluebird');
const Mural = require('../../models/Mural')
const User = require('../../models/User')
const List = require('../../models/List')
const passportConfig = require('../../config/passport')
const request = require('request')

const whiteListUserFields = ['firstName', 'lastName', 'address',
    'state', 'city', 'zipcode', 'country', 'bio', 'webUrl', 'facebookLink',
    'instagramLink', 'twitterLink', 'youtubeLink', 'gender', 'fullName', 'userName', 'location', 'email']

const exclude = {
    organizations: 0,
    murals: 0,
    artist: 0,
    drafts: 0,
    role: 0,
    tags: 0,
    created_at: 0,
    updatedAt: 0,
    is_approved: 0,
    updated_at: 0,
    sign_in_count: 0,
    current_sign_in_at: 0,
    last_sign_in_at: 0,
    password: 0,
    __v: 0,
    'faceBookAuth.id': 0
}

module.exports = class UserMongo {
    userSignUp (userData) {
        return new Promise((resolve, reject) => {
            const user = new User(userData)
            User.findOne({ email: user.email }, (err1, existingUser) => {
                if (err1) reject({ error: true, message: err1 })
                if (existingUser) {
                    reject('An account for that user exist already, please try with a different email or try forgot password')
                }
                user.save((err2, data) => {
                    if (err2) reject('We encountered an error with your sign up')
                    resolve(user)
                })
            })
        })
    }

    userSignUpFB (userData) {
        return new Promise((resolve, reject) => {
            request({ url: `https://graph.facebook.com/me/?access_token=${userData.token}` }, (err, result, body) => {
                if (err) {
                    reject('Could authenticate Face book credentials')
                } else {
                    const fbData = JSON.parse(body)
                    userData.faceBookAuth = {}
                    userData.faceBookAuth.id = fbData.id
                    userData.faceBookAuth.token = userData.token
                    delete userData.token
                    const user = new User(userData)
                    User.findOne({ 'faceBookAuth.id': userData.faceBookAuth.id }, exclude, (err1, existingUser) => {
                        if (err1) reject({ error: true, message: 'DB connection error' })
                        if (existingUser) {
                            resolve(existingUser)
                        } else {
                            user.save((err2, data) => {
                                if (err2) reject('We encountered an error with your sign up')
                                resolve(data)
                            })
                        }
                    })
                }
            })
        })
    }

    getUserTest (id, req) {
        return new Promise((resolve, reject) => {
            if (req.isAuthenticated()) {
                User.findById(id, exclude, (err, user) => {
                    if (err) {
                        reject('Could not log in user by id')
                    }
                    if (!user) {
                        reject('Could not locate user')
                    }

                    resolve({ user })
                })
            } else {
                reject('failed validation')
            }
        })
    }

    updateUserModels (userD, modelValue, resolve, reject) {
        Promise.all([this.updateUserMural(modelValue), this.updateUserList(modelValue)])
            .then((result) => {
                userD.save((err1, user) => {
                    result[0].model.save((err2, mural) => {
                        result[1].model.save((err3, list) => {
                            resolve({ user })
                        })
                    })
                })
            })
            .catch((error) => {
                reject(error)
            })
    }

    removeFromUserModels (userD, modelValue, resolve, reject) {
        Promise.all([this.removeFromUserMural(modelValue), this.removeFromUserList(modelValue)])
            .then((result) => {
                userD.save((err1, user) => {
                    result[0].model.save((err2, mural) => {
                        result[1].model.save((err3, list) => {
                            resolve({ user })
                        })
                    })
                })
            })
            .catch((error) => {
                reject(error)
            })
    }

    setUserModelData (key, d, user) {
        const keyExist = user[key].find(n => n.mid === d[key].mid)
        if (!keyExist) {
            d[key].creationDate = new Date()
            user[key].push(d[key])
            const index = user[key].findIndex(n => n.mid === d[key].mid)
            return {
                field: key,
                data: d[key],
                userId: user._id.toString(),
                user,
                idx: index
            }
        }
        return null
    }

    removeUserModelData (key, d, user) {
        const keyExist = user[key].findIndex(n => n.mid === d[key].mid)
        if (keyExist > -1) {
            user[key].splice(keyExist, 1)
            return {
                field: key,
                data: d[key],
                userId: user._id.toString(),
                userD: user
            }
        }
        return null
    }

    checkModelValues (d, user, type) {
        let dataSet = null;
        ['spotted', 'likes'].forEach((item) => {
            if (d[item] && type === 'POST') {
                dataSet = this.setUserModelData(item, d, user)
            } else if (d[item] && type === 'DELETE') {
                dataSet = this.removeUserModelData(item, d, user)
            }
        })
        return dataSet
    }

    checkRegularValues (d, user) {
        console.log('d', d)
        Object.keys(d).forEach((key) => {
            if (whiteListUserFields.indexOf(key) > -1) {
                // if (d[key] !== 'password') {
                user[key] = d[key]
            }
        })
    }

    updateUserData (userQuery) {
        const { query: q, data: d, type: t } = userQuery
        return new Promise((resolve, reject) => {
            User.findOne(q, exclude, (err, user) => {
                if (err || !user) reject('Could not locate user')
                const modelValue = this.checkModelValues(d, user, t)
                if (modelValue === null || modelValue === undefined) {
                    return reject('Could find values you specified')
                }
                switch (t) {
                    case 'POST' :
                        return this.updateUserModels(user, modelValue, resolve, reject)
                    case 'DELETE':
                        return this.removeFromUserModels(user, modelValue, resolve, reject)
                    default :
                        return reject('Could not complete data save')
                        break
                }
            })
        })
    }

    updateUser (userQuery) {
        const { query: q, data: d } = userQuery
        return new Promise((resolve, reject) => {
            User.findOne(q, exclude, (err, userD) => {
                if (err || !userD) reject('Could not locate user')
                this.checkRegularValues(d, userD)
                userD.save()
                    .then(user => resolve({ user }))
                    .catch(error => reject(error))
            })
        })
    }

    artistFollowHandling (userQuery) {
        const { query: q, data: d, type: t } = userQuery
        return new Promise((resolve, reject) => {
            User.findOne(q, exclude, (err, userD) => {
                if (err || !userD) reject('Could not locate user')
                switch (t) {
                    case 'POST' :
                        return this.addFollowArtist(d, userD)
                            .then(user => resolve({ user }))
                            .catch(() => reject('Could not complete collection request'))
                    case 'DELETE':
                        return this.removeFollowArtist(d, userD)
                            .then(user => resolve({ user }))
                            .catch(() => reject('Could not complete collection request'))
                    default :
                        reject('Could not complete collection request')
                        break
                }
            })
        })
    }

    collectionHandle (userQuery) {
        const { query: q, data: d, type: t } = userQuery
        return new Promise((resolve, reject) => {
            User.findOne(q, exclude, (err, userD) => {
                if (err || !userD) reject('Could not locate user')
                switch (t) {
                    case 'POST' :
                        return this.addCollection(d, userD)
                            .then(user => resolve({ user }))
                            .catch(err => reject(err))
                    case 'DELETE':
                        return this.removeCollection(d, userD)
                            .then(user => resolve({ user }))
                            .catch(err => reject(err))
                    case 'PUT':
                        return this.renameCollection(d, userD)
                            .then(user => resolve({ user }))
                            .catch(err => reject(err))
                    default :
                        reject('Could not complete collection request')
                        break
                }
            })
        })
    }

    collectionDataHandle (userQuery) {
        const { query: q, data: d, type: t } = userQuery
        return new Promise((resolve, reject) => {
            User.findOne(q, exclude, (err, userD) => {
                if (err || !userD) reject('Could not locate user')
                switch (t) {
                    case 'POST' :
                        return this.addCollectionData(d, userD)
                            .then(user => user.save())
                            .then(user => resolve({ user }))
                            .catch(err => reject(err))
                    case 'DELETE':
                        return this.removeCollectionData(d, userD)
                            .then(user => resolve({ user }))
                            .catch(err => reject(err))
                    default :
                        reject('Could not complete collection request')
                        break
                }
            })
        })
    }

    addFollowArtist (d, user) {
        const keyExist = user.artistFollows.findIndex(n => n.mid === d.mid)
        if (keyExist < 0) {
            d.creationDate = new Date()
            user.artistFollows.push(d)
            const payload = {
                field: 'artistFollows',
                data: d,
                userId: user._id.toString(),
                user,
                idx: keyExist
            }
            return this.updateUserList(payload)
                .then((result) => {
                    result.model.save()
                })
                .then(() => user.save())
                .catch(() => 'Could not update artist data')
        }
        return Promise.reject('Artist already exist in user follow list')
    }

    removeFollowArtist (d, user) {
        const keyExist = user.artistFollows.findIndex(n => n.mid === d.mid)
        if (keyExist > -1) {
            user.artistFollows.splice(keyExist, 1)
            const payload = {
                field: 'artistFollows',
                data: d,
                userId: user._id.toString(),
                user
            }
            return this.removeFromUserList(payload)
                .then((result) => {
                    result.model.save()
                })
                .then(() => user.save())
                .catch(() => { throw new Error('Could not remove artist data') })
        }
        return Promise.reject('Could locate artist to delete')
    }

    addCollection (d, user) {
        const keyExist = user.collectionBook.find(n => n.collectionName === d.collectionName)
        if (!keyExist) {
            d.creationDate = new Date()
            user.collectionBook.push(d)
            return user.save()
        }
        return Promise.reject('Collection already exist')
    }
    removeCollection (d, user) {
        const keyExist = user.collectionBook.findIndex(n => n._id.toString() === d._id)
        if (keyExist > -1) {
            user.collectionBook.splice(keyExist, 1)
            return user.save()
        }
        return Promise.reject('Collection for deletion does not exist')
    }
    renameCollection (d, user) {
        const keyExist = user.collectionBook.findIndex(n => n._id.toString() === d._id)
        if (keyExist > -1) {
            user.collectionBook[keyExist].collectionName = d.collectionName
            return user.save()
        }
        return Promise.reject('Collection for rename does not exist')
    }

    updateUserMural (muralD) {
        const { field, data: d, idx, userId, user } = muralD
        return Mural.findById(d.mid, (err, mural) => {
            if (err) return Promise.reject('Could not find mural to update user data with')
            return mural
        })
    }

    addCollectionData (d, user) {
        return new Promise((resolve, reject) => {
            const ind = user.collectionBook.findIndex(n => n._id.toString() === d._id)
            if (ind > -1) {
                const checkData = user.collectionBook[ind].data.find(n => n.mid === d.data.mid)
                if (!checkData) {
                    return this.getMuralImage(d.data.mid)
                        .then((mural) => {
                            if (!mural) {
                                reject('Could no locate Mural')
                            }
                            d.data.urlThumb = mural.images[0].urlThumb
                            d.data.creationDate = new Date()
                            user.collectionBook[ind].data.push(d.data)
                            resolve(user)
                            // return user.save().then(result => resolve(result));
                        })
                } else if (checkData) {
                    reject('Data already exist')
                }
            } else {
                reject('Could not locate collection to update')
            }
        })
    }

    getMuralImage (id) {
        return Mural.findById(id).exec((err, mural) => mural)
    }

    removeCollectionData (d, user) {
        const ind = user.collectionBook.findIndex(n => n._id.toString() === d._id)
        if (ind > -1) {
            const checkData = user.collectionBook[ind].data.findIndex(n => n.mid === d.data.mid)
            if (checkData > -1) {
                user.collectionBook[ind].data.splice(checkData, 1)
                return user.save()
            }
        }
        return Promise.reject('Could not remove data set from collection')
    }

    // user.save((err, userSaved) => resolve({ message: 'User data saved!' }));

    updateUserMural (muralD) {
        const { field, data: d, idx, userId, user } = muralD
        return new Promise((resolve, reject) => {
            Mural.findById(d.mid, (err, mural) => {
                if (err) reject('Error trying to retrieve Mural to update')
                if (mural[field].users.indexOf(userId) < 0) {
                    mural[field].users.push(userId)
                    user[field][idx].urlThumb = mural.images[0].urlThumb
                    if (field === 'spotted') {
                        mural.spottedCount++
                    } else if (field === 'likes') {
                        mural.likesCount++
                    }
                    resolve({ model: mural })
                } else {
                    reject(`User already exist in Mural ${d.mid}`)
                }
            })
        })
    }

    removeFromUserMural (muralD) {
        const { field, data: d, userId, user } = muralD
        return new Promise((resolve, reject) => {
            Mural.findById(d.mid, (err, mural) => {
                if (err) reject('Error trying to retrieve Mural to update')
                if (mural[field].users.indexOf(userId) > -1) {
                    const dInd = mural[field].users.findIndex(n => n === userId)
                    mural[field].users.splice(dInd, 1)
                    if (field === 'spotted') {
                        mural.spottedCount--
                    } else if (field === 'likes') {
                        mural.likesCount--
                    }
                    resolve({ model: mural })
                } else {
                    reject(`User data is not found on mural ${d.mid}`)
                }
            })
        })
    }

    // does the same as UserMural, however -- datasets are more nested for list
    updateUserList (muralD) {
        const { field, data: d, userId: uid } = muralD
        return new Promise((resolve, reject) => {
            List.findById('5c44d0975e8f745b54508f3f', (err, list) => {
                if (err) reject('Could not locate List Master Doc')
                // if mural !exist in model doc
                const isList = list[field].find(n => n.mid === d.mid)
                if (!isList) {
                    let ldata
                    if (field === 'artistFollows') {
                        ldata = { mid: d.mid, users: [uid], creationDate: new Date() }
                    } else {
                        ldata = { modelType: d.modelType, mid: d.mid, users: [uid] }
                    }
                    list[field].push(ldata)
                    resolve({ model: list })
                    // if mural does in model doc get index
                } else if (list[field].find(n => n.mid === d.mid)) {
                    const index = list[field].findIndex(n => n.mid === d.mid)
                    const users = list[field][index].users
                    // check for user id in field- update if nonexistent
                    if (users.indexOf(uid) < 0) {
                        users.push(uid)
                        list[field][index].users = users
                        resolve({ model: list })
                    } else {
                        reject('List data could not be updated')
                    }
                } else {
                    reject('List data could not be updated')
                }
            })
        })
    }

    removeFromUserList (muralD) {
        const { field, data: d, userId: uid } = muralD
        return new Promise((resolve, reject) => {
            List.findById('5c44d0975e8f745b54508f3f', (err, list) => {
                if (err) reject('Could not locate List Master Doc')
                if (list[field].find(n => n.mid === d.mid) === undefined) {
                    reject('Could not artist list to delete')
                } else if (list[field].find(n => n.mid === d.mid)) {
                    const index = list[field].findIndex(n => n.mid === d.mid)
                    const users = list[field][index].users
                    if (users.indexOf(uid) > -1) {
                        const dInd = users.findIndex(n => n === uid)
                        users.splice(dInd, 1)
                        list[field][index].users = users
                        resolve({ model: list })
                    } else {
                        reject('Could not remove user from artist follow list')
                    }
                } else {
                    reject('List data could not be updated')
                }
            })
        })
    }
}
