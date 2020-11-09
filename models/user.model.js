const mongoose = require('mongoose')
const mongoosastic = require ("mongoosastic")

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

userSchema.plugin(mongoosastic, {
    hosts: "localhost:9200",
    port: 9200,
    protocol: "http",
    index :  "todologs",
    type: "todologs",
})

module.exports = userSchema