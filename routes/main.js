var router = require('express').Router()
var vulnDict = require('../config/vulns')
var ratingsDict = require('../config/ratings')
var authHandler = require('../core/authHandler')
var ratingState = require('../config/ratingState')

module.exports = function (passport) {
	router.get('/', authHandler.isAuthenticated, function (req, res) {
		res.redirect('/learn')
	})

	router.get('/login', authHandler.isNotAuthenticated, function (req, res) {
		res.render('login')
	})

	router.get('/learn/vulnerability/:vuln', authHandler.isAuthenticated, function (req, res) {
		var query_rating = req.query.securityRating ? req.query.securityRating : ratingState[req.params.vuln];
		ratingState[req.params.vuln] = query_rating
		if(req.params.vuln == 'a3_sensitive_data'){
			ratingState['a5_broken_access_control'] = 0
		}
		res.render('vulnerabilities/layout', {
			vuln: req.params.vuln,
			vuln_title: vulnDict[req.params.vuln],
			vuln_scenario: req.params.vuln + '/scenario',
			vuln_description: req.params.vuln + '/description',
			vuln_reference: req.params.vuln + '/reference',
			vulnerabilities:vulnDict,
			ratings: ratingsDict[req.params.vuln],
			securityRating: query_rating
		}, function (err, html) {
			if (err) {
				console.log(err)
				res.status(404).send('404')
			} else {
				res.send(html)
			}
		})
	})

	router.get('/learn', authHandler.isAuthenticated, function (req, res) {
		res.render('learn',{vulnerabilities:vulnDict})
	})

	router.get('/register', authHandler.isNotAuthenticated, function (req, res) {
		var query_rating = req.query.securityRating ? req.query.securityRating : 0;	
		res.render('register', {
			ratings: ratingsDict['register'],
			securityRating: query_rating
		})
	})

	router.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	})

	router.get('/forgotpw', function (req, res) {
		var query_rating = req.query.securityRating ? req.query.securityRating : 0;
		res.render('forgotpw', {
			ratings: ratingsDict['forgotpw'],
			securityRating: query_rating
		});
	})

	router.get('/resetpw', authHandler.resetPw)

	router.post('/login', passport.authenticate('login', {
		successRedirect: '/learn',
		failureRedirect: '/login',
		failureFlash: true
	}))

	router.post('/register', function(req, res, next){
		passport.authenticate('signup', {
			successRedirect: '/learn',
			failureRedirect: '/register?securityRating=' + req.body.securityRating,
			failureFlash: true
		})(req, res, next);
	})
	
	router.post('/forgotpw', authHandler.forgotPw)

	router.post('/resetpw', authHandler.resetPwSubmit, function(req, res){
		res.render('resetpw', {login: req.login, token: req.token, securityRating: req.securityRating})
	})

	router.post('/2fa/generate', authHandler.generateTwoFactorAuthenticationCode);

	router.post('/2fa/turn-on', authHandler.turnOnTwoFactorAuthentication);


	return router
}
