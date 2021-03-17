const MysqlQuery = require('./lib/mysql');

exports.getMurals = (req, res) => {
  const mysqlQuery = new MysqlQuery(req);
  mysqlQuery.getActiveMurals()
    .then(
      (result) => {
        // console.log(result);
        res.send(result);
      },
      (error) => {
        console.log(error);
        res.status(403).send(error);
      });
};

exports.getPopularity = (req, res) => {
  const mysqlQuery = new MysqlQuery(req);
  mysqlQuery.getPopularity()
    .then(
      (result) => {
        // console.log(result);
        res.send(result);
      },
      (error) => {
        console.log(error);
        res.status(403).send(error);
      });
};

exports.getRemovedMurals = (req, res) => {
  const mysqlQuery = new MysqlQuery(req);
  mysqlQuery.getRemovedMurals()
    .then(
      (result) => {
        // console.log(result);
        res.send(result);
      },
      (error) => {
        console.log(error);
        res.status(403).send(error);
      });
};

exports.getMuralStats = (req, res) => {
  const mysqlQuery = new MysqlQuery(req);
  mysqlQuery.getMuralStats()
    .then(
      (result) => {
        // console.log(result);
        res.send(result);
      },
      (error) => {
        // console.log(error);
        res.status(403).send(error);
      });
};

exports.addMuralStat = (req, res) => {
  const mysqlQuery = new MysqlQuery(req);
  mysqlQuery.addMuralStat()
    .then(
      (result) => {
        // console.log(result);
        res.send(result);
      },
      (error) => {
        console.log(error);
        res.status(403).send(error);
      });
};

exports.deleteMuralStat = (req, res) => {
  const mysqlQuery = new MysqlQuery(req);
  mysqlQuery.deleteMuralStat()
    .then(
      (result) => {
        // console.log(result);
        res.send(result);
      },
      (error) => {
        console.log(error);
        res.status(403).send(error);
      });
};
