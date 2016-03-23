export default function sheetURL(sheetID, type='docsdata') {
    var protocol = window.location.protocol === 'file:' ? 'https://' : '//';
    return `${protocol}interactive.guim.co.uk/${type}/${sheetID}.json`;
}
