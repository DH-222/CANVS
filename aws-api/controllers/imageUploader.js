const fs = require('fs');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const multiparty = require('multiparty');
const path = require('path');
const gm = require('gm').subClass({ imageMagick: true });
const aws = require('./awsS3');

const maxFileSize = 0;
const uploadedFilesPath = path.join(__dirname, 'uploads/profiles');
const uuidv1 = require('uuid/v1');

const User = require('../models/User');

const exclude = {
  organizations: 0,
  murals: 0,
  artist: 0,
  drafts: 0,
  role: 0,
  tags: 0,
  created_at: 0,
  updatedAt: 0,
  createdAt: 0,
  is_approved: 0,
  updated_at: 0,
  sign_in_count: 0,
  current_sign_in_at: 0,
  last_sign_in_at: 0,
  __v: 0
};
const lookUp = {
  JPEG: 'jpeg',
  PNG: 'png'
};
let userD;
const currentUser = id => User.findById(id, exclude).exec(user => user);

const isValid = size => maxFileSize === 0 || size < maxFileSize;

const onSimpleUpload = (fields, file, res, id) => {
  if (!isValid(file.size)) {
    res.status(403).send({ error: true, message: 'Pic is too large' });
  }
  currentUser(id)
    .then(user => moveUploadedFile(file, user))
    .then(data => formatGM(data))
    .then(fileD => aws.aS3(fileD))
    .then(result => saveProfileData(result))
    .then(userB => res.send({ success: true, message: userB.picture }))
    .catch(() => res.status(403).send({ error: true, message: 'could not create profile pic' }));
};

const moveUploadedFile = (file, user) => {
  userD = user;
  const ext = path.extname(file.path);
  file.name = `profile--${user._id}--${uuidv1()}${ext}`;
  const mainDir = `${uploadedFilesPath}/`;
  const filePath = mainDir + file.name;
  return moveFile(mainDir, file, filePath);
};

saveProfileData = (result) => {
  userD.picture = result.key;
  return userD.save(user => user);
};

const moveFile = (mainDir, file, filePath) => new Promise((resolve, reject) => {
  mkdirp(mainDir, (error) => {
    let sourceStream,
      destStream;
    if (error) {
      reject();
    } else {
      sourceStream = fs.createReadStream(file.path);
      destStream = fs.createWriteStream(filePath);

      sourceStream
        .on('error', (error) => {
          destStream.end();
          reject();
        })
        .on('end', () => {
          destStream.end();
          resolve({ filePath, mainDir, name: file.name });
        })
        .pipe(destStream);
    }
  });
});

const formatGM = fData => new Promise((resolve, reject) => {
  const image = gm(fData.filePath);
  image.format((err, value) => {
    image.size((err, size) => {
      const wd = size.width;
      if (wd > 801) {
        image.resize(800);
      }
      image.write(`${fData.mainDir}/${fData.name}`, (err) => {
        if (err) {
          reject();
        } else {
          resolve({ name: fData.name });
        }
      });
    });
  });
});

exports.imageHandler = (req, res, next) => {
  const form = new multiparty.Form();
  form.parse(req, (err, fields, files) => {
    // res.set('Content-Type', 'text/plain');
    onSimpleUpload(fields, files.file[0], res, req.user.id);
  });
};
