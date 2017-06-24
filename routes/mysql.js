var pg = require('pg');
var config = require('config');

const DATABASE_URL = (process.env.DATABASE_URL) ?
	    (process.env.DATABASE_URL) :
	    config.get('databaseUrl');
	    
exports.fetchData=function fetchData(callback,sqlQuery)
{
	

	pg.defaults.ssl = true;
	pg.connect(DATABASE_URL, function(err, client) {
	  if (err) throw err;
	  console.log('Connected to postgres! Getting schemas...');

	  client
	    .query(sqlQuery)
	    .on('row', function(row) {
	      console.log(JSON.stringify(row));
	      callback(err, row);
	    });
	});	
}	

exports.insertData=function insertData(callback,sqlQuery)
{
	

	pg.defaults.ssl = true;
	pg.connect(DATABASE_URL, function(err, client) {
	  if (err) throw err;
	  console.log('Connected to postgres! Getting schemas...');

	  client
	    .query(sqlQuery,function(err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log('row inserted');
                callback(err, result);
            }

        });
	});	
}	

exports.updateData=function insertData(callback,sqlQuery,selectQuery)
{
	

	pg.defaults.ssl = true;
	pg.connect(DATABASE_URL, function(err, client) {
	  if (err) throw err;
	  console.log('Connected to postgres! Getting schemas...');

	  client.query(sqlQuery,function(err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log('row updated');
            }

        });
	  client
	    .query(selectQuery)
	    .on('row', function(row) {
	      console.log(JSON.stringify(row));
	      callback(err, row);
	    });
	});	
}	