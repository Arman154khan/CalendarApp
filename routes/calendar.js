const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const fs = require('fs')
const path = require("path")
const pdfc = require('pdf-creator-node')
const body = require('body-parser')
const dateformat = require('dateformat')
const DOWNLOAD_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'downloads/');
const UserSchema = require('../models/user.model')

router.post('/newPost', (req, res, next) => {
    addLog(req, req.query.XYLatLng, req.query.buffer, req.query.addressType, req.query.otherFeatures)
    res.sendStatus(200)
})

router.post('/register', (req, res, next) => {
    var UserLog = mongoose.model("users", UserSchema)
    var userLog = new UserLog()

    userLog.username = req.body.username

    if (req.body.password == req.body.confirm){
        userLog.password = req.body.password

        userLog.save((err, doc) => {
            if (!err) {
                console.log("Registered!")
                res.render(path.join(path.resolve(__dirname, '..') + '/views/login.html'));
            } else {
                console.log("error registering " + err)
                res.sendStatus(err)
            }
        })
    } else {
        alert("Passwords do not match")
        console.log("password's do not match")
    }
})

router.post('/login', (req, res, next) => {
    var UserLog = mongoose.model("users", UserSchema)

    UserLog.findOne({username: req.body.username, password: req.body.password}).then(function(user){
        console.log(user)
    })
})

router.get("/register", (req, res, next) => {
    res.render(path.join(path.resolve(__dirname, '..') + '/views/register.html'));
})

router.get("/login", (req, res, next) => {
    res.render(path.join(path.resolve(__dirname, '..') + '/views/login.html'));
})

router.get('/newGet', (req, res, next) => { 
    pdfCreate(req.query.day.toString(), req.query.month.toString(), req.query.year.toString())
    csvCreate(req.query.day.toString(), req.query.month.toString(), req.query.year.toString())
    res.sendStatus(200)
})

function csvCreate(day, month, year) {
    if (isNaN(year) == false || year == ""){
        var currentDate = Date.now().toString()

        var columns = [
            'functionName',
            'date',
            'userIP',
            'XYLatLng',
            'buffer',
            'addressType',
            'otherFeatures'
        ]

        var formatMonth = ""
    
        const months = ["january", "february", "march", "april", "may", "june", 
        "july", "august", "september", "october", "november", "december"]
    
        const monthShort = ["jan", "feb", "mar", "apr", "may", "jun", 
        "jul", "aug", "sep", "oct", "nov", "dec"]
    
        if (month != undefined) {
            if (months.indexOf(month.toLowerCase()) != -1){
                formatMonth = ("0" + (months.indexOf(month.toLowerCase()) + 1))
            } else if (monthShort.indexOf(month.toLowerCase()) != -1){
                formatMonth = ("0" + (monthShort.indexOf(month.toLowerCase()) + 1))
            } else {
                if (isNaN(month) == false){
                    formatMonth = month
                } else {
                    console.log('Please enter a valid month')
                }
            }
        }
    
        formatMonth = formatMonth.slice(-2)
        var uDate = day + "-" + formatMonth + "-" + year
    
        if (day != undefined && isNaN(day) == false){
            var TrackLog = mongoose.model(uDate, TrackSchema)
    
            TrackLog.find({}).lean().then(function(log){

                var writeStream = fs.createWriteStream(path.join(DOWNLOAD_DIR, "logs", uDate + "_" + currentDate + ".csv"))
                
                writeStream.write(columns.join(',')+ '\n', () => {
                    console.log("A line was written")
                })

                log.forEach((logItem, index) => {     
                    var newLine = []
                    newLine.push(logItem.functionName)
                    newLine.push(logItem.date)
                    newLine.push(logItem.userIP)
                    newLine.push(logItem.geocodeData.XYLatLng[0] + "; " + logItem.geocodeData.XYLatLng[1])
                    newLine.push(logItem.geocodeData.buffer)
                    newLine.push(logItem.geocodeData.addressType)
                    newLine.push(logItem.geocodeData.otherFeatures)
                
                    writeStream.write(newLine.join(',') + '\n', () => {
                        console.log("A line was written")
                    })
                })
                
                writeStream.end()
                
                writeStream.on('finish', () => {
                    console.log('finish write stream, moving along')
                }).on('error', (err) => {
                    console.log(err)
                })
            })
    
        } else if (day == "undefined" && month != undefined){
            var collectionNames = []
            var totalLogs = []
            var findComplete = 0
    
            mongoose.connection.db.listCollections().toArray().then(function(collections){
                for (var i of collections){
                    if (i.name.substring(3,5) == formatMonth && i.name.substring(6,10) == year){
                        collectionNames.push(i.name)
                    }
                }
    
                for (var j in collectionNames){
                    var TrackLog = mongoose.model(collectionNames[j], TrackSchema)
                
                    TrackLog.find({}).lean().then(function(log){
                        log.forEach(function(track){
                            totalLogs.push(track)
                        })
                        findComplete += 1
    
                        if (findComplete == collectionNames.length){

                            var writeStream = fs.createWriteStream(path.join(DOWNLOAD_DIR, "logs", formatMonth + "-" + year + "_" 
                            + currentDate + ".csv"))

                            writeStream.write(columns.join(',')+ '\n', () => {
                                console.log("A line was written")
                            })

                            totalLogs.forEach((logItem, index) => {     
                                var newLine = []
                                newLine.push(logItem.functionName)
                                newLine.push(logItem.date)
                                newLine.push(logItem.userIP)
                                newLine.push(logItem.geocodeData.XYLatLng[0] + "; " + logItem.geocodeData.XYLatLng[1])
                                newLine.push(logItem.geocodeData.buffer)
                                newLine.push(logItem.geocodeData.addressType)
                                newLine.push(logItem.geocodeData.otherFeatures)
                            
                                writeStream.write(newLine.join(',')+ '\n', () => {
                                    console.log("A line was written")
                                })
                            })
                            
                            writeStream.end()
                            
                            writeStream.on('finish', () => {
                                console.log('finish write stream')
                            }).on('error', (err) => {
                                console.log(err)
                            })
                        }
                    })
                }
            })
    
        }  else if (day == undefined && month == undefined){
            var collectionNames = []
            var totalLogs = []
            var findComplete = 0
    
            mongoose.connection.db.listCollections().toArray().then(function(collections){
                for (var i of collections){
                    if (i.name.substring(6,10) == year){
                        collectionNames.push(i.name)
                    }
                }
    
                for (var j in collectionNames){
                    var TrackLog = mongoose.model(collectionNames[j], TrackSchema)
                
                    TrackLog.find({}).lean().then(function(log){
                        log.forEach(function(track){
                            totalLogs.push(track)
                        })
                        findComplete += 1
    
                        if (findComplete == collectionNames.length){

                            var writeStream = fs.createWriteStream(path.join(DOWNLOAD_DIR, "logs", year + "_" 
                            + currentDate + ".csv"))

                            writeStream.write(columns.join(',')+ '\n', () => {
                                console.log("A line was written")
                            })

                            totalLogs.forEach((logItem, index) => {     
                                var newLine = []
                                newLine.push(logItem.functionName)
                                newLine.push(logItem.date)
                                newLine.push(logItem.userIP)
                                newLine.push(logItem.geocodeData.XYLatLng[0] + "; " + logItem.geocodeData.XYLatLng[1])
                                newLine.push(logItem.geocodeData.buffer)
                                newLine.push(logItem.geocodeData.addressType)
                                newLine.push(logItem.geocodeData.otherFeatures)
                            
                                writeStream.write(newLine.join(',')+ '\n', () => {
                                    console.log("A line was written")
                                })
                            })
                            
                            writeStream.end()
                            
                            writeStream.on('finish', () => {
                                console.log('finish write stream')
                            }).on('error', (err) => {
                                console.log(err)
                            })

                        }
                    })
                }
            })
        } else {
            console.log("Please enter a valid day")
        }
    } else {
        console.log("Input valid year")
    }
}

function pdfCreate(day, month, year) {
    if (isNaN(year) == false || year == ""){
        var html = fs.readFileSync('trackLog.html', 'utf8');
        var formatMonth = ""
    
        var options = {
            format: "A4",
            orientation: "portrait",
            border: "10mm",
            phantomArgs: ['--web-security=no', '--local-url-access=false']
        }
    
        const months = ["january", "february", "march", "april", "may", "june", 
        "july", "august", "september", "october", "november", "december"]
    
        const monthShort = ["jan", "feb", "mar", "apr", "may", "jun", 
        "jul", "aug", "sep", "oct", "nov", "dec"]
    
        if (month != undefined) {
            if (months.indexOf(month.toLowerCase()) != -1){
                formatMonth = ("0" + (months.indexOf(month.toLowerCase()) + 1))
            } else if (monthShort.indexOf(month.toLowerCase()) != -1){
                formatMonth = ("0" + (monthShort.indexOf(month.toLowerCase()) + 1))
            } else {
                if (isNaN(month) == false){
                    formatMonth = month
                } else {
                    console.log('Please enter a valid month')
                }
            }
        }
    
        formatMonth = formatMonth.slice(-2)
        var uDate = day + "-" + formatMonth + "-" + year
    
        if (day != undefined && isNaN(day) == false){
            var TrackLog = mongoose.model(uDate, TrackSchema)
    
            TrackLog.find({}).lean().then(function(log){
                var document = {
                    html: html,
                    data: {
                        logs: log,
                        dateString: uDate
                    },
                    path: path.join(DOWNLOAD_DIR, "logs", uDate + ".pdf")
                    // path: "./logs/" + uDate + ".pdf"
                };
    
                if (fs.existsSync(path.join(DOWNLOAD_DIR, "logs", uDate + ".pdf"))) {
                    fs.unlinkSync(path.join(DOWNLOAD_DIR, "logs", uDate + ".pdf"))
                    console.log("deleted from downloads")
                }
        
                pdfc.create(document, options)
                .then(res => {
                    console.log("PDF Created")
    
                    // var oldP = fs.createReadStream("./logs/" + uDate + ".pdf");
                    // var newP = fs.createWriteStream(path.join(DOWNLOAD_DIR, "logs", uDate + ".pdf"));
    
                    // oldP.pipe(newP);
                    // oldP.on('end', function() { console.log("file copied") });
                    // oldP.on('error', function(err) { console.log("error copying file") });
                })
                .catch(error => {
                    console.error("Error " + error)
                });
    
            })
    
        } else if (day == undefined && month != undefined){
            var collectionNames = []
            var totalLogs = []
            var findComplete = 0
    
            mongoose.connection.db.listCollections().toArray().then(function(collections){
                for (var i of collections){
                    if (i.name.substring(3,5) == formatMonth && i.name.substring(6,10) == year){
                        collectionNames.push(i.name)
                    }
                }
    
                for (var j in collectionNames){
                    var TrackLog = mongoose.model(collectionNames[j], TrackSchema)
                
                    TrackLog.find({}).lean().then(function(log){
                        log.forEach(function(track){
                            totalLogs.push(track)
                        })
                        findComplete += 1
    
                        if (findComplete == collectionNames.length){
                            var document = {
                                html: html,
                                data: {
                                    logs: totalLogs,
                                    dateString: formatMonth + "-" + year
                                },
                                path: path.join(DOWNLOAD_DIR, "logs", formatMonth + "-" + year + ".pdf")
                                // path: "./logs/" + formatMonth + "-" + year + ".pdf"
                            };
    
                            if (fs.existsSync(path.join(DOWNLOAD_DIR, "logs", formatMonth + "-" + year + ".pdf"))) {
                                fs.unlinkSync(path.join(DOWNLOAD_DIR, "logs", formatMonth + "-" + year + ".pdf"))
                                console.log("deleted from downloads")
                            }
                    
                            pdfc.create(document, options)
                            .then(res => {
                                console.log("PDF Created")
    
                                // var oldP = fs.createReadStream("./logs/" + formatMonth + "-" + year + ".pdf");
                                // var newP = fs.createWriteStream(path.join(DOWNLOAD_DIR, "logs", formatMonth + "-" + year + ".pdf"));
                
                                // oldP.pipe(newP);
                                // oldP.on('end', function() { console.log("file copied") });
                                // oldP.on('error', function(err) { console.log("error copying file") });
                            })
                            .catch(error => {
                                console.error("Error " + error)
                            });
                        }
                    })
                }
            })
    
        }  else if (day == undefined && month == undefined){
            var collectionNames = []
            var totalLogs = []
            var findComplete = 0
    
            mongoose.connection.db.listCollections().toArray().then(function(collections){
                for (var i of collections){
                    if (i.name.substring(6,10) == year){
                        collectionNames.push(i.name)
                    }
                }
    
                for (var j in collectionNames){
                    var TrackLog = mongoose.model(collectionNames[j], TrackSchema)
                
                    TrackLog.find({}).lean().then(function(log){
                        log.forEach(function(track){
                            totalLogs.push(track)
                        })
                        findComplete += 1
    
                        if (findComplete == collectionNames.length){
                            var document = {
                                html: html,
                                data: {
                                    logs: totalLogs,
                                    dateString: year
                                },
                                path: path.join(DOWNLOAD_DIR, "logs", year + ".pdf")
                                // path: "./logs/" + year + ".pdf"
                            };
    
                            if (fs.existsSync(path.join(DOWNLOAD_DIR, "logs", year + ".pdf"))) {
                                fs.unlinkSync(path.join(DOWNLOAD_DIR, "logs", year + ".pdf"))
                                console.log("deleted from downloads")
                            }
                    
                            pdfc.create(document, options)
                            .then(res => {
                                console.log("PDF Created")
    
                                // var oldP = fs.createReadStream("./logs/" + year + ".pdf");
                                // var newP = fs.createWriteStream(path.join(DOWNLOAD_DIR, "logs", year + ".pdf"));
                
                                // oldP.pipe(newP);
                                // oldP.on('end', function() { console.log("file copied") });
                                // oldP.on('error', function(err) { console.log("error copying file") });
                            })
                            .catch(error => {
                                console.error("Error " + error)
                            });
                        }
                    })
                }
            })
        } else {
            console.log("Please enter a valid day")
        }
    } else {
        console.log("Input valid year")
    }
}

function addLog(requ, XYLatLng, buffer, addressType, otherFeatures){

    var uXYLatLng = []
    var uBuffer = undefined
    var uAddressType = undefined
    var uOthersFeature = undefined

    var uip = (requ.headers['x-forwarded-for'] || '').split(',').pop().trim() || requ.connection.remoteAddress || requ.socket.remoteAddress || requ.connection.socket.remoteAddress
    var currentDate = dateformat(new Date(), "dd-mm-yyyy h:MM:ss")

    var TrackLog = mongoose.model(currentDate.substring(0,10), TrackSchema)
    var trackLog = new TrackLog()

    trackLog.functionName = requ.originalUrl.split('?', 1)[0]
    trackLog.date = currentDate
    trackLog.userIP = uip
    uXYLatLng =  XYLatLng

    if (buffer > 0 && buffer < 500){
        uBuffer = buffer
    }

    if (addressType.toUpperCase() == 'HDB' || addressType.toUpperCase() == 'ALL'){
        if (addressType.toUpperCase() == "HDB"){
            uAddressType = addressType.toUpperCase()
        } 
        else if (addressType.toUpperCase() == "ALL") {
            uAddressType = "All"
        }
    }

    if (otherFeatures.toUpperCase() == 'Y' || otherFeatures.toUpperCase() == 'N') {
        uOthersFeature = otherFeatures.toUpperCase()
    }

    trackLog.geocodeData = {
        "XYLatLng" : uXYLatLng,
        "buffer": uBuffer,
        "addressType": uAddressType,
        "otherFeatures": uOthersFeature
    }

    TrackLog.find({}).then(function(logs){
        if (logs.length != 0){
            trackLog.counter = logs.length + 1
        } else {
            trackLog.counter = 1
        }
        trackLog.save((err, doc) => {
            if (!err) {
                console.log("new log added")
            } else {
                console.log("error adding log " + err)
            }
        })
        return trackLog
    })
}

module.exports = router