const muralController = require('../controllers/mural')
const imageUploader = require('../controllers/imageUploader')
const bodyVal = require('./lib/bodyVali');
const ParamVal = require('./lib/paramVali');
const ValidateQuery = require('./lib/queryVali');

// const valiQ = new ValidateQuery();
// const checkQuery = valiQ.lookUpParams.bind(valiQ);
const checkBody = bodyVal.lookUpParams.bind(bodyVal);
// const paramVal = new ParamVal();
// const checkParams = paramVal.lookUpParams.bind(paramVal);

const routes = (app, passportConfig) => {
    app.get('/account/murals/view/all/:sort', passportConfig.isAuthenticated, muralController.getAllMurals)
    app.get('/account/murals/edit/:id', passportConfig.isAuthenticated, muralController.getMural)
    app.get('/account/artists/edit/:id', passportConfig.isAuthenticated, muralController.getSingleArtist)
    app.post('/account/artists/edit/:id', passportConfig.isAuthenticated, muralController.updateArtist)
    app.get('/account/artist/add', passportConfig.isAuthenticated, muralController.getAddArtist)
    app.post('/account/artist/add', passportConfig.isAuthenticated, muralController.createArtist)
    app.get('/account/artists/view/all/:sort', passportConfig.isAuthenticated, muralController.getAllArtist)
    app.post('/account/murals/edit/:id', passportConfig.isAuthenticated, muralController.updateMural)
    app.get('/account/murals/edit/:id', passportConfig.isAuthenticated, muralController.getSingleArtist)

    app.post('/set/images/mural', passportConfig.isAuthenticated, imageUploader.imageHandler)
    app.get('/get/typeahead/', passportConfig.isAuthenticated, muralController.typeAheadData)
    app.get('/get/model/:model/:id', passportConfig.isAuthenticated, muralController.getModelID)
    app.get('/delete/draft/images', muralController.deleteDraftImages)
    app.get('/set/images/mural/:uuid', passportConfig.isAuthenticated, imageUploader.onDeleteFile)
    app.get('/get/images/view/mural/:uuid/:name', passportConfig.isAuthenticated, imageUploader.getImage)
    app.delete('/remove/model/mural/', muralController.deleteMuralModel)
}

module.exports = routes
