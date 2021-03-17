const errorHandles = class {
  constructor() {
    // this.res = res;
  }
  finalProcess(err, req, res, next) {
    if (err) {
      this.sendError(err, res);
    } else {
      res.send({ error: true, message: 'Unknown issue, please debug' });
    }
  }
  sendError(err, res) {
    // run conditionals for status data
    const status = (err.status) ? err.status : 403;
    res.status(status).send({ error: true, message: err.message });
  }
};
module.exports = errorHandles;
