let AWS = require('aws-sdk');
const ses = new AWS.SES();
const ddb = new AWS.DynamoDB.DocumentClient();
const request = require("request");

exports.handler = function (event, context, callback) {
	request.get("https://amtsblattportal.ch/",
		(error, response, body) => {
			if (!body) {
				throw new Error("Failed to fetch homepage!");
			}

			let urls = page.match(/(lp|\?r=specialTopic)\/[^"]*/);
			if (!urls) { // nothing found; no point in proceeding
				return;
			}
			let url = urls[0];

			ddb.get({
				TableName: 'site-data',
				Key: {
					'domain': 'https://amtsblattportal.ch/'
				}
			}, function (err, data) {
				if (err) {
					throw err;
				} else {
					if (!data.Item || data.Item.url != url) {
						ses.sendEmail({
							Destination: {
								ToAddresses: ['transidai1705@gmail.com'],
								CcAddresses: [],
								BccAddresses: []
							},
							Message: {
								Body: {
									Text: {
										Data: url
									}
								},
								Subject: {
									Data: 'MyFavSite Update!'
								}
							},
							Source: 'transidai1705@gmail.com'
						}, function (err, data) {
							if (err) {
								throw err;
							}
							ddb.put({
								TableName: 'site-data',
								Item: {
									'domain': 'https://amtsblattportal.ch/',
									'url': url
								}
							}, function (err, data) {
								if (err) {
									throw err;
								} else {
									console.log("New URL saved successfully!");
								}
							});
						});
					} else {
						console.log("URL already sent out; ignoring");
					}
				}
			});
		});

	callback(null, 'Successfully executed');
}