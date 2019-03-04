var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');

var app = express();

app.use(express.static('www'));
app.use(express.static(path.join('www', 'build')));

app.use(bodyParser.json());


var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/dreamhouse';

if (process.env.DATABASE_URL !== undefined) {
  pg.defaults.ssl = true;
}

var client = new pg.Client(connectionString);
client.connect();

var propertyTable = 'property__c';
var favoriteTable = 'favorite__c';
var brokerTable = 'account';

// setup the demo data if needed
client.query('SELECT * FROM salesforce.account', function(error, data) {
  if (error !== null) {
    client.query('SELECT * FROM account', function(error, data) {
      if (error !== null) {
        console.log('Loading Demo Data...');
        require('./db/demo.js')(client);
        console.log('Done Loading Demo Data!');
      }
    });
  }
  else {
    var schema = 'salesforce.';
    propertyTable = schema + 'property__c';
    favoriteTable = schema + 'favorite__c';
    brokerTable = schema + 'account';
  }
});


app.get('/property', function(req, res) {
  client.query('SELECT * FROM ' + propertyTable, function(error, data) {
    res.json(data.rows);
  });
});

app.get('/property/:id', function(req, res) {
  client.query('SELECT ' + propertyTable + '.*, ' + brokerTable + '.sfid AS account_sfid, ' + brokerTable + '.name AS account_name, ' + brokerTable + '.personemail AS account_personemail, ' + brokerTable + '.phone AS account_phone, ' + brokerTable + '.personmobilephone AS account_personmobilephone, ' + brokerTable + '.persontitle AS account_persontitle, ' + brokerTable + '.picture__c AS account_picture__c FROM ' + propertyTable + ' INNER JOIN ' + brokerTable + ' ON ' + propertyTable + '.account = ' + brokerTable + '.sfid WHERE ' + propertyTable + '.sfid = $1', [req.params.id], function(error, data) {
    res.json(data.rows[0]);
  });
});


app.get('/favorite', function(req, res) {
  client.query('SELECT ' + propertyTable + '.*, ' + favoriteTable + '.sfid AS favorite__c_sfid FROM ' + propertyTable + ', ' + favoriteTable + ' WHERE ' + propertyTable + '.sfid = ' + favoriteTable + '.property__c', function(error, data) {
    res.json(data.rows);
  });
});

app.post('/favorite', function(req, res) {
  client.query('INSERT INTO ' + favoriteTable + ' (property__c) VALUES ($1)', [req.body.property__c], function(error, data) {
    res.json(data);
  });
});

app.delete('/favorite/:sfid', function(req, res) {
  client.query('DELETE FROM ' + favoriteTable + ' WHERE sfid = $1', [req.params.sfid], function(error, data) {
    res.json(data);
  });
});


app.get('/broker', function(req, res) {
  client.query('SELECT * FROM ' + brokerTable, function(error, data) {
    res.json(data.rows);
  });
});

app.get('/broker/:sfid', function(req, res) {
  client.query('SELECT * FROM ' + brokerTable + ' WHERE sfid = $1', [req.params.sfid], function(error, data) {
    res.json(data.rows[0]);
  });
});

var port = process.env.PORT || 8200;

app.listen(port);

//console.log('Listening at: http://localhost:' + port);
