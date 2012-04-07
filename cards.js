var 
	http = require('http'), 
	querystring = require('querystring'), 
	DOM = require('com.izaakschroeder.dom'),
	AsyncArray = require('com.izaakschroeder.async-array');

function MagicCards() {
	this.sets = [ ];
	this.currentSet = -1;
	this.currentSetCards = null;
	this.currentSetCard = -1;
	this.host = 'magiccards.info';
	this.port = 80;
}

MagicCards.prototype.loadSets = function(callback) {
	var self = this, request = http.request({
		host: self.host,
		port: self.port,
		path: '/sitemap.html',
		method: "GET"
	}, function(response) {
		DOM.parse(response, function(doc) {
			self.sets = [ ];
			doc.querySelector("h2").nextElementSibling.querySelectorAll("small").forEach(function(node) {
				self.sets.push(node.textContent);
			});
			self.currentSet = 0;
			callback();
		});
	});
	request.end();
}

MagicCards.prototype.loadCards = function(callback) {
	var self = this;

	if (self.sets.length === 0)
		self.loadSets(proceed);
	else
		proceed();
	
	function proceed() {
		if (self.currentSetCards && self.currentSetCard < self.currentSetCards.length) {
			callback(false);
		}
		else {
			
			if (self.currentSetCard >= 0 && self.currentSetCard >= self.currentSetCards.length)
				if (++self.currentSet >= self.sets.length)
					return callback(true);
			http.request({
				host: self.host,
				port: self.port,
				path: '/'+self.sets[self.currentSet]+'/en.html',
				method: "GET"
			}, function(response) {
				DOM.parse(response, function(doc) {
					self.currentSetCards = doc.querySelectorAll("table tr td:first-child[align=right]").map(function(i) { return i.textContent; });
					self.currentSetCard = 0;
					callback(false);
				});
			}).end();
		}
	}
}

MagicCards.prototype.nextBlock = function(callback) {
	var self = this;
	
	self.loadCards(function(noMore) {	
		if (noMore)
			return callback([]);
		
		http.request({
			host: self.host,
			port: self.port,
			path: '/'+self.sets[self.currentSet]+'/en/'+self.currentSetCards[self.currentSetCard]+'.html',
			method: "GET"
		}, function(response) {
			DOM.parse(response, function(doc) {
				++self.currentSetCard;
				callback([{
					set: doc.querySelector("td[align=center] a").textContent,
					name: doc.querySelector("span a").textContent,
					icon: doc.querySelector("td img:not([alt=en])").getAttribute("src"),
					type: doc.querySelector("td p").textContent,
					//mechanics: doc.querySelector(".ctext b").textContent,
					description: doc.querySelector("p i").textContent

				}]);
			})
		}).end();
	})
	
}

module.exports = new AsyncArray(new MagicCards());

