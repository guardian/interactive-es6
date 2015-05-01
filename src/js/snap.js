import reqwest from 'reqwest'
import { Seatstack } from './components/seatstack';

class ElectionSnap {
    constructor(el, dataUrl) {
        this.el = el;
        this.dataUrl = dataUrl;
        this.seatstack = new Seatstack(el.querySelector('#seatstack'), () => null);

        window.setInterval(this.fetchDataAndRender.bind(this), 5000);
        this.fetchDataAndRender();
    }

    fetchDataAndRender() {
        reqwest({
            url: this.dataUrl,
            type: 'json',
            crossOrigin: true,
            success: function(resp) {
                this.lastFetchedData = resp;
                this.seatstack.render(resp);
            }.bind(this)
        });
    }
}

function init() {
    var dataUrl = 'mega.json';
    // var dataUrl = 'http://s3.amazonaws.com/gdn-cdn/2015/05/election/datatest/liveresults.json';

    window.setTimeout(() => new ElectionSnap(document.body, dataUrl), 1);
}

init();
