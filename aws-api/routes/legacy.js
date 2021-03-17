const legacyController = require('../controllers/legacy');
const Validate = require('./lib/paramVali');

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 10 // limit each IP to 100 requests per windowMs
});
// const signUpLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 15 minutes
//   max: 10 // limit each IP to 100 requests per windowMs
// })


const vali = new Validate();
const checkParams = vali.lookUpParams.bind(vali);

const routes = function (app) {
  app.get('/get/legacy/murals/active', legacyController.getMurals);
  app.get('/get/legacy/murals/removed', legacyController.getRemovedMurals);
  app.get('/get/legacy/popularity/', legacyController.getPopularity);
  app.get('/get/legacy/stats/:stat/:mural', checkParams, legacyController.getMuralStats);
  app.get('/set/legacy/stats/add/:mural/:stat/:uid', checkParams, legacyController.addMuralStat);
  app.get('/set/legacy/stats/remove/:mural/:stat/:uid', checkParams, legacyController.deleteMuralStat);
};

module.exports = routes;
