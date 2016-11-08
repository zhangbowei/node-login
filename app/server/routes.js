
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var EXM = require('./modules/excel-manager');

module.exports = function (app) {

	// main login page //
	app.get('/', function (req, res) {
		// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined) {
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		} else {
			// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function (o) {
				if (o != null) {
					req.session.user = o;
					res.redirect('/home');
				} else {
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});

	app.post('/', function (req, res) {
		AM.manualLogin(req.body['user'], req.body['pass'], function (e, o) {
			if (!o) {
				res.status(400).send(e);
			} else {
				req.session.user = o;
				if (req.body['remember-me'] == 'true') {
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});
	
	// creating new accounts //
	app.get('/signup', function (req, res) {
		res.render('signup', { title: 'Signup', countries: CT });
	});

	app.post('/signup', function (req, res) {
		AM.addNewAccount({
			name: req.body['name'],
			email: req.body['email'],
			user: req.body['user'],
			pass: req.body['pass'],
			country: req.body['country']
		}, function (e) {
			if (e) {
				res.status(400).send(e);
			} else {
				res.status(200).send('ok');
			}
		});
	});

	// password reset //
	app.post('/lost-password', function (req, res) {
		// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function (o) {
			if (o) {
				EM.dispatchResetPasswordLink(o, function (e, m) {
					// this callback takes a moment to return //
					// TODO add an ajax loader to give user feedback //
					if (!e) {
						res.status(200).send('ok');
					} else {
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				}); 0
			} else {
				res.status(400).send('email-not-found');
			}
		});
	});


	app.get('/reset-password', function (req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function (e) {
			if (e != 'ok') {
				res.redirect('/');
			} else {
				// save the user's email in a session instead of sending to the client //
				req.session.reset = { email: email, passHash: passH };
				res.render('reset', { title: 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function (req, res) {
		var nPass = req.body['pass'];
		// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
		// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function (e, o) {
			if (o) {
				res.status(200).send('ok');
			} else {
				res.status(400).send('unable to update password');
			}
		})
	});

	//Guard unLogin User
	app.all('*', function (req, res, next) {
		if (req.session.user == null) {
			// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else {
			next();
		}
	});

	app.get('/home', function (req, res) {
		res.render('home', {
			title: 'Control Panel',
			udata: req.session.user
		});
	});

	app.get('/account', function (req, res) {
		res.render('account', {
			title: 'Control Panel',
			countries: CT,
			udata: req.session.user
		});
	});

	app.post('/account', function (req, res) {
		AM.updateAccount({
			id: req.session.user._id,
			name: req.body['name'],
			email: req.body['email'],
			pass: req.body['pass'],
			country: req.body['country']
		}, function (e, o) {
			if (e) {
				res.status(400).send('error-updating-account');
			} else {
				req.session.user = o;
				// update the user's login cookies if they exists //
				if (req.cookies.user != undefined && req.cookies.pass != undefined) {
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send('ok');
			}
		});
	});

	app.post('/logout', function (req, res) {
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function (e) { res.status(200).send('ok'); });
	})

	app.post('/delete', function (req, res) {
		AM.deleteAccount(req.session.user._id, function (e, obj) {
			if (!e) {
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function (e) { res.status(200).send('ok'); });
			} else {
				res.status(400).send('record not found');
			}
		});
	});

	// add & update excels
	app.get('/excel', function (req, res) {
		var data = {};

		data.title = 'Excel Panel';
		data.udata = req.session.user;

		var callback = function (e, record) {
				var excel, excels = [];
				if (record.length != 0) {
					for (var i in record) {
						excel = record[i].excel.replace(/\[(.*)\]/, function (match, key) {
							return key;
						});
						if (excel) {
							excels.push(excel);
						}
					}
					data.excel = "[" + excels.join(",") + "]";
				}
				res.render('excel', data);
		};

		if (req.session.user.user == "admin") {
			EXM.getAllRecords(callback);
		} else {
			var a = [{ user: req.session.user.user }, { user: "admin" }];
			EXM.getUserRecords(a, callback);		
		}

	});

	app.post('/excel', function (req, res) {
		EXM.updateExcel({
			user: req.session.user.user,
			excel: req.body['excel']
		}, function (e, o) {
			if (e) {
				res.status(400).send('error-updating-excel');
			} else {
				res.status(200).send('ok');
			}
		});
	});

	app.get('/reservation', function (req, res) {
		res.render('reservation', {
		});
	});

	//Guard Normal User
	app.all('*', function (req, res, next) {
		if (req.session.user && req.session.user.user == "admin") {
			next();
		} else {
			res.render('404', { title: 'Page Not Found' });
		}
	});

	app.get('/printAccount', function (req, res) {
		AM.getAllRecords(function (e, accounts) {
			res.render('print', { title: 'Account List', accts: accounts });
		})
	});

	app.get('/resetAccount', function (req, res) {
		AM.delAllRecords(function () {
			res.redirect('/print');
		});
	});

	app.get('/printExcel', function (req, res) {
		EXM.getAllRecords(function (e, excels) {
			res.render('printExcel', { title: 'Excel List', exls: excels });
		});
	});

	app.get('/resetExcel', function (req, res) {
		EXM.delAllRecords(function () {
			res.redirect('/printExcel');
		});
	});

	app.all('*', function (req, res) { 
		res.render('404', { title: 'Page Not Found' }); 
	});

};
