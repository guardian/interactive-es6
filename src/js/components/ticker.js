import template from './templates/ticker.html!text'
import swig from 'swig'
import { relativeDates } from '../lib/relativedate'

const templateFn = swig.compile(template)

function data2context(data) {
	var i = 0;
	return data.overview.latestInteresting.slice(0,5)
		.map(function(entry){
			entry.verb = entry.winningParty === entry.sittingParty ? 'holds' : 'wins';
			entry.how = entry.swing < 30 ? `by ${entry.majority} votes` : `with a ${entry.swing}% swing`;
			entry.updated = new Date(new Date() - (1000*60*i++)).toISOString();
			return entry;
		})
}

export class Ticker {
	constructor(el, onHover) {
		this.el = el;
		this.onHover = onHover;
	}
	render(data) {
		this.el.innerHTML = '<ul class="veri__ticker">'
		var listEl = this.el.querySelector('.veri__ticker')
		data2context(data).forEach(entry => listEl.appendChild(this.createTickerEntryElement(entry)))
		relativeDates(this.el);
	}
	createTickerEntryElement(entry) {
		var tmp = document.implementation.createHTMLDocument();
		tmp.body.innerHTML = templateFn({entry: entry});
		var el = tmp.body.children[0]
		el.addEventListener('mouseenter', () => this.onHover(entry))
		el.addEventListener('mouseleave', () => this.onHover(null))
		return el;
	}
}
