const mongoose = require('mongoose')

const organizationSchema = new mongoose.Schema({
    name: { type: String, index: true },
    about: String,
    address: String,
    state: String,
    zipcode: Number,
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
    murals: [{ name: String, mid: String, _id: false }],
    user: { name: String, mid: String, _id: false },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    }
}, { timestamps: true, usePushEach: true })

organizationSchema.pre('save', function save (next) {
    const organization = this
    return next()
})

const Organization = mongoose.model('Organization', organizationSchema)

module.exports = Organization
