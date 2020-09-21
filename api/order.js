const express = require('express')
const router = express.Router()

const randomstring = require("randomstring");
const MongoPool = require("../db/pool.js");
const sanitize = require('mongo-sanitize')

// create new order

router.post('/', function (req, res) {   

    // Implement payload checking. on top of front end checking, implement here for extra security,
    // and possible services integration at the backend side

    // check for user details
    // booking details

    // we use unix tstamp and 10 character random string concatenation to generate paymentID

    const paymentID = [new Date().getTime(), randomstring.generate(10)].join("_");

    // schema is not properly implemented here. 
    // if implemented, may consider to have keys like customer to be able to take ad-hoc notes

    /*
        schema of the order object is as follows:
        
        {
            hotelID: string,
            hotelName: string,
            bookingDetails: {
                checkIn: bigint (unix tstamp),
                checkOut: bigint (unix tstamp),
                roomID: string,
                roomName: string,
                guestCount: int
            },
            customer: {
                name: string,
                phone: string,
                email: string
            },
            amount: real,
            paymentID: string
        }

    */
    // in actual usage, the AMOUNT should be checked against central listing db to ensure integrity of data being processed here
    
    // we sanitize for null (we require all values to at least be empty string) and nested object to only one level.

    const newOrder = req.body

    // check if null
    if(!newOrder) return res.status(400).send({
        msg: "Some values are not valid"
    })

    // iterate to check for null and deeper nested objects
    var isNotValid = Object.values(newOrder).some(item => {
        if(typeof item == "object") {
          return Object.values(item).some(subItem => {
            if(subItem == null || typeof subItem == "object") return true
          })
        } else {
          if(item == null) return true
        }
    })

    if(isNotValid) return res.status(400).send({
        msg: "Some values are not valid"
    })

    // insert paymentID
    newOrder.paymentID = paymentID

    const paymentDetails = {
        paymentID: paymentID,
        amount: newOrder.amount,
        paid: false
    }

    MongoPool.getInstance(function(db) {
        
        var dbo = db.db("trainsandbox");

        dbo.collection("orders").insertOne(newOrder, function(err, result) {
            
            if(err) return res.status(500).send({
                msg: "Server error"
            })
            
            dbo.collection("payments").insertOne(paymentDetails, function(err, result_1) {
                
                if(err) return res.status(500).send({
                    msg: "Server error"
                })

                res.sendStatus(200)
            });

        }); 
    });

})  

// query orders
router.post('/query', function (req, res) {   

    // this endpoint in production should be protected with tokens/auth pairs

    // the /query endpoint accepts 4 types of filters, one at a time. 

    // if more than one is provided, only the first one will be processed
    // however, this can be expanded easily to include more filters

    var { mode, filter } = req.body;

    const validFilters = [
        "hotelName",
        "custName",
        "custEmail",
        "custPhone"
    ]

    // check if null, return with code
    if(!filter) return res.status(400).send({
        msg: "Invalid filter"
    })

    // extract first key, if more than one. 

    const filteredKey = Object.keys(filter)[0]
    
    // check if filter is valid, if not, return with error code
    if(!validFilters.includes(filteredKey)) return res.status(400).send({
        msg: "Invalid filter"
    })

    // sanitize query input, then create regex for search
    const filteredValue = new RegExp(sanitize(Object.values(filter)[0]), "i")

    var query = {}

    // converts filterKeys to actual query. 
    // obvious improvement includes regexing for correct type (phone, email). but then it is a search so not so critical (but still important)
    
    switch(filteredKey) {
        case "hotelName":
            query = {
                "hotelName": filteredValue
            }
            break
        case "custName":
            query = {
                "customer.name": filteredValue
            }
            break
        case "custEmail":
            query = {
                "customer.email": filteredValue
            }
            break
        case "custPhone":
            query = {
                "customer.phone": filteredValue
            }
            break
        default: 
            break
    }

    MongoPool.getInstance(function(db) {
        
        var dbo = db.db("trainsandbox");

        dbo.collection("orders").find(query).toArray(function(err, result) {
            
            if(err) return res.status(500).send({
                msg: "Server error"
            })

            res.send(result)

        }); 

    });

})  

module.exports = router