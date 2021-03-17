const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
    name: { type: String, index: true },
    text: String,
    uuid: { type: String, index: true },
    user: [{ name: String, mid: String, _id: false }],
    murals: [{ name: String, mid: String, _id: false }],
    bucket: String,
    thumbName: String,
    largeName: String,
    urlThumb: String,
    urlLarge: String,
    thumbId: String,
    newImage: { type: Boolean, default: false },
    Etags: []
}, { timestamps: true, usePushEach: true })

imageSchema.pre('save', function save (next) {
    const tag = this
    return next()
})

const Image = mongoose.model('Image', imageSchema)

module.exports = Image
