import reqwest from 'reqwest';

export function fetchJSON(url) {
	let shouldBeHTTPS = document.location.protocol !== 'http:'

	let fixedUrl = shouldBeHTTPS ? url.replace(/^http:/, 'https:') : url;

	return reqwest({
		url: fixedUrl,
		type: 'json', contentType: 'application/json', crossOrigin: true
	});
}
