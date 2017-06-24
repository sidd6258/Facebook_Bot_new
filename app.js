'use strict';

const
    config = require('config'),
    bodyParser = require('body-parser'),
    express = require('express'),
    request = require('request');

var mysql= require('./routes/mysql');


var app = express();
app.set('port', process.env.PORT || 5000);
app.use(express.static('public'));
app.use(bodyParser.json());


// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
    process.env.MESSENGER_APP_SECRET :
    config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
    (process.env.MESSENGER_VALIDATION_TOKEN) :
    config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.SERVER_URL) ?
    (process.env.SERVER_URL) :
    config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN)) {
    console.error("Missing config values");
    process.exit(1);
}

/*
 * validate webhook
 */
app.get('/webhook', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

/*
 * webhook listens to the messages that are sent to the FB Page/App
 */
app.post('/webhook', function (req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function (pageEntry) {

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function (messagingEvent) {
                if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                } else if (messagingEvent.postback) {
                    receivedPostback(messagingEvent);
                } else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });

        res.sendStatus(200);
    }
});

/*
 *called when message received
 */
function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    console.log("message is "+messageText);
    if (messageText) {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        switch (messageText) {
            case 'LIST':
                sendLISTMessage(senderID);
                break;

            case String(messageText.match(/^ADD.*/)):
                sendADDMessage(senderID,messageText);
                break;

            case String(messageText.match(/DONE$.*/)):
                sendDONEMessage(senderID,messageText);
                break;

            case 'LIST DONE':
            	sendLISTDONEMessage(senderID);
                break;

            default:

                // just send back what we received
                sendTextMessage(senderID, messageText);

        }
    } else if (messageAttachments) {
        console.log(messageAttachments);
        sendTextMessage(senderID, "received Message attachment")
    }
}


/*
 *called when postback gets triggered
 */
function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;
    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
    sendTextMessage(senderID, "Postback called");


}



function sendTextMessage(recipientId, messageText) {
	
	console.log("inside sendTextMessage");
	
	if(!messageText.startsWith("LIST") && messageText.endsWith("DONE") ){
		sendDONEMessage(recipientId,messageText);
	}
	else if(messageText.startsWith("LIST") && messageText.endsWith("DONE")){
		
			sendLISTDONEMessage(senderID);
		}
	else{	
			    var messageData = {
			        recipient: {
			            id: recipientId
			        },
			        message: {
			            text:   "Instructions to use BOT\n" +
			            		"1. Use LIST command to view all the Todo Items\n" +
			            		"2. Use ADD \"To do Description\" to add new todo item\n" +
			            		"3. Use 5 DONE to make todo item with serial number 5 as marked Completed\n" +
			            		"4. Use LIST DONE command to list all the completed items\n",
			            metadata: "DEVELOPER_DEFINED_METADATA"
			        }

			    }
			    callSendAPI(messageData);
	}		
}

function sendLISTMessage(recipientId) {
	
	var getResponse="SELECT * FROM \"TODO_LIST\" WHERE \"STATUS\"='Todo' AND \"USER_ID\"='"+recipientId+"' ORDER BY \"sampleid\" ASC;";
	var result;
	mysql.fetchData(function(err,results){
		if(err){
			throw err;
		}
		else 
		{		
				console.log("valid");
				console.log(results);
			    var messageData = {
			        recipient: {
			            id: recipientId
			        },
			        message: {
			            text: (results.TODO_DESC != undefined) ? results.sampleid+'  :  '+results.TODO_DESC:"No items remaining",
			            metadata: "DEVELOPER_DEFINED_METADATA"
			        }
			    };

			    callSendAPI(messageData);
		}  
	},getResponse);	
}



function sendADDMessage(recipientId,messageText) {
	
	var messageText1 = messageText.substr(4, messageText.length);
	
	var getResponse="INSERT INTO \"TODO_LIST\" (\"TODO_DESC\",\"STATUS\",\"USER_ID\") VALUES ('"+messageText1+"','Todo','"+recipientId+"');";
	mysql.insertData(function(err,results){
		if(err){
			throw err;
		}
		else 
		{		
				console.log("valid");
				console.log(results);
			    var messageData = {
			        recipient: {
			            id: recipientId
			        },
			        message: {
			            text: "To-do item \" "+ messageText1+"\" added to the list",
			            metadata: "DEVELOPER_DEFINED_METADATA"
			        }
			    };

			    callSendAPI(messageData);
		}  
	},getResponse);	
	
	
}


function sendDONEMessage(recipientId,messageText) {
	
	console.log("inside sendDONEMessage");
	var messageText1 = parseInt(messageText.substr(0, messageText.length-5));
	var getResponse="UPDATE \"TODO_LIST\" SET \"STATUS\"='Completed' WHERE sampleid="+messageText1+";";
	var selectQuery="SELECT * FROM \"TODO_LIST\" WHERE \"STATUS\"='Completed' AND \"USER_ID\"='"+recipientId+"' AND sampleid="+messageText1+";";
	
	mysql.updateData(function(err,results){
		if(err){
			throw err;
		}
		else 
		{		
				console.log("valid");
				console.log(results);
			    var messageData = {
			        recipient: {
			            id: recipientId
			        },
			        message: {
			            text: "To-do item "+messageText1+" \""+results.TODO_DESC+"\" marked as done.",
			            metadata: "DEVELOPER_DEFINED_METADATA"
			        }
			    };

			    callSendAPI(messageData);
		}  
	},getResponse,selectQuery);	
}


function sendLISTDONEMessage(recipientId) {
	var getResponse="SELECT * FROM \"TODO_LIST\" WHERE \"STATUS\"='Completed' AND \"USER_ID\"='"+recipientId+"';";
	var result;
	mysql.fetchData(function(err,results){
		if(err){
			throw err;
		}
		else 
		{		
				console.log("valid");
				console.log(results);
			    var messageData = {
			        recipient: {
			            id: recipientId
			        },
			        message: {
			            text: (results.TODO_DESC != undefined) ? results.sampleid+'  :  '+results.TODO_DESC:"No items remaining",
			            metadata: "DEVELOPER_DEFINED_METADATA"
			        }
			    };

			    callSendAPI(messageData);
		}  
	},getResponse);	
}


function callSendAPI(messageData) {
	console.log("hi");
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            if (messageId) {
                console.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
                console.log(messageData);
            } else {
                console.log("Successfully called Send API for recipient %s",
                    recipientId);
            }
        } else {
            console.error(response.error);
        }
    });
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

