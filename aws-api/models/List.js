const mongoose = require('mongoose')

const listSchema = new mongoose.Schema({
    name: { type: String, index: true },
    spotted: [{ mid: String, users: [], legacyUser: [], modelType: String, _id: false }],
    likes: [{ mid: String, users: [], legacyUser: [], modelType: String, _id: false }],
    artistFollows: [{ mid: String, users: [], _id: false }],
    draftImages: []
}, { timestamps: true, usePushEach: true })

listSchema.pre('save', function save (next) {
    const post = this
    return next()
})

const List = mongoose.model('List', listSchema)

module.exports = List
