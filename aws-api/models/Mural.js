const mongoose = require('mongoose');

const muralSchema = new mongoose.Schema({
  legacyID: { type: String },
  name: { type: String, index: true },
  archive: { type: Boolean, default: false },
  about: String,
  address: String,
  city: { type: String, index: true },
  state: { type: String, index: true },
  zipcode: { type: String, index: true },
  country: { type: String, index: true },
  latitude: Number,
  longitude: Number,
  creationDate: Date,
  organizations: [{ name: String, mid: String, _id: false }],
  links: [{ name: String, mid: String, _id: false }],
  mainThumb: String,
  comments: String,
  checkIns: String,
  images: [{
    name: { type: String, index: true },
    text: String,
    uuid: { type: String, _id: false },
    user: [{ name: String, mid: String, _id: false }],
    murals: [{ name: String, mid: String, _id: false }],
    bucket: String,
    thumbName: String,
    largeName: String,
    thumbId: String,
    urlThumb: String,
    urlLarge: String,
    newImage: { type: Boolean, default: false },
    Etags: [{ name: String, tag: String, _id: false }],
    mid: String,
    _id: false }],
  likes: { legacy: [String], users: [String], _id: false },
  spotted: { legacy: [String], users: [String], _id: false },
  tags: [{ name: String, mid: String, _id: false }],
  artist: [{
    name: String,
    mid: String,
    followed: [],
    murals: [],
    about: String,
    facebookLink: String,
    instagramLink: String,
    twitterLink: String,
    youtubeLink: String,
    webUrl: String,
    picture: { type: String, default: '/app-images/default-artist-pic.png' },
    avatar: { type: String, default: '/app-images/default-artist-profile.png' },
    _id: false }],
  spottedCount: Number,
  likesCount: Number,
  freshMural: { type: Boolean, default: false },
  views: Number,
  isCVNew: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  youtube: String,
  vimeo: String,
  user: { name: String, mid: String, _id: false },
  recordCreated: Date,
  imageInputs: [],
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  }
}, { timestamps: true, usePushEach: true });
muralSchema.index({ location: '2dsphere' });
muralSchema.pre('save', function save(next) {
  const mural = this;
  return next();
});

const Mural = mongoose.model('Mural', muralSchema);

Mural.on('index', (error) => {
  // "_id index cannot be sparse"
  if (error) console.log('Error: ', error.message);
  if (!error) console.log('Indexed');
});

module.exports = Mural;
