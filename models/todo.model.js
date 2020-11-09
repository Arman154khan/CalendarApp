const mongoose = require('mongoose')
const mongoosastic = require ("mongoosastic")

var todoSchema = new mongoose.Schema({
    date: {
        type: String,
        required: "Required!"
    },
    content: {
        type: String,
        required: "Required!"
    },
    username: {
        type: String,
        required: "Required!"
    }
})

todoSchema.plugin(mongoosastic, {
    hosts: "localhost:9200",
    port: 9200,
    protocol: "http",
    index :  "todologs",
    type: "todologs",
})

module.exports = todoSchema