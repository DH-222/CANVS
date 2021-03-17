const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');
const gm = require('gm');

const filesPath = path.join(__dirname, 'uploads/profiles');
const lookUp = {
  JPEG: 'image/jpeg',
  PNG: 'image/png'
};
AWS.config.update({
  accessKeyId: 'AKIAIOROFFFZWFYDFFIQ',
  secretAccessKey: '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'
});

const s3 = new AWS.S3();

const getImageFormat = imgLoc => new Promise((resolve, reject) => {
  gm(imgLoc).format((err, value) => {
    if (err) reject('issues with image format');
    resolve(lookUp[value]);
  });
}).catch(() => 'Could not save image');

const uploadS3 = (imgLoc) =>
  new Promise((resolve, reject) => {
    getImageFormat(imgLoc).then((format) => {
      const params = {
        ACL: 'public-read',
        Bucket: process.env.S3_BUCKET,
        Body: fs.createReadStream(imgLoc),
        Key: `profiles/${path.basename(imgLoc)}`,
        ContentType: 'image/png'
      };

      s3.upload(params, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }).catch(() => { throw new Error('Could not save images'); });


const assembleS3Post = (file) => {
  const imgLoc = `${filesPath}/${file.name}`;
  return uploadS3(imgLoc)
    .then(result => result);
};

module.exports.aS3 = file => assembleS3Post(file);
