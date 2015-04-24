export class TimeSlider {
	constructor(el, callback) {
		this.el = el;
		el.innerHTML = '<input class="timeslider" type="range" min="0" max="1000" step="1" />';
		this.input = el.querySelector('.timeslider');

		this.input.addEventListener('input', function() {
			callback(this.getSelectedTime());
		}.bind(this)); // TODO: IE
	}

	getSelectedTime() {
		var fromStart = (this.input.value / 1000) * this.range;
		return new Date(this.startTime + fromStart);
	}

	render(data) {
		this.times = data.constituencies.map(c => c['2015'].updated).filter(t => t).sort();
		this.startTime = Date.parse(this.times[0]);
		this.endTime = Date.parse(this.times[this.times.length-1]);
		this.range = this.endTime - this.startTime;
	}
}
