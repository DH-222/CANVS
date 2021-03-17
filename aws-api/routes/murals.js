const baseController = require('../controllers/base')
const ValidateParams = require('./lib/paramVali')
const ValidateQuery = require('./lib/queryVali')

const vali = new ValidateParams()
const valiQ = new ValidateQuery()
const cors = require('cors')

const checkParams = vali.lookUpParams.bind(vali)
const checkQuery = valiQ.lookUpParams.bind(valiQ)

const routes = function (app, passportConfig) {
    app.get('/test', (req, res, next) => { res.send('ok') })

    app.get('/get/list/:model/', checkQuery, checkParams, baseController.getModels)// list of modelmodel
    app.get('/get/list/:model/:key/:val/', checkQuery, checkParams, baseController.getModels) // model w key:val
    app.get('/get/single/:type/id/:id', checkQuery, checkParams, baseController.getModel) // id model
    app.get('/get/single/:type/name/:name', checkQuery, checkParams, baseController.getModel) // name model
    app.post('/get/location/mural/', checkQuery, baseController.getLocation)
    app.post('/get/location/mural/paged', checkQuery, baseController.getLocationPaged)
    app.get('/get/popular/mural/paged', checkQuery, baseController.getPopularPaged)
    app.post('/get/jerseycity/', cors(), checkQuery, baseController.getLocationPaged)
    app.options('/get/jerseycity/', cors(), checkQuery, baseController.getLocationPaged)
    app.get('/get/jerseycity/organ/', cors(), checkQuery, baseController.getModelMuralsJersey)
    app.options('/get/jerseycity/organ/', cors(), checkQuery, baseController.getModelMuralsJersey)
    app.get('/get/date/mural/paged', checkQuery, baseController.getDatePaged)
    app.post('/get/batch/model/:model/', checkQuery, checkParams, baseController.getModels)
    app.get('/get/artist/spotted/murals/:dataId', checkQuery, checkParams, baseController.getSpottedLikeCount)
    app.get('/get/murals/:baseModel/:modelMID', checkQuery, checkParams, baseController.getModelMurals)

    app.post('/get/batch/preview', checkQuery, baseController.getQuickMurals)

    /* Search Routes */
    app.get('/get/search/:searchType/', checkQuery, checkParams, baseController.getModels)
}

module.exports = routes
//get/murals/organ/5c47bbbb579b47044d7a3f42
