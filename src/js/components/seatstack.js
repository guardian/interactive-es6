import template from './templates/seatstack.html!text'
import swig from 'swig'
const templateFn = swig.compile(template)

function data2context(data) {

	var partiesByName = {};
	data.overview.parties.forEach(p => partiesByName[p.name] = p)
	var totalSeatsWon = data.overview.parties.map(p => p.seats).reduce((a,b) => a+b)

	var parties = ['Lab', 'SNP', 'Others', 'Pending', 'UKIP', 'LD', 'Con'];
	var selectedPartySeatCount = parties
		.filter(name => name !== 'Others' && name !== 'Pending')
		.map(name => partiesByName[name].seats)
		.reduce((a,b) => a + b)

	var otherParties = data.overview.parties.filter(p => parties.indexOf(p.name) !== -1);

	partiesByName.Others = {
		seats: totalSeatsWon - selectedPartySeatCount,// otherParties.map(p => p.seats).reduce((a,b) => a + b),
		gains: otherParties.map(p => p.gains).reduce((a,b) => a + b),
		losses: otherParties.map(p => p.losses).reduce((a,b) => a + b)
	}
	partiesByName.Pending = { seats: 650 - totalSeatsWon }

	var partyData = parties
		.map(function(name){
			return {
				name: name,
				seats: partiesByName[name].seats,
				net: partiesByName[name].gains - partiesByName[name].losses
			};
		})

	return {
		partyData: partyData,
		resultCount: data.overview.results,
		partyListLeft: partyData.slice(0,3),
		partyListRight: partyData.slice(4)
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

		if (data.overview.results > 500) {
			this.el.className = 'seatstack seatstack--majority-below';
		}
	}
}