const ObjectId = require('mongoose').Types.ObjectId;
const GetMongoData = require('./lib/GetMongo');
const QueryHelper = require('./utils/QueryHelper');

const qh = new QueryHelper();
const getMongoData = new GetMongoData();


exports.getMural = (req, res, next) => {
  const query = qh.paramsIdName(req, res);
  getMongoData.getSingleMural(query, req.body.id)
    .then(
      (result) => {
        next(result);
      })
    .catch((error) => {
      next(error);
    });
};

const queryType = (req) => {
  let query = {};
  if (req.params.key) {
    query = { [req.params.key]: req.params.val };
  } else if (req.params.searchType) {
    query = { name: { $regex: req.params.term } };
  }
  return query;
};


exports.getMurals = (req, res, next) => {
  // TODO if key:val params passed in -- need to manipulate val for certain instances
  const query = queryType(req);
  const options = qh.optionsPager(req, res);
  // const render = parseInt(req.query.size) || params.render;
  getMongoData.getModels(query, options, 'Mural')
    .then(
      (result) => {
        // handle rendering type;
        const returnVal = qh.assemblePager(req, result);
        res.send(returnVal);
      })
    .catch((error) => {
      res.status(400).send(error);
    });
};

