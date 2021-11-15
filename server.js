require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const id = require('shortid');
const validUrl = require("valid-url");
const dns = require('dns');
const urlParser = require('url');
//const mongo = require("mongoDb").MongoClient;



// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});



// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


///////////////////////////////////////////////////////////////////
//This is where my code starts
//Add Body parser
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//DB connections
const mongoose = require('mongoose');
const myUri = process.env.MONGO_URI;
mongoose.connect(myUri, { useNewUrlParser: true});

//Add Schema, model
const urlSchema = new mongoose.Schema({url: 'string'});
const Url = mongoose.model('Url', urlSchema);
//check mongoose connection
console.log(mongoose.connection.readyState)

//Responses fill this Object
const resObj = {}


///////////Main Handler//////////////////////////////
app.post('/api/shorturl', async function (req, res) {
  //names the input url
  let inUrl = req.body['url'];
  console.log("inUrl is " + inUrl);
  
//added dns llokup late, because .isUri didn't pass the test. Left .isUri in there anyway
const dnsMachine =dns.lookup(urlParser.parse(inUrl).hostname,
(error, address) => {
  if (!address) {
    //error message if dns isn't working
    res.json({error: "invalid url"})
    console.log("didn't pass dnsMachine")
  } else {
      //.isUri isn't really neccessary anymore with dns.lookup in there
      if(!validUrl.isUri(inUrl)) {
      res.json({error: "invalid url"});
    }else {
      //this adds the .url and the .id to my DB
        const entry = new Url({ url: inUrl });
        entry.save((err, data) => {
          res.json({
            original_url:data.url,
            short_url: data.id
          })
        })
    }  
  }
})
});
  
//redirects to related inUrl if the id shows up in the database
app.get("/api/shorturl/:id", (req, res) => {
  //const id = req.params.id;
  const id = req.params.id
  console.log("id is " + id);
  Url.findOne({_id: id}, (err, data) => {
    if(!data) {
      console.log("didnt redirect")
      console.log("this data is " + data)
      res.json({error: "Invalid Url"})
    }else {
      console.log("that data is " + data)
      console.log("did redirect")
      res.redirect(data.url)      
    }
  })  
})