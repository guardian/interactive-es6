import moment from 'moment'
import qwery from 'qwery'

export function relativeDate(el) {
	el.textContent = moment(el.getAttribute('datetime')).fromNow();
}

export function relativeDates(el) {
	qwery('.veri__relative-date', el).forEach(relativeDate)
}
