const vali = require('validator');
// vali.isByteLength(str [, options])
const userValidate = class {
  constructor() {
  }
  // TODO sanitize and clean up user inputs
  lookUpParams(req, res, next) {
    this.isValidCount = 0;
    this.urlOpt = { protocols: ['http', 'https'] };
    this.modelCheck = ['mural', 'artist', 'tag', 'link', 'organ', 'image'];
    this.roles = ['user', 'contrib', 'admin'];
    this.cleanse = ['role', 'gender', 'firstName', 'lastName', 'address', 'state', 'city', 'name', 'mid', '_id', 'id', 'modelType', 'zipcode', 'country'];
    this.escape = ['bio'];
    const { urlOpt: uO, modelCheck: mC} = this;
    this.lookUp = {
      email: {
        func: email => vali.isEmail(email),
        err: 'Email is not correctly formatted'
      },
      password: {
        func: pass => vali.isLength(pass, { min: 3, max: 20 }),
        err: 'Password format is incorrect',
      },
      userName: {
        func: userName => vali.isLength(userName, { min: 4, max: 30 }),
        err: 'User names must be between 4 and 30 characters long',
      },
      created_at: {
        func: val => val !== '' || val !== undefined,
        err: 'Key Name is not correctly inputted',
      },
      gender: {
        func: (val) => {
          const valG = val.toLowerCase();
          return (valG === 'male' || valG === 'female');
        },
        err: 'Gender must me Male or Female',
      },
      fullName: {
        func: val => val !== '' || val !== undefined,
        err: 'Key Name is not correctly inputted',
      },
      role: {
        func: role => this.roles.indexOf(role) >= 0,
        err: 'Supplied role si not allowed',
      },
      firstName: {
        func: val => val !== '' || val !== undefined,
        err: 'Model for search is not correctly inputted',
      },
      lastName: {
        func: val => val !== '' || val !== undefined,
        err: 'Term for search is not correctly inputted',
      },
      bio: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      address: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      state: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      city: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      zipcode: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      country: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      webUrl: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      facebookLink: {
        func: val => val !== '' || val !== undefined,
        err: 'Facebook url format is incorrect',
      },
      instagramLink: {
        func: val => val !== '' || val !== undefined,
        err: 'Instagram url format is incorrect',
      },
      twitterLink: {
        func: val => val !== '' || val !== undefined,
        err: 'Twitter url format is incorrect',
      },
      youtubeLink: {
        func: val => val !== '' || val !== undefined,
        err: 'Youtube url format is incorrect',
      },
      picture: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      location: {
        func: val => val !== '' || val !== undefined,
        err: 'Could not find location in payload',
      },
      avatar: {
        func: val => val !== '' || val !== undefined,
        err: 'Must supply model to query',
      },
      collectionName: {
        func: val => val !== '' || val !== undefined,
        err: 'Missing collection name',
      },
      name: {
        func: val => val !== '' || val !== undefined,
        err: 'Missing name values',
      },
      mid: {
        func: val => vali.isMongoId(val),
        err: 'Not a valid id',
      },
      id: {
        func: val => val !== '' || val !== undefined,
        err: 'Missing id values',
      },
      _id: {
        func: val => val !== '' || val !== undefined,
        err: 'Missing _id values',
      },
      modelType: {
        func: val => mC.indexOf(val) > -1,
        err:'Model type must be one of mural, artist, tag, link, organ or image'
      },
      spotted: {
        func: val => this.deepCheck(req.body.spotted, val),
        err: 'Incorrect values sent for spotted'
      },
      likes: {
        func: val => this.deepCheck(req.body.likes, val),
        err: 'Incorrect values sent for spotted'
      },
      data: {
        func: val => this.deepCheck(req.body.data, val),
        err: 'Incorrect values sent for collection Data'
      },
      search: {
        func: val => this.deepCheck(req.body.data, val),
        err: 'Incorrect values sent for collection Data'
      }
    };
    this.loopValidity(req);
    this.returnProcess(res, next);
  }

  loopValidity(req) {
    const self = this;
    this.lookUpMap = Object.keys(req.body).map((key) => {
      this.cleanseStrings(req, key);
      if (this.lookUp[key] && this.lookUp[key].func(req.body[key]) === true) {
        self.isValidCount++;
        return { name: key, valid: true };
      }
      if (!this.lookUp[key]) {
        return { name: key, valid: false, err: `Could not accept key ${key}` };
      }
      return { name: key, valid: false, err: self.lookUp[key].err };
    });
  }

  deepCheck(parent, val) {
    let counter = 0;
    const mapLook = ['mid', 'name', 'modelType'];
    const lookUp = Object.keys(val).map((key) => {
      parent[key] = vali.trim(val[key]);
      if (this.cleanse.indexOf(key) > -1) {
        parent[key] = parent[key].replace(/[^a-zA-Z0-9-_ .,']/g, '');
      }
      if (mapLook.indexOf(key) > -1 && (parent[key] !== '' || parent[key] !== undefined)) {
        counter++;
      }
    });
    if (counter === lookUp.length) {
      return true;
    }
    return false;
  }

  cleanseStrings(req, key) {
    if (typeof (req.body[key]) === 'string') {
      req.body[key] = vali.trim(req.body[key]);
      if (this.cleanse.indexOf(key) > -1) {
        req.body[key] = req.body[key].replace(/[^a-zA-Z0-9-_,' %&() ]/g, '');
      }
    }
  }

  returnProcess(res, next) {
    if (this.isValidCount === this.lookUpMap.length) {
      next();
    } else {
      res.status(403).send({ error: true, message: this.lookUpMap.map(m => ((m.err) ? `${m.err}. ` : '')).join('') });
    }
  }
};
module.exports = userValidate;
