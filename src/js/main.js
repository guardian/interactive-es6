import iframeMessenger from 'guardian/iframe-messenger'
import reqwest from 'reqwest'
import mainHTML from '../templates/main.html!text'
import share from './lib/share'

var shareFn = share('Interactive title', 'http://gu.com/p/URL', null, null, '#Interactive');

export function init(el, context, config, mediator) {
    iframeMessenger.enableAutoResize();

    el.innerHTML = mainHTML.replace(/%assetPath%/g, config.assetPath);

    reqwest({
        url: 'http://ip.jsontest.com/',
        type: 'json',
        crossOrigin: true,
        success: (resp) => el.querySelector('.test-msg').innerHTML = `Your IP address is ${resp.ip}`
    });

    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });
}
