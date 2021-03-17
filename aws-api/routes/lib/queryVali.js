const vali = require('validator');

const Validate = class {
  constructor() {
  }
  // TODO sanitize and clean up user inputs
  lookUpParams(req, res, next) {
    this.isValidCount = 0;
    this.sorts = ['date-asc', 'date-desc', 'name-desc', 'name-asc'];
    this.lookUp = {
      size: {
        func: size => vali.isInt(size),
        err: 'Size request is to low or too high'
      },
      page: {
        func: uid => vali.isInt(uid),
        err: 'Page range is incorrect default and min is 20'
      },
      sort: {
        func: sort => this.sorts.indexOf(sort) >= 0,
        err: 'Not a valid sort key'
      },
      search: {
        func: search => vali.isLength(search, { min: 3, max: 80 }),
        err: 'Search term require at least 3 characters no more than 80',
      },
      render: {
        func: term => term === 'normal' || term === 'directory',
        err: 'Render query can only be normal or directory',
      },
    };
    this.loopValidity(req);
    this.returnProcess(res, next);
  }

  loopValidity(req) {
    const self = this;
    this.lookUpMap = Object.keys(req.query).map((key) => {
      req.query[key] = vali.stripLow(req.query[key]);
      if(key === 'search'){
        req.query[key] = decodeURI(req.query[key]);
      }else{
        req.query[key] = req.query[key].replace(/[^a-zA-Z0-9-_]/g, '');
      }
      if (!self.lookUp[key]) {
        return { name: key, valid: false, err: 'Cannot process query param' };
      }
      if (this.lookUp[key] && this.lookUp[key].func(req.query[key]) === true) {
        self.isValidCount++;
        return { name: key, valid: true };
      }
      return { name: key, valid: false, err: self.lookUp[key].err };
    });
  }

  returnProcess(res, next) {
    if (this.isValidCount === this.lookUpMap.length) {
      console.log('Outside 403 NExt');
      next();
    } else {
      console.log('403');
      res.status(403).send({ error: true, message: this.lookUpMap.map(m => ((m.err) ? `${m.err}. ` : '')).join('') });
    }
  }
};
module.exports = Validate;
