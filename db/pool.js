// this block of code was based of the mongoDB docs, and a stackoverflow answer

const MongoClient = require('mongodb').MongoClient
const url = process.env.CONNECTION_STRING
var option = {
 db:{
   numberOfRetries : 5
 },
 server: {
   auto_reconnect: true,
   poolSize : 40,
   socketOptions: {
       connectTimeoutMS: 5000
   }
 },
 replSet: {},
 mongos: {}
};
 
function MongoPool(){}
 
var p_db;
 
function initPool(cb){
 MongoClient.connect(url, option, function(err, db) {
   if (err) throw err;
 
   p_db = db;
   if(cb && typeof(cb) == 'function')
       cb(p_db);
 });
 return MongoPool;
}
 
MongoPool.initPool = initPool;
 
function getInstance(cb){
 if(!p_db){
   initPool(cb)
 }
 else{
   if(cb && typeof(cb) == 'function')
     cb(p_db);
 }
}
MongoPool.getInstance = getInstance;
 
module.exports = MongoPool;