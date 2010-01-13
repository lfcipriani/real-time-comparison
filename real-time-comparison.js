var connection = null;
var anonymous_jid = null;
var is_connected = false;
var terms = [];

var Collecta = {
	subscribeSearchStanza: function(searchName) {
		return $iq({type: 'set', from: anonymous_jid, to: 'search.collecta.com', id: searchName })
			    	.c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
			    		.c('subscribe', {node: 'search', jid: anonymous_jid})
					.up().c('options')
							.c('x', {xmlns: 'jabber:x:data', type: 'submit'})
								.c('field', {"var": 'FORM_TYPE', type: 'hidden'})
									.c('value').t('http://jabber.org/protocol/pubsub#subscribe_options')
			    				.up().up().c('field', {"var": 'x-collecta#apikey'})
									.c('value').t(Config.API_KEY)
								.up().up().c('field', {"var": 'x-collecta#query'})
									.c('value').t(searchName);
	},
	unsubscribeStanza: function() {
		return $iq({type: 'set', from: anonymous_jid, to: 'search.collecta.com', id: 'unsubscribe42'})
					.c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
				    	.c('unsubscribe', {node: 'search', jid: anonymous_jid});
	},
	processItem: function(item) {
		
	}
};

function startComparison() {
	console.log("Subscribing to nodes: "+ terms[0] +" and "+ terms[1]);
	connection.send(Collecta.subscribeSearchStanza(terms[0]).tree());
	connection.send(Collecta.subscribeSearchStanza(terms[1]).tree());
}

function log(msg) 
{
    $('#log').append('<div></div>').append(document.createTextNode(msg));
}

function rawInput(data)
{
    log('RECV: ' + data);
}

function rawOutput(data)
{
    log('SENT: ' + data);
}

// ********* XMPP Callbacks *********

function onConnect(status)
{
    if (status == Strophe.Status.CONNECTING) {
	log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
	log('Strophe failed to connect.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTING) {
	log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
	log('Strophe is disconnected.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
		connection.addHandler(onPresence, null, 'presence', null, null, null);                       
	    connection.addHandler(onIq, null, 'iq', null, null, null); 
	    connection.addHandler(onMessage, null, 'message', null, null, null);
	    console.log("Sending presence...");
	    connection.send($pres().tree());
    }
}

function onPresence(prs) {
	console.log("Got presence!");
    anonymous_jid = $(prs).attr('to');
	$('#go').removeAttr('disabled');
	$('#warning').text("Type 2 things to compare and go...");
	return true;
}

function onIq(xml) {
	xmlDom = $(xml);	
	var iqId = xmlDom.attr('id');
	if (iqId == terms[0] || iqId == terms[1]) {
		if (xmlDom.find('subscription:first').attr('subscription') == 'subscribed') {
			console.log("Subscribed to "+iqId);
	    }
	}
	return true;
}

function onMessage(msg) {
    console.log(msg);
	return true;
}

// ****************

$(document).ready(function () {
	$('#go').attr('disabled','disabled');
    connection = new Strophe.Connection(Config.BOSH_SERVICE);
    connection.rawInput = rawInput;
    connection.rawOutput = rawOutput;
	connection.connect(Config.HOST, null, onConnect);

    $('#go').bind('click', function () {
		var button = $('#go').get(0);
		if (button.value == 'go') {
		    button.value = 'stop';
			terms.push($('#term1').val());
			terms.push($('#term2').val());
		    startComparison();
		} else {
		    button.value = 'go';
			console.log("Unsubscribing...");
			connection.send(Collecta.unsubscribeStanza().tree());
		    //connection.disconnect();
		}
    });
});