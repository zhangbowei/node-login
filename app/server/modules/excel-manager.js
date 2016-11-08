
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;
var moment = require('moment');

/*
	ESTABLISH DATABASE CONNECTION
*/

var dbName = process.env.DB_NAME || 'node-login';
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, { auto_reconnect: true }), { w: 1 });
db.open(function (e, d) {
	if (e) {
		console.log(e);
	} else {
		if (process.env.NODE_ENV == 'live') {
			db.authenticate(process.env.DB_USER, process.env.DB_PASS, function (e, res) {
				if (e) {
					console.log('mongo :: error: not authenticated', e);
				}
				else {
					console.log('mongo :: authenticated and connected to database :: "' + dbName + '"');
				}
			});
		} else {
			console.log('mongo :: connected to database :: "' + dbName + '"');
		}
	}
});

var excels = db.collection('excels');

exports.getAllRecords = function (callback) {
	excels.find().toArray(
		function (e, res) {
			if (e) callback(e)
			else callback(null, res)
		}
	);
}

exports.getUserRecords = function (a, callback) {
	excels.find({ $or: a }).toArray(
		function (e, res) {
			if (e) callback(e)
			else callback(null, res)
		}
	);
}

exports.updateExcel = function (newData, callback) {
	excels.findOne({ user: newData.user }, function (e, o) {
		if (o) {
			o.excel = newData.excel;
			excels.save(o, { safe: true }, callback);
		} else {
			newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
			excels.insert(newData, { safe: true }, callback);
		}
	});
}

exports.delAllRecords = function (callback) {
	excels.remove({}, callback);
}

