const mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: "Required!"
    },
    password: {
        type: String,
        required: "Required!"
    }
})

module.exports = userSchema