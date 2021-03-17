const CreateMongoData = require('./lib/CreateMongo')
const GetMongoData = require('./lib/GetMongo')

const getMongoData = new GetMongoData()
const createMongoData = new CreateMongoData()

exports.draftToMural = (req, res) => {
    const user = { _id: req.user.id, role: 'admin' }
    const query = { _id: req.params.draftId, approved: false }
    createMongoData.muralDraft(query, user, req.app.get('mysqlConfig'))
        .then(
            (result) => {
                res.send({ data: result })
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

exports.draftStatusAdmin = (req, res) => {
    const query = { approved: false }
    const user = {
        _id: req.user.id,
        role: 'admin'
    }

    getMongoData.getAllDraftStatus(query, user)
        .then(
            (result) => {
                if (req.xhr) {
                    res.send({ data: result })
                } else {
                    res.render('account/adminDash', { data: result })
                }
            })
        .catch((error) => {
            if (req.xhr) {
                res.send({ error })
            } else {
                res.render('account/adminDash', error)
            }
        })
}

exports.getDraft = (req, res) => {
    let query
    if (req.user.role === 'admin') {
        query = { _id: req.params.draftId }
    } else {
        query = { _id: req.params.draftId, 'user.mid': req.user._id.toString() }
    }

    getMongoData.getDraft(query)
        .then(
            (result) => {
                res.render('account/editCreateDraft', result)
            })
        .catch((error) => {
            req.flash('errors', { msg: error.message })
            res.redirect('/')
        })
}

exports.createDraft = (req, res) => {
    const user = {
        _id: req.user.id,
        $or: [
            { role: 'admin' },
            { role: 'contrib' }
        ]
    }
    const data = req.body
    createMongoData.createDraft(data, user)
        .then((result) => {
            req.flash('success', { msg: result })
            res.redirect('/')
        })
        .catch((error) => {
            req.flash('errors', { msg: error.message })
            res.redirect('/')
        })
}

exports.updateDraft = (req, res) => {
    const query = { _id: req.params.draftId, 'user.mid': req.user.id.toString() }
    createMongoData.updateDraft(query, req)
        .then(
            (result) => {
                req.flash('success', { msg: result })
                res.redirect('/')
            })
        .catch((error) => {
            console.log(error)
            req.flash('errors', { msg: error })
            res.redirect('/')
        })
}

exports.getAddDraft = (req, res) => {
    if (req.user.role === 'admin' || req.user.role === 'contrib') {
        const resourceEnv = req.app.get('resourceEnv')
        res.render('account/editCreateDraft', { resourceEnv })
    } else {
        req.flash('errors', { msg: 'You do not have contributor privledges' })
        res.redirect('/')
    }
}

exports.draftImageEdit = (req, res) => {
    const query = { _id: req.body.id, 'user.mid': req.user._id.toString() }
    const update = { $set: { imageInputs: req.body.imageInputs } }
    getMongoData.updateDraft(query, update)
        .then((result) => { res.send(result) })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

exports.setDraftStatus = (req, res) => {
    const query = { _id: req.params.draftId, 'user.mid': req.user._id.toString() }
    const update = { $set: { [req.params.key]: req.params.val } }
    getMongoData.updateDraft(query, update)
        .then((result) => { res.send(result) })
        .catch((error) => {
            res.send({ error: true, message: error.message })
        })
}

// exports.getUserDrafts = () => {
//     getMongoData.getUserDrafts(this.req.user)
//         .then((result) => {
//             res.send(result)
//         })
//         .catch((error) => {
//             res.send({ error: true, message: error.message })
//         })
// }
