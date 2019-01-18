
module.exports = function(robot) {
	//15 minutes
	var DEFAULT_BIDDING_INTERVAL = 900000;
	var areWeBidding = function() {
		return (robot.brain.get('bidTimer') * 1 || 0);
	}

	function vals(obj) {
		var vals = [];
		for(var i in obj) {
			if(!obj.hasOwnProperty(i)) continue;
			vals.push(obj[i]);
		}
		return vals;
	}
	function objKeys(obj) {
		var ks = [];
		for(var i in obj) {
			if(!obj.hasOwnProperty(i)) continue;
			ks.push(i);
		}
		return ks;
	}
	function hasBidsToRemove(bid, place, valueInt, res) {
		var spent = JSON.parse(robot.brain.get('spent')) || {};
		var user = res.message.user.name;
		if (spent[user][place] >= valueInt) {
			return true;
		}
		return false;
	}
	function getLeader() {
		var bids = JSON.parse(robot.brain.get('openBids')) || {};
		var bidsArray = [];
		for(var i in bids) {
			if(!bids.hasOwnProperty(i)) continue;
			var obj = {};
			obj[i] = bids[i];
			bidsArray.push(obj);
		}
		bidsArray = bidsArray.sort(function(a,b) {
			if (vals(a)[0] < vals(b)[0]) {
				return 1;
			} else if (vals(a)[0] > vals(b)[0]) {
				return -1;
			} else {
				return 0;
			}
		});
		return bidsArray[0];
	}
	function getLeaderName() {
		var leader = getLeader();
		return objKeys(leader)[0];
	}
	function updateUserSpentCount(place, valueInt, res) {
		try {
			var spent = JSON.parse(robot.brain.get('spent')) || {};
			var user = res.message.user.name;

			if (!spent[user]) {
				spent[user] = {};
			}
			if (!spent[user][place] && valueInt > 0) {
				spent[user][place] = valueInt;
			} else {
				spent[user][place] = Math.max(spent[user][place] + valueInt, 0);
			}

			robot.brain.set('spent', JSON.stringify(spent, null, 2));

		} catch(e) {
			res.send("ERROR UPDATING USER SPENT COUNT:");
			res.send(e.message);
		}
	}
	function twoMinuteWarning(res) {
		var interval = robot.brain.get("bidInterval");
		var twoMinInterval = interval - 120000;
		if (twoMinInterval > 0) {
			var t = setTimeout(function(){
				res.send('@here TWO MINUTE WARNING!');
			}, twoMinInterval);
			robot.brain.set('twoMinuteWarningTimeout', t);
		}
	}

	function executeWildcard(res, value){
		var arr = [
			"mcdonalds",
			"burger king",
			"wendys",
			"5 guys",
			"qdoba",
			"pancheros",
			"super moon",
			"food court", 
			"oph", 
			"breadsmith", 
			"great harvest", 
			"morts", 
			"punch", 
			"pizza luce", 
			"little caesars", 
			"pizza hut express",
			"bakers",
			"china palace",
			"pei wei",
			"big 10",
			"taco bell",
			"lions tap",
			"pineda",
			"chick fil a",
			"reds savoy",
			"headwaters cafe",
			"hoagies family restaurant",
			"rusty taco",
			"teque arepa",
			"aurelias",
			"scoreboard",
			"famous daves",
			"arbys",
			"d brians",
			"subway",
			"samba taste of brazil",
			"b grizzlys",
			"applebees",
			"noodles",
			"smashburger",
			"culvers",
			"davannis",
			"khans mongolian bbq",
			"gas station gyros"
		];
		var wildcardLocation = Math.floor(Math.random() * (arr.length - 1));
		var bid = JSON.parse(robot.brain.get('openBids')) || {};
	    if(value){
			updateUserSpentCount(arr[wildcardLocation], value, res);
			res.send("```" + res.message.user.name + " added " + value + ' Darper Dollars to ' + arr[wildcardLocation] + "```")
			if(typeof bid[arr[wildcardLocation]] === "number"){
				bid[arr[wildcardLocation]] += parseInt(value);
			} else {
				bid[arr[wildcardLocation]] = parseInt(value);
			}
	    } else {
			var sortedArr = [];
			var prop;
		    for (prop in bid) {
		        if (bid.hasOwnProperty(prop)) {
		            sortedArr.push({
		                'key': prop,
		                'value': bid[prop]
		            });
		        }
		    }
		    sortedArr.sort(function(a, b) {
		        return b.value - a.value;
		    });
	    	var wildcardValue = (sortedArr.length > 0) ? (Math.floor((Math.random() * 10) + 1)) + sortedArr[0].value : (Math.floor((Math.random() * 10) + 1));
	    	res.send("```Wildcard added " + wildcardValue + ' Darper Dollars to ' + arr[wildcardLocation] + "```")
	    	if(typeof bid[arr[wildcardLocation]] === "number"){
				bid[arr[wildcardLocation]] += wildcardValue;
			} else {
				bid[arr[wildcardLocation]] = wildcardValue;
			}
	    }
		robot.brain.set('openBids', JSON.stringify(bid, null, 2));
	}

	function startWildcardTimer(res) {
		var interval = robot.brain.get("bidInterval");
		var wildcardIntervalRandom = Math.floor((Math.random() * 50000) + 10000);
		var wildcardInterval = interval - wildcardIntervalRandom;
		if (wildcardInterval > 0) {
			var wildcard = Math.floor((Math.random() * 100) + 1);
			var t = setTimeout (function(){
				if (wildcard <= 33){
					executeWildcard(res);
				}
			}, wildcardInterval);
			robot.brain.set('wildcardTimeout', t);
		}
	}

	function biddingHasClosed(res) {
		var leader = getLeaderName();
		robot.brain.set('bidTimer', 0);
		res.send("Final tally:");
		res.send(robot.brain.get('openBids'));
		res.send("Darper Dollars spent:");
		res.send(robot.brain.get('spent'));
		robot.brain.set('openBids', JSON.stringify({}, null, 2));
		robot.brain.set('spent', JSON.stringify({}, null, 2));
		robot.brain.set('startTime', 0);
		res.send("Bidding CLOSED!");
		res.send((leader ? leader : 'No one') + ' wins!');
	}
	function theFinalCountdown(res, beginCountdownIn, countdownFrom) {
		var interval = robot.brain.get("bidInterval");
		if (interval - 10000 > 0) {
			return setTimeout(function() {
				if (countdownFrom > 0) {
					res.send(countdownFrom + '!');
					theFinalCountdown(res, 1000, --countdownFrom);
				}
			}, beginCountdownIn || (interval - 10000));
		} else {
			return null;
		}
	}
	function millisecToReadableTime(ms) {
		var readable = ms / 1000;
		if (readable > 60) {
			var mins = readable / 60;
			var secs = (mins % 1) * 60;
			readable = Math.floor(mins) + ' minutes, ' + (Math.round(secs*100)/100) + ' seconds';
		} else {
			readable = readable + ' seconds';
		}
		return readable;
	}
	function runIfBidding(res, fn) {
		if (areWeBidding()) {
			try {
				fn(res);
			} catch(e) {
				res.send(e.stack);
			}
		} else {
			return res.send("We're not bidding right now!");
		}
	}

	robot.hear(/^\$bid start(\s\d+|\s{0})$/i, function(res) {
		var timerSwitch;
		timerSwitch = robot.brain.get('bidTimer') * 1 || 0;
		if (!timerSwitch) {
			robot.brain.set('bidTimer', 1);
			robot.brain.set('openBids', JSON.stringify({}, null, 2));
			robot.brain.set('spent', JSON.stringify({}, null, 2));

			var interval = res.match && res.match[1] ? parseInt(res.match[1], 10) * 1000 * 60 : DEFAULT_BIDDING_INTERVAL;
			setTimeout(function() {
				var timerSwitch2 = robot.brain.get('bidTimer') * 1 || 0;
				if (timerSwitch2) {
					return biddingHasClosed(res);
				}
			}, interval);

			robot.brain.set("bidInterval", interval);

			startWildcardTimer(res);
			twoMinuteWarning(res);
			robot.brain.set("countdownTimeout", theFinalCountdown(res, null, 10));

			res.send("```Bidding has started! You have "+ millisecToReadableTime(interval) + "```");
			return robot.brain.set('startTime', new Date().getTime());
		} else {
			return res.send("```Bidding already started!```");
		}
	});

	robot.hear(/^\$bid (\d+) (.*)/, function(res) {
		try {
			var bid, newPlace, timerSwitch, value, valueInt;
			timerSwitch = robot.brain.get('bidTimer') * 1 || 0;
			if (!timerSwitch) {
				return res.send("```We're not bidding right now!```");
			} else {
				newPlace = (res.match[2] + "").toLowerCase();
				value = res.match[1];
				if (newPlace.match(/(pablo|d p|dp|^don)/i)) {
					return res.send("```Don Pablo's es no bueno!```");
				} else if (newPlace === "wildcard") {
					executeWildcard(res, value);
				} else {
					if (!value) {
						value = 0;
					}
					valueInt = parseInt(value, 10);
					bid = JSON.parse(robot.brain.get('openBids')) || {};
					if (typeof bid[newPlace] === "number") {
						bid[newPlace] += valueInt;
					} else {
						bid[newPlace] = valueInt;
					}
					robot.brain.set('openBids', JSON.stringify(bid, null, 2));
					updateUserSpentCount(newPlace, valueInt, res);
					return res.send("```" + res.message.user.name + " added " + valueInt + ' Darper Dollars to ' + newPlace + "```");
				}
			}
		}catch(e) {
			res.send("```ERROR:```");
			res.send("```" + e.message + "```");
		}
	});

	robot.hear(/^\$bid remove (\d+) (.*)/, function(res) {
		try {
			var bid, key, timerSwitch, value, valueInt;
			timerSwitch = robot.brain.get('bidTimer') * 1 || 0;
			if (!timerSwitch) {
				return res.send("```We're not bidding right now!```");
			} else {
				key = res.match[2];
				value = res.match[1];
				if (!value) {
					value = 0;
				}
				valueInt = parseInt(value, 10);
				bid = JSON.parse(robot.brain.get('openBids')) || {};
				var place = key.toLowerCase();
				if (typeof bid[place] === 'number') {
					if (hasBidsToRemove(bid, place, valueInt, res)) {
						if (bid[place] - valueInt > -1) {
							bid[place] -= valueInt;
							if (bid[place] === 0) {
								delete bid[place];
							}
							robot.brain.set('openBids', JSON.stringify(bid, null, 2));
							updateUserSpentCount(place, valueInt*-1, res);
							return res.reply("removed " + valueInt + ' Darper Dollars from ' + place);
						} else {
							res.reply("removed " + bid[place] + ' Darper Dollars from ' + place);
							bid[place] = 0;
							delete bid[place];
							return robot.brain.set('openBids', JSON.stringify(bid, null, 2));
						}
					} else {
						var spent = JSON.parse(robot.brain.get('spent')) || {};
						res.reply('You can\'t remove that many Darper Dollars! You have only bidded ' + spent[res.message.user.name][place] + ' on \''+place+'\'');
					}
				} else {
					return res.send("```" + place + " doesn't exist!" + "```");
				}
			}

		}catch(e) {
			res.send("```ERROR:```");
			res.send("```" + e.message + "```");
		}
	});

	robot.hear(/^\$bid list$/, function(res) {
		var timerSwitch = robot.brain.get('bidTimer') * 1 || 0;
		if (!timerSwitch) {
			return res.send("```We're not bidding right now!```");
		} else {
			return res.send("```" + robot.brain.get('openBids') + "```");
		}
	});

	robot.hear(/^\$bid timeleft$/, function(res){
		var timerSwitch = robot.brain.get('bidTimer') * 1 || 0;
		if (!timerSwitch) {
			return res.send("```We're not bidding right now!```");
		} else {
			var start = robot.brain.get('startTime');
			var now = new Date().getTime();
			var interval = robot.brain.get("bidInterval");
			var timeLeftInMs = interval - (now - start);
			var timeRemainingHumanReadable = Math.max(timeLeftInMs / 1000, 0);
			if (timeRemainingHumanReadable > 60) {
				var mins = timeLeftInMs / 1000 / 60;
				var secs = (mins % 1) * 60;
				timeRemainingHumanReadable = Math.floor(mins) + ' minutes, ' + (Math.round(secs*100)/100) + ' seconds';
			} else {
				timeRemainingHumanReadable = timeRemainingHumanReadable + ' seconds!';
			}
			return res.send('```Time Left: ' + timeRemainingHumanReadable + "```")
		}
	});

	robot.hear(/^\$bid starttime$/, function(res) {
		if (areWeBidding()) {
			var date =  new Date(robot.brain.get('startTime'));
			var hrs = date.getHours();
			var whichHalf = hrs >= 12 ? "PM" : "AM";
			hrs = hrs > 12 ? hrs - 12 : hrs;
			var mins = date.getMinutes();
			var secs = date.getSeconds();
			secs = secs < 10 ? "0"+""+secs : secs;
			return res.send('```Bidding started at: ' + (hrs+":"+mins+":"+secs+" "+whichHalf) + "```");
		} else {
			return res.send("We're not bidding right now!");
		}
	});
	robot.hear(/^\$bid spent$/, function(res) {
		if (areWeBidding()) {
			return res.send("```" + robot.brain.get('spent') + "```");
		} else {
			return res.send("```We're not bidding right now!```");
		}
	});
	robot.hear(/^\$bid leader$/, function(res) {
		try {
			if (areWeBidding()) {
				var leader = getLeader();
				if (leader) {
					res.send('```Current leader: ' + objKeys(leader)[0] + ' with ' + vals(leader)[0] + "```" );
				} else {
					res.send('```No one is winning! Now is your chance! BID!```')
				}
			} else {
				return res.send("```We're not bidding right now!```");
			}
		}catch(e) {
			res.send("```" + e.stack + "```");
		}
	});

	robot.hear(/^\$bid help$/, function(res) {
		var help = '```usage: $bid [<darper-dollar-count> <place-to-eat>] [<command>]\n\n'
		+ '-  start [<bid interval>]      Start a bidding session. You can optionally set a bidding interval. Default is 15 minutes\n'
		+ '-  remove <amount> <place>   Removes the given amount of your Darper Dollars from a given place\n'
		+ '-  list                             List of the current bids\n'
		+ '-  leader                        Display the current bid in the lead\n'
		+ '-  timeleft                       Displays time remaining\n'
		+ '-  starttime                     Displays the time bidding began\n'
		+ '-  spent                          Displays how many Darper Dollars each bidder has bid\n'
		+ '-  stop                            End the current bidding session```';
		res.send(help);
	});

	return robot.hear(/^\$bid stop$/, function(res) {
		runIfBidding(res, function(res) {
			clearTimeout(robot.brain.get('twoMinuteWarningTimeout'));
			clearTimeout(robot.brain.get('wildcardTimeout'));
			clearTimeout(robot.brain.get('countdownTimeout'));
			biddingHasClosed(res);
		});
	});
};
