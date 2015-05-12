import iframeMessenger from 'guardian/iframe-messenger'
import reqwest from 'reqwest'
import head from './text/head.html!text'
import fontTest from './text/fonts.html!text'

function init(el, context, config, mediator) {
    iframeMessenger.enableAutoResize();

	reqwest({
	    url: 'http://ip.jsontest.com/',
	    type: 'json',
	    crossOrigin: true,
	    success: (resp) => el.innerHTML = head + `<div class="ipaddress">Your IP address is: ${resp.ip}</div>` + fontTest
	});
}

define(function() { return {init: init}; });
