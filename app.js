const express = require("express")
const app = express()
const mongoose = require('mongoose')
var bodyParser = require('body-parser')

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

mongoose.connect('mongodb://localhost:27017/CalendarDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, err => { 
    if (!err) {
        console.log("Success!")
    } else {
        console.log("Failure!" + err)
    }
})
mongoose.Promise = global.Promise

const http = require('http')
const port = process.env.PORT || 4500

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const calendarRoute = require('./routes/calendar')

app.use('/', calendarRoute)
app.use("/static", express.static('./static/'));

const server = http.createServer(app)
server.listen(port, function(){
    console.log("Listening for requests...")
})

module.exports = app;