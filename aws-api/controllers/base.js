const GetMongoData = require('./lib/GetMongo')
const QueryHelper = require('./utils/QueryHelper')

const qh = new QueryHelper()
const getMongoData = new GetMongoData()

const getSingleMural = (query, options, req, res, next) => {
    const modelType = req.params.model || req.params.type
    getMongoData.getSingleModel(query, options, modelType)
        .then(
            (result) => {
                res.send(result)
            })
        .catch((error) => {
            res.status(403).send(error)
            // next(err);
        })
}

const getSingleModel = (query, options, req, res, next) => {
    getMongoData.getModel(query, options, req.params.type)
        .then(
            (result) => {
                res.send(result)
            })
        .catch((error) => {
            res.status(403).send(error)
            // next(err);
        })
}

exports.getModels = (req, res, next) => {
    // TODO if key:val params passed in -- need to manipulate val for certain instances
    const query = qh.queryType(req)
    const options = qh.optionsPager(req, res)
    let model = (req.params.searchType) ? req.params.searchType : req.params.model
    if (req.params.searchType === 'tag' || req.params.searchType === 'link' || req.params.searchType === 'organ') {
        model = 'mural'
    }
    getMongoData.getModels(query, options, model)
        .then(
            (result) => {
                const returnVal = qh.assemblePager(req, result)
                res.send(returnVal)
            })
        .catch((error) => {
            res.status(403).send(error)
        })
}

exports.getSpottedLikeCount = (req, res, next) => {
    // TODO if key:val params passed in -- need to manipulate val for certain instances
    const query = qh.queryType(req)
    getMongoData.getLikeSpottedCount(query)
        .then(
            (result) => {
                res.send(result)
            })
        .catch((error) => {
            res.status(403).send(error)
            // next(err);
        })
}

exports.getModelMurals = (req, res, next) => {
    const query = qh.queryType(req)
    const options = qh.optionsPager(req, res)
    getMongoData.getMuralsFromModelMid(query, req.params.baseModel, options)
        .then(
            (result) => {
                const returnVal = qh.assemblePager(req, result)
                res.send(returnVal)
            })
        .catch((error) => {
            res.status(403).send(error)
        })
}

exports.getModelMuralsJersey = (req, res, next) => {
    const reqFake = {
        params: {
          modelMID: '5c5f8b9edd694bcdd7dfe25f'
        },
        body:{}
    }
    const query = qh.queryType(reqFake)
    const options = qh.optionsPager(req, res)
    getMongoData.getMuralsFromModelMid(query, 'organ', options)
        .then(
            (result) => {
                const returnVal = qh.assemblePager(req, result)
                res.send(returnVal)
            })
        .catch((error) => {
            res.status(403).send(error)
        })
}

exports.getQuickMurals = (req, res, next) => {
    const query = qh.queryType(req)
    getMongoData.getQuickMural(query)
        .then(
            (result) => {
                res.send(result)
            })
        .catch((error) => {
            res.status(403).send(error)
        })
}
const include = {
    _id: 1,
    creationDate: 1,
    location: 1,
    freshMural: 1
}
exports.getMapMurals = (req, res, next) => {
    const query = qh.queryType(req)
    getMongoData.getQuickMural(query)
        .then(
            (result) => {
                res.send(result)
            })
        .catch((error) => {
            res.status(403).send(error)
        })
}

exports.getModel = (req, res, next) => {
    // TODO if key:val params passed in -- need to manipulate val for certain instances
    const query = qh.queryType(req)
    const options = {}
    if (req.params.type && req.params.type === 'mural') {
        getSingleMural(query, options, req, res, next)
    } else {
        getSingleModel(query, options, req, res, next)
    }
}

exports.getLocation = (req, res, next) => {
    // TODO if key:val params passed in -- need to manipulate val for certain instances
    const query = req.body // qh.queryType(req);
    getMongoData.getMuralLocation(query)
        .then(
            (result) => {
                // handle rendering type;
                res.send(result)
            })
        .catch((error) => {
            res.status(403).send(error)
            // next(err);
        })
}

exports.getLocationPaged = (req, res, next) => {
    // TODO if key:val params passed in -- need to manipulate val for certain instances
    const query = req.body // qh.queryType(req);
    const options = qh.optionsPager(req, res)
    delete options.sort
    getMongoData.getMuralLocationPaged(query, options)
        .then(
            (result) => {
                const returnVal = qh.assemblePager(req, result)
                res.send(returnVal)
            })
        .catch((error) => {
            res.status(403).send(error)
            // next(err);
        })
}
// need to bloe out the sorting param on Query Param....
exports.getPopularPaged = (req, res, next) => {
    const query = {} // qh.queryType(req);
    const options = qh.optionsPager(req, res)
    options.sort = { likesCount: -1, spottedCount: -1 }
    getMongoData.getModels(query, options, 'mural')
        .then(
            (result) => {
                const returnVal = qh.assemblePager(req, result)
                res.send(returnVal)
            })
        .catch((error) => {
            res.status(403).send(error)
            // next(err);
        })
}

// need to bloe out the sorting param on Query Param....
exports.getDatePaged = (req, res, next) => {
    const query = {} // qh.queryType(req);
    const options = qh.optionsPager(req, res)
    options.sort = { creationDate: -1 }
    getMongoData.getModels(query, options, 'mural')
        .then(
            (result) => {
                const returnVal = qh.assemblePager(req, result)
                res.send(returnVal)
            })
        .catch((error) => {
            res.status(403).send(error)
            // next(err);
        })
}
