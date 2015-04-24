import reqwest from 'reqwest'
import tmplMain from './text/main.html!text'
import swig from 'swig'
import qwery from 'qwery'
import { Seatstack } from './components/seatstack'
import { Ticker } from './components/ticker'
import { UKCartogram } from './components/cartogram'
import { renderCartogram } from './components/cartogram'
import { Dropdown } from './components/dropdown'
import { Details } from './components/details'


class ElectionResults {
	constructor(el, dataUrl) {
		this.el = el;
		this.dataUrl = dataUrl;
		this.createComponents();
		this.initEventHandlers();
		// window.setInterval(this.fetchDataAndRender.bind(this), 10000);
		this.fetchDataAndRender();
	}

	createComponents() {
		var el = this.el;
		this.cartogramEl = el.querySelector('#ukcartogram')

		var dropdownOpts = {
			el: el.querySelector('#dropdown'),
			onSelect: this.selectConstituency.bind(this),
			onFocus: this.focusConstituency.bind(this),
			onKeyDown: evt => evt.keyCode === 27 && this.deselectConstituency()
		}

		this.components = {
			details: new Details(el.querySelector('#constituency-details')),
			cartogram: new UKCartogram(this.cartogramEl, this.selectConstituency.bind(this)),
			dropdown: new Dropdown(dropdownOpts),
			seatstack: new Seatstack(el.querySelector('#seatstack'), this.hoverConstituency.bind(this)),
			ticker: new Ticker(el.querySelector('#ticker'), this.focusEvent.bind(this))
		};
	}

	timeFilterAndRender(time) {
		console.log(time);

	}

	deselectConstituency() {
		console.log('d');
		this.components.cartogram.resetZoom();
		this.components.details.hide();
	}

	selectConstituency(constituencyId) {
		this.components.details.selectConstituency(constituencyId);
		this.components.cartogram.zoomToConstituency(constituencyId);
	}

	hoverConstituency(constituencyId) {
		if (constituencyId) this.cartogramEl.setAttribute('party-highlight', constituencyId);
		else this.cartogramEl.removeAttribute('party-highlight')
	}

	focusConstituency(constituencyId) {
		if (!constituencyId) return this.blurConstituency();
		this.cartogramEl.setAttribute('focus-constituency', '')
		this.components.cartogram.focusConstituency(constituencyId);
	}

	blurConstituency(constituencyId) {
		this.cartogramEl.removeAttribute('focus-constituency')
		if (this.components) this.components.cartogram.blurConstituency();
	}

	focusEvent(event) {
		if (event) this.focusConstituency(event.id);
		else this.blurConstituency()
	}

	initEventHandlers() {
		this.components.ticker.el.addEventListener('click', function(evt) {
			var id = evt.target.getAttribute('constituency-link');
			if (id) {
				this.selectConstituency(id);
				evt.preventDefault();
				evt.stopPropagation();
			}
		}.bind(this));

		var latestResults = this.el.querySelector('.veri__latest-results')
		latestResults.addEventListener('mouseover', () => this.cartogramEl.setAttribute('latest-results', '') )
		latestResults.addEventListener('mouseout', () => this.cartogramEl.removeAttribute('latest-results') )

	}

	fetchDataAndRender() {
		reqwest({
		    url: this.dataUrl,
		    type: 'json',
		    crossOrigin: true,
		    success: function(resp) {
		    	this.lastFetchedData = resp;
		    	this.renderDataComponents(resp);
		    }.bind(this)
		});
	}

	renderDataComponents(data) {
		Object.keys(this.components).map(k => this.components[k]).forEach(component => component.render(data))
	}
}

function fetchDataAndRender(url, renderFn) {
}

function initDataComponents(el, url) {
}

function initEvents(el) {
}

function init(el, context, config, mediator) {
		
	el.innerHTML = swig.render(tmplMain);

	// initDataComponents('https://s3.amazonaws.com/gdn-cdn/2015/05/election/datatest/overview.json');
	new ElectionResults(el, 'http://localhost:9000/mega.json');

	// window.setInterval(fillRelativeDates, 1000);

	var standfirst = "Find out who is leading the race in your constituency, according to our latest poll projection. The map shows which party can expect to win each of the 650 seats, which could change hands, and which are the battleground seats with a projected margin of less than 5%. The constituencies are scaled so each seat has the same area."

	document.querySelector('#content-meta').innerHTML = `<h1>Live election results</h1><p>${standfirst}</p>`
	
}

define(function() { return {init: init}; });
