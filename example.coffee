module.exports = (robot) ->


	#start bidding process
	robot.hear /\/bid start/i, (res) ->
		timerSwitch = robot.brain.get('bidTimer') * 1 or 0
		if !timerSwitch
			robot.brain.set 'bidTimer', 1
			robot.brain.set 'openBids', JSON.stringify({}, null, 2)
			res.send "Bidding has started! You have 15 minutes!"
			setTimeout () ->
				arr = ["McDonalds","Burger King","Wendys"]
				wildcard = Math.floor(Math.random() * (29 - 0) + 0)
				wildcardValue = Math.floor(Math.random() * (10 - 0) + 0)
				res.send(wildcard)
				if (wildcard < 3)
					res.send("/bid " + wildcardValue + " " + arr[wildcard])
					bid = JSON.parse(robot.brain.get('openBids')) or {}
					if typeof bid[arr[wildcard]] == 'number'
						bid[arr[wildcard]] += wildcardValue
					else
						bid[arr[wildcard]] = wildcardValue
					robot.brain.set 'openBids', JSON.stringify(bid, null, 2)
			, 840000
			setTimeout () ->
				timerSwitch2 = robot.brain.get('bidTimer') * 1 or 0
				if timerSwitch2
					robot.brain.set 'bidTimer', 0
					res.send robot.brain.get('openBids')
					robot.brain.set 'openBids', JSON.stringify({}, null, 2)
					res.send("Bidding CLOSED!")
			, 900000
		else
			res.send "Bidding already started!"

#     robot.listen(
#         (message) ->
#             match = message.match(/\/bid (\d+) (.*)/)
#             if match
#                 key = match[2]
#                 value = match[1]
#                 if (!value)
#                     value = 0
#                 valueInt = parseInt(value, 10)
#                 arr = [key, valueInt]
#                 arr
#             else
#                 false
#         (response) ->
#             timerSwitch = robot.brain.get('bidTimer') * 1 or 0
#             if !timerSwitch
#                 response.send "We're not bidding right now!"
#             else
#                 bid = JSON.parse(robot.brain.get('openBids')) or {}
#                 if typeof bid[response.match[0]] == 'number'
#                     bid[response.match[0]] += response.match[1]
#                 else
#                     bid[response.match[0]] = response.match[0]
#                 robot.brain.set 'openBids', JSON.stringify(bid, null, 2)
#                 response.reply "added " + response.match[1] + ' Darper Dollars to ' + response.match[0]
#     )

	#accept a bid
	robot.hear /\/bid (\d+) (.*)/, (res) ->
		timerSwitch = robot.brain.get('bidTimer') * 1 or 0
		if !timerSwitch
			res.send "We're not bidding right now!"
		else
			key = res.match[2]
			value = res.match[1]
			if key.match(/(pablo|d p|dp|^don)/i)
				res.send "Don Pablo's es no bueno!"
			else
				if (!value)
					value = 0
				valueInt = parseInt(value, 10)
				bid = JSON.parse(robot.brain.get('openBids')) or {}
				if typeof bid[key] == 'number'
					bid[key] += valueInt
				else
					bid[key] = valueInt
				robot.brain.set 'openBids', JSON.stringify(bid, null, 2)
				res.reply "added " + valueInt + ' Darper Dollars to ' + key

	#remove bid
	robot.hear /\/bid remove (\d+) (.*)/, (res) ->
		timerSwitch = robot.brain.get('bidTimer') * 1 or 0
		if !timerSwitch
			res.send "We're not bidding right now!"
		else
			key = res.match[2]
			value = res.match[1]

			if (!value)
				value = 0
			valueInt = parseInt(value, 10)
			bid = JSON.parse(robot.brain.get('openBids')) or {}
			if typeof bid[key] == 'number'
				if bid[key] - valueInt > -1
					bid[key] -= valueInt
					robot.brain.set 'openBids', JSON.stringify(bid, null, 2)
					res.reply "removed " + valueInt + ' Darper Dollars from ' + key
				else
					res.reply "removed " + bid[key] + ' Darper Dollars from ' + key
					bid[key] = 0
					robot.brain.set 'openBids', JSON.stringify(bid, null, 2)
			else
				res.send key + " doesn't exist!"

	#list bids
	robot.hear /\/bid list/, (res) ->
		timerSwitch = robot.brain.get('bidTimer') * 1 or 0
		if !timerSwitch
			res.send "We're not bidding right now!"
		else
			res.send robot.brain.get('openBids')

	#stop bids
	robot.hear /\/bid stop/, (res) ->
		timerSwitch = robot.brain.get('bidTimer') * 1 or 0
		if !timerSwitch
			res.send "We're not bidding right now!"
		else
			robot.brain.set 'bidTimer', 0
			res.send robot.brain.get('openBids')
			robot.brain.set 'openBids', JSON.stringify({}, null, 2)
			res.send("Bidding CLOSED!")