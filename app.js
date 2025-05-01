const express = require('express');
const app = express();
const bodyParser = require('body-parser');
//const methodOverride = require('method-override');
const path = require('path');
const Grid = require('gridfs-stream');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.set("strictQuery", false);
const cors = require('cors');
require('dotenv/config');
const authJwt = require('./helpers/jwt');

const errorHandler = require('./helpers/error-handler');
app.use(authJwt());




// app.options('*', cors(corsOptions)); ;
app.use(cors());
app.options("*", cors());
app.use(express.json())

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*');// Allow requests from any domain
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Accept,authJwt ");
  next();
});

  
app.use(express.urlencoded({ extended: true}))
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))

app.use(morgan('tiny'));


app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

app.use(errorHandler);
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'))
  });


  


//Routes
const categoriesRoutes = require('./routers/categories');
const productsRoutes = require('./routers/products');
const usersRoutes = require('./routers/users');
const ordersRoutes = require('./routers/orders');
const bannerRoutes = require('./routers/Banner');
const orderschargeRoutes = require('./routers/ordercharge');
const api = process.env.API_URL;
// Apply the JWT authentication middleware to specific routes



app.use(`${api}/categories`,categoriesRoutes,);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/banners`, bannerRoutes);
app.use(`${api}/ordercharge`, orderschargeRoutes);



//Database
  mongoose.connect(process.env.DB_URL, {
   
    dbName: 'eshopedb'
})
.then(()=>{
    console.log('Database Connection is ready...')
})
.catch((err)=> {
    console.log(err);
})
// var conn = mongoose.createConnection(process.env.DB_URL, {
   
//     dbName: process.env.DB_NAME});
// conn.once('open', function () {
//   var gfs = Grid(conn.db, mongoose.mongo);
 
  // all set!
//})

// Init gfs
//let gfs;

//conn.once('open', () => {
  //   // Init stream
  //   gfs = Grid(conn.db, mongoose.mongo);
  //   gfs.collection('uploads');
  // });

//Server
const port=process.env.PORT
app.listen(port, ()=>{

    console.log("Express is running on port "+process.env.PORT);
})