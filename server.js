// dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

var request = require('request');
var cheerio = require('cheerio');

// morgan and bodyparser
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

// public a static dir
app.use(express.static('public'));


// Database configuration with mongoose
// mongoose.connect('mongodb://localhost/ScrapingTheWeb');
mongoose.connect('mongodb://heroku_8mx0d9w4:q67d78ps7v3u2gr1pja866nh7u@ds029496.mlab.com:29496/heroku_8mx0d9w4');
var db = mongoose.connection;

// show any mongoose errors
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

// once logged in to the db through mongoose, log a success message
db.once('open', function() {
  console.log('Mongoose connection successful.');
});


var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


// Routes

// Simple index route
app.get('/', function(req, res) {
  res.send(index.html);
});

app.get('/scrape', function(req, res) {
  request('http://www.cultofmac.com/category/news/', function(error, response, html) {
    console.log(html);
    var $ = cheerio.load(html);
    $('div.article-wrapper > article > header h2').each(function(i, element) {

    		// save an empty result object
				var result = {};

				result.title = $(this).children('a').text();
				result.link = $(this).children('a').attr('href');

				var entry = new Article (result);

				// save that entry to the db
				entry.save(function(err, doc) {
				  if (err) {
				    console.log(err);
				  }
				  else {
				    console.log(doc);
				  }
				});


    });
  });

  res.send("Scrape Complete");
});

// this will get the articles we scraped from the mongoDB
app.get('/articles', function(req, res){
	// grab every doc in the Articles array
	Article.find({}, function(err, doc){
		// log any errors
		if (err){
			console.log(err);
		}
		// or send the doc to the browser as a json object
		else {
			res.json(doc);
		}
	});
});

// grab an article by it's ObjectId
app.get('/articles/:id', function(req, res){
	// using the id passed in the id parameter,
	// prepare a query that finds the matching one in our db...
	Article.findOne({'_id': req.params.id})
	// and populate all of the notes associated with it.
	.populate('note')
	// now, execute our query
	.exec(function(err, doc){
		// log any errors
		if (err){
			console.log(err);
		}
		// otherwise, send the doc to the browser as a json object
		else {
			res.json(doc);
		}
	});
});


// replace the existing note of an article with a new one
// or if no note exists for an article, make the posted note it's note.
app.post('/articles/:id', function(req, res){
	// create a new note and pass the req.body to the entry.
	var newNote = new Note(req.body);

	// and save the new note the db
	newNote.save(function(err, doc){
		// log any errors
		if(err){
			console.log(err);
		}
		// otherwise
		else {
			Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
			// execute the above query
			.exec(function(err, doc){
				// log any errors
				if (err){
					console.log(err);
				} else {
					// or send the document to the browser
					res.send(doc);
				}
			});
		}
	});
});


// listen on port 3000
// app.listen(3000, function() {
//   console.log('App running on port 3000!');
// });
var PORT = process.env.PORT || 3000;
app.listen(PORT);
