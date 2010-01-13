var connection = null;
var anon_jid = null;

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
	    console.log("sending presence...");
	    connection.send($pres().tree());
    }
}

function onPresence(prs) {
	console.log(prs);
    anon_jid = $(prs).attr('to');    
}

function onIq(xml) {
    console.log(xml);
    
    if ($(xml).find('subscription:first').attr('subscription') == 'subscribed') {
		console.log("yeah! just wait for new entries...");
    }
}

function onMessage(msg) {
    console.log(msg);
}

$(document).ready(function () {
    connection = new Strophe.Connection(Config.BOSH_SERVICE);
    connection.rawInput = rawInput;
    connection.rawOutput = rawOutput;

    $('#connect').bind('click', function () {
	var button = $('#connect').get(0);
	if (button.value == 'connect') {
	    button.value = 'disconnect';

	    connection.connect(Config.HOST, null, onConnect);
	} else {
	    button.value = 'connect';
	    connection.disconnect();
	}
    });

	$('#unsubfh').bind('click', function () {
		var unsubscribe = $iq({type: 'set', from: anon_jid, to: 'search.collecta.com', id: 'unsubscribe42'})
				    	.c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
				    		.c('unsubscribe', {node: 'search', jid: anon_jid});
	    connection.send(unsubscribe.tree());
    });

	$('#subasket').bind('click', function () {
		var subscribe = $iq({type: 'set', from: anon_jid, to: 'search.collecta.com', id: 'subscribe42'})
	    	.c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
	    		.c('subscribe', {node: 'search', jid: anon_jid})
			.up().c('options')
					.c('x', {xmlns: 'jabber:x:data', type: 'submit'})
						.c('field', {"var": 'FORM_TYPE', type: 'hidden'})
							.c('value').t('http://jabber.org/protocol/pubsub#subscribe_options')
	    				.up().up().c('field', {"var": 'x-collecta#apikey'})
							.c('value').t(Config.API_KEY)
						.up().up().c('field', {"var": 'x-collecta#query'})
							.c('value').t('basketball');

	    console.log("creating subscription: "+subscribe);
	    connection.send(subscribe.tree());
    });

	$('#subsoccer').bind('click', function () {
		var subscribe = $iq({type: 'set', from: anon_jid, to: 'search.collecta.com', id: 'subscribe42'})
	    	.c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
	    		.c('subscribe', {node: 'search', jid: anon_jid})
			.up().c('options')
					.c('x', {xmlns: 'jabber:x:data', type: 'submit'})
						.c('field', {"var": 'FORM_TYPE', type: 'hidden'})
							.c('value').t('http://jabber.org/protocol/pubsub#subscribe_options')
	    				.up().up().c('field', {"var": 'x-collecta#apikey'})
							.c('value').t(Config.API_KEY)
						.up().up().c('field', {"var": 'x-collecta#query'})
							.c('value').t('hockey');

	    console.log("creating subscription: "+subscribe);
	    connection.send(subscribe.tree());
    });

});