import iframeMessenger from 'guardian/iframe-messenger'
import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'

function init(el, context, config, mediator) {
    iframeMessenger.enableAutoResize();

    el.innerHTML = mainHTML

	reqwest({
	    url: 'http://ip.jsontest.com/',
	    type: 'json',
	    crossOrigin: true,
	    success: (resp) => el.querySelector('.test-msg').innerHTML = `Your IP address is ${resp.ip}`
	});
}

(window.define || System.amdDefine)(function() { return {init: init}; });
