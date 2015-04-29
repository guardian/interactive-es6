import template from './templates/details.html!text'
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

export class Details {
	constructor(el) {
		this.el = el;
	}
	render(data) {
        var constituenciesById = this.constituenciesById = {};
        data.constituencies.forEach(c => constituenciesById[c.ons_id] = c)
        if (this.selectedConstituency) this.selectConstituency(this.selectedConstituency);
        else this.el.className = 'veri__details';
	}

	selectConstituency(constituencyId) {
		this.selectedConstituency = constituencyId;
		if (constituencyId) this.el.innerHTML = templateFn({constituency: this.constituenciesById[constituencyId]});
		this.el.className = 'veri__details' + (constituencyId ? ' veri__details--show' : '');
	}

	hide() {
		this.el.className = 'veri__details';
	}
}