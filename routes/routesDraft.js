const muralController = require('../controllers/mural')
const draftController = require('../controllers/draft')

const routes = function (app, passportConfig) {
    app.get('/account/draft/add', passportConfig.isAuthenticated, draftController.getAddDraft)
    app.post('/account/draft/add', passportConfig.isAuthenticated, draftController.createDraft)
    app.get('/account/draft/edit/:draftId', passportConfig.isAuthenticated, draftController.getDraft)
    app.post('/account/draft/edit/:draftId', passportConfig.isAuthenticated, draftController.updateDraft)
    app.get('/account/draft/create/mural/:draftId', passportConfig.isAuthenticated, draftController.draftToMural)
    app.get('/account/draft/status/:status/', passportConfig.isAuthenticated, draftController.draftStatus)
    app.get('/account/draft/set/:key/:val/:draftId', passportConfig.isAuthenticated, draftController.setDraftStatus)
    app.get('/account/admin/drafts/', passportConfig.isAuthenticated, draftController.draftStatusAdmin)
    app.post('/account/draft/image/edit', passportConfig.isAuthenticated, draftController.draftImageEdit)
    app.get('/account/get/artist/search/:term', passportConfig.isAuthenticated, muralController.searchArtist)
}

module.exports = routes
