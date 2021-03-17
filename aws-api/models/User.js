const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  emailShow: Boolean,
  firstName: String,
  fullName: String,
  lastName: String,
  userName: String,
  email: { type: String, index: true },
  artist: [{ name: String, mid: String, _id: false }],
  murals: [{ name: String, mid: String, _id: false }],
  organizations: [{ name: String, mid: String, _id: false }],
  spotted: [{ name: String, modelType: String, mid: String, urlThumb: String, creationDate: Date, _id: false }],
  likes: [{ name: String, modelType: String, mid: String, urlThumb: String, creationDate: Date, _id: false }],
  collectionBook: [{ collectionName: String, creationDate: Date, data: [{ creationDate: Date, name: String, modelType: String, mid: String, urlThumb: String, _id: false }] }],
  drafts: [{ name: String, mid: String, _id: false }],
  artistFollows: [{ name: String, mid: String, modelType: String, creationDate: Date, _id: false }],
  crew: [{ name: String, mid: String }],
  checkIn:[{name: String, mid:String}],
  tagName:String,
  tagImage:String,
  posts: Number,
  is_approved: Boolean,
  location: String,
  uuid: String,
  bio: String,
  gender: String,
  bioShow: Boolean,
  address: String,
  city: String,
  state: String,
  zipcode: String,
  country: String,
  locationShow: Boolean,
  webUrl: String,
  facebookLink: String,
  instagramLink: String,
  twitterLink: String,
  youtubeLink: String,
  linkShow: Boolean,
  picture: { type: String, default: '/app-images/default-user-pic.png' },
  avatar: { type: String, default: '/app-images/default-user-profile.png' },
  role: String,
  active: Number,
  password: String,
  sign_in_count: Number,
  updated_at: String,
  created_at: String,
  last_sign_in_at: String,
  current_sign_in_at: String,
  last_sign_in_ip: String,
  current_sign_in_ip: String,
  faceBookAuth: {
    id: String,
    token: String,
    firstName: String,
    lastName: String,
    email: String,
    _id: false
  }
}, { timestamps: true, usePushEach: true });

/** customize
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
