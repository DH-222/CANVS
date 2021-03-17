const mongoose = require('mongoose')

const draftSchema = new mongoose.Schema({
    name: { type: String, index: true },
    about: String,
    address: String,
    city: { type: String, index: true },
    state: { type: String, index: true },
    zipcode: { type: String, index: true },
    country: { type: String, index: true },
    latitude: Number,
    longitude: Number,
    creationDate: Date,
    organs: [],
    draftDate: Date,
    links: [],
    tags: [],
    status: String,
    archive: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    artist: [{
        name: String,
        mid: String,
        about: String,
        facebookLink: String,
        instagramLink: String,
        twitterLink: String,
        youtubeLink: String,
        webUrl: String,
        picture: String,
        _id: false }],
    freshMural: { type: Boolean, default: false },
    views: Number,
    youtube: String,
    vimeo: String,
    user: {},
    recordCreated: Date,
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    },
    imageInputs: [],
    mainThumb: 'string'
}, { timestamps: true, usePushEach: true })
draftSchema.index({ location: '2dsphere' })
draftSchema.pre('save', function save (next) {
    const draft = this
    return next()
})

const Draft = mongoose.model('Draft', draftSchema)

Draft.on('index', (error) => {
    // "_id index cannot be sparse"
    if (error) console.log('Error: ', error.message)
    if (!error) console.log('Indexed')
})

module.exports = Draft
