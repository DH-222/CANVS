const ObjectId = require('mongoose').Types.ObjectId;
const GetMongoData = require('./lib/GetMongo');
const QueryHelper = require('./utils/QueryHelper');

const qh = new QueryHelper();
const getMongoData = new GetMongoData();


exports.getArtists = (req, res, next) => {
  const query = {};
  const options = qh.optionsPager(req, res);
  // const render = parseInt(req.query.size) || params.render;
  getMongoData.getModels(query, options, 'Artist')
    .then(
      (result) => {
        // handle rendering type;
        const { nextPage, prevPage } = qh.nextPagePopulate(req, result);
        const { totalPages, totalCount, data } = result;
        const returnVal = { totalPages, totalCount, nextPage, prevPage, data, };
        res.send(returnVal);
      },
      (error) => {
        res.status(400).send(error);
      });
};

exports.getArtist = (req, res, next) => {
  const query = qh.paramsIdName(req, res);
  // runQuery(query, res);
};

// exports.getArtistSerarch = (req, res, next) => {
//   const query = {};
//   // runQuery(query, res);
// };
