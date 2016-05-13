import {requestAnimFrame, cancelAnimFrame} from './raf.js'
import iframeMessenger from 'guardian/iframe-messenger'
import {getOffset} from './dom.js'

const interval = 15;//, total = 300;


var currentFrame = null;


let iframed = (function() {
    try { return window.self !== window.top; }
    catch (e) { return true; }
})();

function _scrollTo(x, y) {
    if (!iframed) window.scrollTo(x,y);
    else iframeMessenger.scrollTo(x,y);
}

function _getPositionInfo(cb) {
    if (!iframed) cb({innerHeight: window.innerHeight, pageYOffset: window.pageYOffset, offset: 0});
    else iframeMessenger.getPositionInformation(info => cb({innerHeight: info.innerHeight, pageYOffset: info.pageYOffset, offset: info.offset}));
}

export function scrollTo(el, offset, cb) {

    _getPositionInfo(function(info) {
        var start = info.pageYOffset;
        var end = getOffset(el) + 1 + info.offset + (offset || 0);
        var distance = end - start;
        var total = Math.floor(Math.abs(distance) / 6 / interval) * interval;
        var elapsed = 0;

        if (!distance || !total) {
            _scrollTo(0, end);
            if (cb) cb();
            return;
        }

        if (currentFrame) cancelAnimFrame(currentFrame);

        currentFrame = requestAnimFrame(function scrollHandler() {
            var t = elapsed / total;
            _scrollTo(0, Math.floor(start + distance * t * (2 - t)));
            if (elapsed < total) {
                elapsed += interval;
                currentFrame = requestAnimFrame(scrollHandler);
            } else {
                currentFrame = null;
                if (cb) cb();
            }
        });
    })
};

export function ensureVisible(el, maxOffset=20) {
    _getPositionInfo(info => {
        let thisoffset = info.pageYOffset - info.offset;
        let eloffset = getOffset(el);
        let elScreenOffset = eloffset - thisoffset;
        let elHeight = el.getBoundingClientRect().height;
        let offTop = elScreenOffset < 0;
        let offBottom = elScreenOffset + el.getBoundingClientRect().height > info.innerHeight;
        let elBiggerThanScreen = elHeight > info.innerHeight;

        if (offTop || (offBottom && elBiggerThanScreen)) {
            let scrollY = info.pageYOffset + elScreenOffset - (!elBiggerThanScreen ? maxOffset : 0);
            _scrollTo(0, scrollY);
        } else if (offBottom) {
            let scrollY = info.pageYOffset + elScreenOffset + elHeight - info.innerHeight + 20;
            _scrollTo(0, scrollY);
        }
    })
}