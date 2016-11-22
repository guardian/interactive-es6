import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'
import share from './lib/share'
import { pimpYouTubePlayer, getYouTubeVideoDuration } from './lib/youtube'

var shareFn = share('Interactive title', 'http://gu.com/p/URL', '#Interactive');


export function init(el, context, config, mediator) {
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
    
pimpYouTubePlayer('-Gy7poRbUHY', 'ytGuPlayer', '390', '640');
getYouTubeVideoDuration('-Gy7poRbUHY');
}
