const CreateMongoData = require('./lib/CreateMongo')
const GetMongoData = require('./lib/GetMongo')
const DeleteMongoData = require('./lib/DeleteMongo')

const getMongoData = new GetMongoData()
const createMongoData = new CreateMongoData()
const deleteMongoData = new DeleteMongoData()
const multiparty = require('multiparty')

exports.getMural = (req, res) => {
    let query
    if (req.user.role === 'admin') {
        query = { _id: req.params.id }
    } else {
        query = { _id: req.params.id, 'user.mid': req.user._id.toString() }
    }
    console.log('Query: --', query)
    getMongoData.getSingleMural(query)
        .then((result) => {
            res.render('account/edit-mural', result)
        }).catch((error) => {
            req.flash('errors', { msg: error })
            res.redirect('/')
        })
}

exports.deleteMuralModel = (req, res, next) => {
    const { muralId, modelId, modelType } = req.body
    deleteMongoData.deleteModelMural(muralId, modelId, modelType)
        .then((result) => {
            res.send(result)
        })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.deleteDraftImages = (req, res, next) => {
    deleteMongoData.deleteDraftImages()
        .then((result) => {
            res.send(result)
        })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.getAllMurals = (req, res) => {
    if (!req.user) return res.redirect('/')
    const sorter = req.params.sort
    const sort = { creationDate: (sorter === 'asc') ? 1 : -1 }
    getMongoData.getAllMurals({}, sort, req.user)
        .then((result) => {
            res.render('account/viewMurals', result)
        }).catch((error) => {
            req.flash('errors', { msg: 'Could not locate murals' })
            res.render('account/viewMurals', error)
        })
}
exports.deleteMuralImage = (req, res) => {
    const sort = { creationDate: (sorter === 'asc') ? 1 : -1 }
    getMongoData.getAllMurals({}, sort, req.user)
        .then((result) => {
            res.send({ message: 'image deleted' })
        }).catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.postMural = (req, res, next) => {
    createMongoData.createMural()
        .then((result) => {
        })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.updateMural = (req, res, next) => {
    const queryData = { user: { _id: req.user.id }, body: req.body, id: req.params.id }
    createMongoData.updateMural(queryData, req.app.get('mysqlConfig'))
        .then((result) => {
            req.flash('success', { msg: result })
            res.redirect('/account/murals/view/all/desc')
        })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.draftStatus = (req, res) => {
    const query = { status: req.params.status, approved: false }
    getMongoData.getDraftStatus(query)
        .then((result) => { res.send(result) })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.searchArtist = (req, res, next) => {
    const query = { name: { $regex: req.params.term } }
    getMongoData.getSearchArtist(query)
        .then((result) => { res.send(result) })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.typeAheadData = (req, res, next) => {
    getMongoData.getTypeAheadData()
        .then((result) => { res.send(result) })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.getModelID = (req, res) => {
    getMongoData.getModelID(req.params.id, req.params.model)
        .then((result) => {
            res.send(result)
        })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}
exports.getSingleArtist = (req, res) => {
    getMongoData.getSingleArtist(req)
        .then((result) => {
            res.render('account/edit-artist', result)
        })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}
exports.getAllArtist = (req, res) => {
    const sorter = req.params.sort
    const sort = { name: (sorter === 'asc') ? 1 : -1 }
    getMongoData.getAllArtist(req, sort)
        .then((result) => {
            res.render('account/viewArtist', result)
        })
        .catch((error) => {
            req.flash('errors', { msg: error.message })
            res.render('account/viewArtist')
        })
}

exports.updateArtist = (req, res, next) => {
    // const queryData = { user: req.user, data: req.body, id: req.params.id }
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        const data = { ...files }
        Object.keys(fields).forEach((key) => {
            if (key !== '_csrf') {
                data[key] = fields[key][0]
            }
        })
        const queryData = { user: req.user, data, id: req.params.id }
        createMongoData.artistUpdate(queryData)
            .then((result) => {
                req.flash('success', { msg: result })
                res.redirect('/account/artists/view/all/desc')
            })
            .catch((error) => {
                req.flash('errors', { msg: 'You do not have access to that resource' })
                res.redirect('/account/artists/view/all/desc')
            })
    })
}
exports.getAddArtist = (req, res) => {
    if (req.user.role === 'admin' || req.user.role === 'contrib') {
        const resourceEnv = req.app.get('resourceEnv')
        res.render('account/edit-artist', { resourceEnv })
    } else {
        req.flash('errors', { msg: 'You do not have contributor level permissions' })
        res.redirect('/')
    }
}

exports.createArtist = (req, res, next) => {
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        const data = { ...files }
        Object.keys(fields).forEach((key) => {
            if (key !== '_csrf') {
                data[key] = fields[key][0]
            }
        })
        const queryData = { user: { _id: req.user.id }, data, id: req.params.id }
        createMongoData.createArtist(queryData)
            .then((result) => {
                req.flash('success', { msg: result })
                res.redirect('/account/artists/view/all/desc')
            })
            .catch((error) => {
                res.send({ error: true, message: error.message })
            })
    })
}
