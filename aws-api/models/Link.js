const mongoose = require('mongoose')

const linksSchema = new mongoose.Schema({
    name: String,
    murals: [{ name: String, mid: String, _id: false }],
    artist: [{ name: String, mid: String, _id: false }],
}, { timestamps: true, usePushEach: true })

linksSchema.pre('save', function save (next) {
    const link = this
    return next()
})

const Link = mongoose.model('Link', linksSchema)

module.exports = Link
