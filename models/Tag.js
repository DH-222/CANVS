const mongoose = require('mongoose')

const tagSchema = new mongoose.Schema({
    name: { type: String, index: true },
    murals: [{ name: String, mid: String, _id: false }],
    artist: [{ name: String, mid: String, _id: false }],
    archive: Number,
    active: Number
}, { timestamps: true, usePushEach: true })

tagSchema.pre('save', function save (next) {
    const tag = this
    return next()
})

const Tag = mongoose.model('Tag', tagSchema)

module.exports = Tag
