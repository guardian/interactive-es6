import reqwest from 'reqwest';

export function fetchJSON(url) {
	let shouldBeHTTPS = document.location.protocol !== 'http:'

	let fixedUrl = url.replace(/^https?:/, shouldBeHTTPS ? 'https:' : 'http:')

	return reqwest({
		url: fixedUrl,
		type: 'json', contentType: 'application/json', crossOrigin: true
	});
}
