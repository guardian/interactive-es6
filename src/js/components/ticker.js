import template from './templates/ticker.html!text'
import swig from 'swig'
import { relativeDates } from '../lib/relativedate'

const templateFn = swig.compile(template)

// function processEvents(events) {
// 	var i = 0;
// 	return events
// 		.map(function(entry){
// 			entry.verb = entry.winningParty === entry.sittingParty ? 'holds' : 'wins';
// 			entry.how = entry.swing < 30 ? `by ${entry.majority} votes` : `with a ${entry.swing}% swing`;
// 			entry.updated = new Date(new Date() - (1000*60*i++)).toISOString();
// 			return entry;
// 		})
// }
function processEvents(constituency) {
	var i = 0;
	return constituency
		.map(function(constituency){
			var e = constituency['2015']
			return {
				id: constituency.ons_id,
				name: constituency.name,
				winningParty: e.winningParty,
				sittingParty: e.sittingParty,
				swing: e.swing,
				percentageMajority: e.percentageMajority,
				verb: e.winningParty === e.sittingParty ? 'holds' : 'wins',
				how: e.swing < 30 ? `with a ${e.percentageMajority}% majority` : `with a ${e.swing}% swing`,
				updated: e.updated
				// updated: new Date(new Date() - (1000*60*i++)).toISOString()
			};
		})
}

export class Ticker {
	constructor(el, onClick, onHover) {
		this.el = el;
		this.onHover = onHover;
		this.onClick = onClick;
	}

	render(events) {
		this.el.innerHTML = '<ul class="veri__ticker">'
		var listEl = this.el.querySelector('.veri__ticker')
		processEvents(events).forEach(entry => listEl.appendChild(this.createTickerEntryElement(entry)))
		relativeDates(this.el);
	}

	createTickerEntryElement(entry) {
		var tmp = document.implementation.createHTMLDocument();
		tmp.body.innerHTML = templateFn({entry: entry});
		var el = tmp.body.children[0]
		el.addEventListener('mouseenter', () => this.onHover(entry))
		el.addEventListener('mouseleave', () => this.onHover(null))
		el.addEventListener('click', () => this.onClick(entry.id))
		return el;
	}
}
