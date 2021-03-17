
const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  checks: [{
    type: String,
    user: { name: String, mid: String, _id: false },
    data: String,
    imageThumb: String,
    imageUrl: String,
    muralId: String,
    liked: [{ name: String, mid: String }],
    comment: String,
  }]
}, { timestamps: true, usePushEach: true });


const checkIn = mongoose.model('CheckIn', checkInSchema);

module.exports = checkIn;
