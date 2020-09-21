const express = require('express')
var router = express.Router()

const MongoPool = require("../db/pool.js");

const Payment = require("../utils/mocks.js") 

const payment = new Payment()



router.post('/status', function (req, res) {   

    // fetch bill details, from paymentID
    var { paymentID } = req.body
    var patt = new RegExp(/^\w+$/)
    var isValid = patt.test(paymentID)

    if(!isValid) return res.status(400).send({
        msg: "Invalid Payment ID"
    })

    const findBill = {
        paymentID: paymentID
    }
    
    MongoPool.getInstance(function(db) {

        var dbo = db.db("trainsandbox")

        dbo.collection("payments").findOne(findBill, function(err, result) {

            if(err) return res.status(500).send({
                msg: "Server error"
            })

            if(!result) {
                res.status(404).send({
                    msg: "Payment ID not found"
                })
            } else {
                res.status(200).send({
                    msg: "Status check successful",
                    paid: result.paid,
                    tstamp: result.tstamp 
                })

            }

        });
    })

})  

router.post('/pay', function (req, res) {   

    // implements a mock payments gateway
    // upon successful payments, update payment status to successful

    // paymentGatewayReference is identifier to this particular transaction, created prior to submitting to this endpoint. 
    // Card details are used to create this reference
    
    var { paymentID, paymentGatewayReference} = req.body

    var patt = new RegExp(/^\w+$/)
    var isValid = patt.test(paymentID)

    if(!isValid || !paymentGatewayReference) res.status(400).send({
        msg: "Invalid Payment ID or missing Gateway Reference"
    })

    // update will not happen if paid is already true. 
    // a better checker of paid condition (request status prior to execution) should be implemented in production. 
    
    var billToBePaid = {
        paymentID: paymentID,
        paid: false
    }

    // set 
    // - paid to true
    // - log date
    var payUpdate = {
        "$set": {
            paid: true,
            tstamp: new Date().getTime()
        }
    }

    // mock payment gateway. if fail won't update DB. 
    if(!payment.pay(paymentGatewayReference)) return res.status(402).send({
        msg: "Payment Failed"
    })

    MongoPool.getInstance(function(db) {

        var dbo = db.db("trainsandbox")

        dbo.collection("payments").updateOne(billToBePaid, payUpdate, function(err, result) {
            
            if(err) return res.status(500).send({
                msg: "Server error"
            })
            
            res.status(200).send({
                msg: "Payment Successful"
            })
        });
    })
})  

module.exports = router