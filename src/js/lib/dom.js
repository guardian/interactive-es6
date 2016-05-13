
export function getOffset(el) {
    return el ? el.offsetTop + getOffset(el.offsetParent) : 0;
}