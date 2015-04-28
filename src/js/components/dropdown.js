import reqwest from 'reqwest'
import initEdd from '../lib/edd'

var constituencies, renderDropdown;
var s3prefix = 'http://interactive.guim.co.uk/2015/general-election/postcodes/';

function isPostcode(val) { return /[0-9]/.test(val); }

export class Dropdown {
    constructor(el, opts) {
        this.constituenciesById = {};
        initEdd({
            el: el,
            onChange: this.onChange.bind(this),
            onSelect: opts.onSelect,
            onFocus: opts.onFocus, 
            onKeyDown: opts.onKeyDown,
            placeholder: "Enter constituency or postcode"
        })
    }

    onChange(newVal, renderCallback) {
        window.clearTimeout(this.fetchTimeout);

        // EMPTY
        if (newVal.length < 3) { 
            renderCallback([]);             
        }
        else if (newVal === '') { 
            renderCallback([]);
        }
        // POSTCODE
        else if (isPostcode(newVal)) { 

            if(newVal.length < 5) {
                renderCallback([[null, 'It looks like a postcode, go on...']]);
                return;
            }

            renderCallback([[null, 'Searching for postcode...']]);
            this.fetchTimeout = window.setTimeout(function() {
                reqwest({url: s3prefix + newVal.replace(/\s+/, '').toUpperCase(), crossOrigin: true})
                    .then(function(resp) {
                        var c = this.constituenciesById[resp];
                        renderCallback([[c.ons_id, c.name]])
                    }.bind(this))
                    .fail(function(resp) {
                        if (resp.status === 404) { renderCallback([[null, 'Postcode not found']]); }
                    })
            }.bind(this), 500);
        } 
        // CONSTITUENCY NAME
        else { 
            var matches = this.findConstituenciesByName(newVal);
            var ret = matches.map(function(c) {
                var boldedName = c.name.replace(new RegExp('('+newVal+')', 'i'), '<strong>$1</strong>');
                return [c.ons_id, boldedName];
            })
            renderCallback(ret.slice(0,10));
        }
    }

    findConstituenciesByName(partialName) {
        var re = new RegExp(partialName, 'i');
        return this.constituencies
            .filter(function(c) {
                return re.test(c.name);
            })
    }

    render(data) {
        this.data = data;
        this.constituencies = data.constituencies;
        this.constituenciesById = {};
        data.constituencies.forEach( (c) => this.constituenciesById[c.ons_id] = c )
    }
}
