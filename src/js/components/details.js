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
		if (constituencyId) {
			this.el.innerHTML = templateFn({
				msgFn: this.generateResultHTML,
				constituency: this.constituenciesById[constituencyId],
				stats: this.generateStats(this.constituenciesById[constituencyId])
			});
		}
		this.el.className = 'veri__details' + (constituencyId ? ' veri__details--show' : '');
	}

	generateResultHTML(constituency) {
		var c = constituency;
        if (c['2015'].winningParty) {
            var partyName = (party) =>
                `<span class="veri__blip veri__blip--${party.toLowerCase()}"></span>` +
                `<strong>${party}</strong>`

            var e = c['2015']

            var verb = e.winningParty === e.sittingParty ? 'holds' : 'gains';
            var fromParty = verb === 'gains' ? ` from ${partyName(e.sittingParty)}` : '';
            var how = e.percentageMajority ? `with a ${e.percentageMajority}% majority` : '';

            return `<p>${partyName(e.winningParty)} ${verb}${fromParty} ${how}</p>`
        } else {
            return '<p>Result pending</p>'
        }
	}

	generateStats(constituency) {
		return {
			Electorate: constituency['2015'].electorate,
			"Turnout (%)": constituency['2015'].percentageTurnout.toFixed(1) + "%",
			"Announced": constituency['2015'].updated
		}
	}

	hide() {
		this.selectedConstituency = null;
		this.el.className = 'veri__details';
	}
}