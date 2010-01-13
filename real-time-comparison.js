var connection = null, anonymous_jid = null, terms;

if(!window.console) {
  window.console = new function() {
    this.log = function(str) {};
    this.dir = function(str) {};
  };
}

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
		var termIndex, category, title, description, url, published, result = [];
		if (item.find('headers > header:first').text() == terms[0]) {
			termIndex = 0;
		} else {
			termIndex = 1;
		}
		
		item.find('items > item').each(function() {
			category = $(this).find('entry > category:first').text();
			title = $(this).find('entry > title:first').text();
			description = $(this).find('entry > abstract:first').text();
			published = $(this).find('entry > published').text();
			
			if (category == "update") {
				url = $(this).find('entry > id:first').text();
			} else if (category == "photo" || category == "video") {
				url = $(this).find('entry > link[type="text/html"]:first').attr("href");
			} else {
				url = $(this).find('entry > link:first').attr('href');
			}
			
			result.push({
				term: termIndex,
				category: category,
				title: title,
				description: description,
				url: url,
				published: published
			});
		});

		return result;
	}
};

function startComparison() {
	console.log("Subscribing to nodes: "+ terms[0] +" and "+ terms[1]);
	connection.send(Collecta.subscribeSearchStanza(terms[0]).tree());
	connection.send(Collecta.subscribeSearchStanza(terms[1]).tree());
}

// ********* XMPP Callbacks *********

function onConnect(status)
{
    if (status == Strophe.Status.CONNECTING) {
		console.log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
		console.log('Strophe failed to connect.');
		$('#go').get(0).value = 'go';
    } else if (status == Strophe.Status.DISCONNECTING) {
		console.log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
		console.log('Strophe is disconnected.');
		$('#go').get(0).value = 'go';
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
    var result = Collecta.processItem($(msg));
	for (var i=0; i < result.length; i++) {
		$('#term'+ result[i].term +"panel")
			.prepend("<p>["+result[i].category+"] - <a href=\""+result[i].url+"\" target=\"_blank\" title=\" Access "+terms[result[i].term]+" information\">"+result[i].title+"</a><br />..."+result[i].description+"...<br />Published in "+result[i].published+"</p>");
	};
	return true;
}

// ******** Initialize ********

$(document).ready(function () {
	$('#go').attr('disabled','disabled');
    connection = new Strophe.Connection(Config.BOSH_SERVICE);
	connection.connect(Config.HOST, null, onConnect);

    $('#go').bind('click', function () {
		var button = $('#go').get(0);
		if (button.value == 'go') {
		    button.value = 'stop';
			$('#term0panel').empty();
			$('#term1panel').empty();
			terms = [];
			terms.push($('#term0').val());
			terms.push($('#term1').val());
		    startComparison();
		} else {
		    button.value = 'go';
			console.log("Unsubscribing...");
			connection.send(Collecta.unsubscribeStanza().tree());
		}
    });
});