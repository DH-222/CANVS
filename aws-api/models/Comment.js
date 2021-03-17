
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  comments: [
    { text: String,
      modelId: String,
      user: { name: String, mid: String, userPic: String, _id: false }
    }
  ]
}, { timestamps: true, usePushEach: true });


const comment = mongoose.model('Comment', commentSchema);

module.exports = comment;
