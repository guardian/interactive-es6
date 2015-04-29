import reqwest from 'reqwest'
import tmplMain from './text/main.html!text'
import swig from 'swig'
import qwery from 'qwery'
import bean from 'fat/bean'
import bowser from 'ded/bowser'
import { Seatstack } from './components/seatstack'
import { Ticker } from './components/ticker'
import { UKCartogram } from './components/cartogram'
import { renderCartogram } from './components/cartogram'
import { Dropdown } from './components/dropdown'
import { Details } from './components/details'
import { Legend } from './components/legend'


function isResult(c) { return c['2015'].status === 'result'; }
function isMarginalConstituency(c) {
	return c['2015'].percentageMajority < 3;
}

function isBigSwingWin(c) {
	var e = c['2015'];
	return e.winningParty !== e.sittingParty && e.swing > 30;
}

function isImportantConstituency(c) {
	return isBigSwingWin(c) || isMarginalConstituency(c);
}
	
function isMobile() {
	return bowser.mobile;
}
      
function removeClass(el, className) {
	if (el.classList) el.classList.remove(className);
	else el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}

class ElectionResults {
	constructor(el, dataUrl) {
		this.el = el;
		this.dataUrl = dataUrl;
		this.createComponents();
		this.createLatestFilter();
		this.initEventHandlers();
		window.setInterval(this.fetchDataAndRender.bind(this), 5000);
		this.fetchDataAndRender();

		removeClass(this.el.querySelector('.veri'), 'veri--loading')
	}

	createComponents() {
		var el = this.el;
		this.cartogramEl = el.querySelector('#ukcartogram')

		var dropdownOpts = {
			onSelect: isMobile() ? this.focusConstituency.bind(this) : this.selectConstituency.bind(this),
			onFocus: isMobile() ? () => false : this.focusConstituency.bind(this),
			onKeyDown: evt => evt.keyCode === 27 && this.deselectConstituency()
		}

		var cartogramOpts = {
			selectCallback: this.selectConstituency.bind(this), 
			tooltipCallback: this.cartogramTooltipClick.bind(this), 
			mouseBindings: !isMobile(),
			bigTooltips: true
		}

		this.components = {
			details: new Details(el.querySelector('#constituency-details')),
			cartogram: new UKCartogram(this.cartogramEl, cartogramOpts),
			dropdown1: new Dropdown(el.querySelector('#dropdown1'), dropdownOpts),
			dropdown2: new Dropdown(el.querySelector('#dropdown2'), dropdownOpts),
			seatstack: new Seatstack(el.querySelector('#seatstack'), this.hoverConstituency.bind(this)),
			ticker: new Ticker(el.querySelector('#ticker'), this.selectConstituency.bind(this), this.focusEvent.bind(this))
		};

		this.dataPreprocessing = {
			ticker: data => this.getFilteredTickerData(data)
		}


		var parties = ['Lab', 'SNP', 'Green', 'Others', 'Ukip', 'LD', 'Con', 'DUP', 'SF', 'SDLP'];
		var legend = new Legend(this.el.querySelector('#legend1'), parties);

	}

	renderComponent(componentName, data) {
		var dataFn = this.dataPreprocessing[componentName] || ((d) => d)
		this.components[componentName].render(dataFn(data));
	}

	getLatestFilterValue() {
		return this.el.querySelector('#latest-filter [name="latest-filter"]:checked').getAttribute('value');
	}

	getFilteredTickerData(data, filter) {
		var data = data || this.lastFetchedData;
		var filter = filter || this.getLatestFilterValue();
		var filterFn = this.tickerFilters[filter];
		return filterFn ? filterFn(data) : data.overview.latestInteresting.slice(0,5);
	}

	createLatestFilter() {
		var self = this;
		var sortConstituency = (c1,c2) => c1['2015'].updated > c2['2015'].updated ? -1 : 1;

		this.tickerFilters = {
			important: data => data.constituencies
								.filter(isResult)
								.filter(isImportantConstituency)
								.sort(sortConstituency).slice(0,5),
			all: data => data.constituencies
								.filter(isResult)
								.sort(sortConstituency).slice(0,5),
			marginals: data => data.constituencies
								.filter(isResult)
								.filter(isMarginalConstituency)
								.sort(sortConstituency)
								.slice(0, 5),
			swings: data => data.constituencies
								.filter(isResult)
								.filter(isBigSwingWin)
								.sort(sortConstituency)
								.slice(0, 5)
		}

		var listEl = this.el.querySelector('#latest-filter');
		Object.keys(this.tickerFilters).forEach(function(val) {
			var elementId = 'latest-filter--' + val;
			var li = document.createElement('li');
			var checked = val === 'important' ? 'checked' : '';
			li.innerHTML = `<input id="${elementId}" type="radio" ${checked} name="latest-filter" value="${val}">` + 
					 `<label for="${elementId}">${val}</label>`;
			listEl.appendChild(li);

			li.querySelector('[name="latest-filter"]').addEventListener('change', function(val) {
				self.renderComponent('ticker', self.lastFetchedData);
			})
			li.querySelector('label').addEventListener('mouseover', function(evt) {
				var filter = evt.target.textContent;
				var latestIds = self.getFilteredTickerData(self.lastFetchedData, filter).map(e => e.ons_id)
				self.components.cartogram.setLatest(latestIds);
			})
		});
	}

	timeFilterAndRender(time) {
	}

	deselectConstituency() {
		this.components.cartogram.resetZoom();
		this.components.details.hide();
	}

	selectConstituency(constituencyId) {		
		if (!isMobile()) {
			this.components.cartogram.zoomToConstituency(constituencyId);
			this.components.details.selectConstituency(constituencyId);
		} else {
			this.focusConstituency(constituencyId);
		}
	}

	cartogramTooltipClick(constituencyId) {
		this.components.details.selectConstituency(constituencyId);
	}

	hoverConstituency(constituencyId) {		
		if (!isMobile() && constituencyId) this.cartogramEl.setAttribute('party-highlight', constituencyId);
		else this.cartogramEl.removeAttribute('party-highlight')
	}

	focusConstituency(constituencyId) {
		if (!constituencyId) return this.blurConstituency();
		this.cartogramEl.setAttribute('focus-constituency', '')
		this.components.cartogram.focusConstituency(constituencyId);
	}

	blurConstituency() {
		this.cartogramEl.removeAttribute('focus-constituency')
		if (this.components) this.components.cartogram.blurConstituency();
	}

	focusEvent(event) {
		if (event) this.focusConstituency(event.id);
		else this.blurConstituency()
	}

	initEventHandlers() {

		var latestResults = this.el.querySelector('.veri__latest-results')
		if (!isMobile()) latestResults.addEventListener('mouseover', () => this.cartogramEl.setAttribute('latest-results', '') )
		latestResults.addEventListener('mouseout', () => this.cartogramEl.removeAttribute('latest-results') )

		bean.on(this.components.details.el, 'click', '.veri__close-details', function() {
			this.components.details.hide();
			this.components.cartogram.resetZoom();
			if (!isMobile()) this.blurConstituency();
		}.bind(this));

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
		Object.keys(this.components)
			.forEach(key => this.renderComponent(key, data))
	}
}

function init(el, context, config, mediator) {		

	var dataUrl = 'mega.json';
	// var dataUrl = 'http://s3.amazonaws.com/gdn-cdn/2015/05/election/datatest/liveresults.json';

	el.innerHTML = swig.render(tmplMain);

	var standfirst = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vestibulum ante suscipit finibus volutpat. Vivamus magna odio, aliquet mollis posuere in, eleifend eu felis. Curabitur pellentesque lacus sit amet lorem gravida, id aliquet lorem ultricies. Aliquam rhoncus vestibulum sapien in iaculis."
	el.querySelector('#content-meta').innerHTML = `<h1>Live election results</h1><p>${standfirst}</p>`

	window.setTimeout(() => new ElectionResults(el, dataUrl), 1);
}

define(function() { return {init: init}; });
