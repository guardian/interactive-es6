import template from './templates/seatstack.html!text'
import swig from 'swig'
const templateFn = swig.compile(template)

function data2context(data) {

	var partiesByName = {};
	data.overview.parties.forEach(p => partiesByName[p.name] = p)
	var totalSeatsWon = data.overview.parties.map(p => p.seats).reduce((a,b) => a+b)

	var parties = ['Lab', 'SNP', 'Green', 'Others', 'Pending', 'UKIP', 'LD', 'Con'];
	var selectedPartySeatCount = parties
		.filter(name => name !== 'Others' && name !== 'Pending')
		.map(name => partiesByName[name].seats)
		.reduce((a,b) => a + b )

	partiesByName.Others = { seats: totalSeatsWon - selectedPartySeatCount }
	partiesByName.Pending = { seats: 650 - totalSeatsWon }

	return { 
		seatstack: parties.map(function(name){ 
			return {name: name, seats: partiesByName[name].seats }; 
		})
	};
}

export class Seatstack {
	constructor(el, hoverFn) {
		this.el = el;

		this.el.addEventListener('mouseover', function(evt) {
			var partyName = evt.target.getAttribute('data-partyname')
			if (partyName) hoverFn(partyName.toLowerCase());
		});

		this.el.addEventListener('mouseout', function(evt) {
			hoverFn(null);
		});

	}
	render(data) {
		this.el.innerHTML = templateFn(data2context(data));
	}
}