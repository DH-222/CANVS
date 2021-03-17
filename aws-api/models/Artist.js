const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: { type: String, index: true },
  about: String,
  facebookLink: String,
  instagramLink: String,
  twitterLink: String,
  youtubeLink: String,
  webUrl: String,
  picture:  { type: String, default: '/app-images/default-artist-pic.png' },
  avatar: { type: String, default: '/app-images/default-artist-profile.png' },
  murals: [{ name: String, mid: String, _id: false }],
  user: [{ name: String, mid: String, _id: false }],
  followed: [],
  spottedCount: Number,
  likesCount: Number
}, { timestamps: true, usePushEach: true });

artistSchema.pre('save', function save(next) {
  const artist = this;
  return next();
});

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;
