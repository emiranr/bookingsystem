require('dotenv').config()

const express = require('express')
const app = express()
const port = process.env.PORT

const path = require('path')

const orderRouter = require('./api/order')
const paymentRouter = require('./api/payment')

const bodyParser = require('body-parser');

const MongoPool = require("./db/pool.js");
MongoPool.initPool();

app.use(bodyParser.urlencoded({
  extended: true,
  limit:'50mb'
}));

app.use(bodyParser.raw({limit:'50mb'}));
app.use(bodyParser.json({ limit: '50mb' }));

app.use(express.static('public'))

app.use('/order', orderRouter)
app.use('/payment', paymentRouter)

app.get('/', (req, res) => {
  res.send('Booking System API')
})

app.get('/doc', (req,res) => {
  res.sendFile(path.join(__dirname, 'doc.html'))
})
app.use(function(req, res) {
  res.status(404).end('Not Found');
});

app.listen(port, () => {
  console.log(`Booking API is online`)
})