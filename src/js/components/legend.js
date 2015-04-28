import template from './templates/legend.html!text'
import swig from 'swig'
const templateFn = swig.compile(template)

export class Legend {
	constructor(el, parties) {
		this.el = el;
		this.el.innerHTML = templateFn({ parties: parties})
	}	
}
