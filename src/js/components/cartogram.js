import hexagonsTopo from '../data/hexagons-topo.json!json'
import regionsTopo from '../data/regions-topo.json!json'
import topojson from 'mbostock/topojson'
import d3 from 'd3'
import textures from 'riccardoscalco/textures'

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

var getDist = (x1,y1,x2,y2) => Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));

export class UKCartogram {
    constructor(el, opts) {


        this.initOptions(opts);
        this.el = el;
        this.svg = d3.select(el).append("svg");
        this.map = this.svg.append('g');
        this.selectConstituencyCallback = this.opts.selectCallback;

        this.el.style.height = parseInt(window.innerHeight * 0.9, 10) + 'px';

        this.resetZoom();
        this.renderHex();
        this.renderRegions();
        this.focusHexGroup = this.map.append('g')
        this.project();
        this.initButtons();
        this.initEventHandling();

        var self = this;
        window.foo = (t,s) => self.setTransform(t,s)
        window.bar = () => self.initProjection()
    }

    initOptions(opts) {
        var defaultOpts = {
            mouseBindings: true,
            selectCallback: () => false, // no-op
            tooltipCallback: () => false // no-op
        }

        this.opts = {}
        Object.keys(defaultOpts).forEach(k => this.opts[k] = opts[k] !== undefined ? opts[k] : defaultOpts[k])
    }

    project() { // do projections separately so we can rerender
        var self = this;
        this.initProjection();
        this.map.selectAll("path").attr("d", this.path)
        this.regionGroup.selectAll("circle")
            .attr("cx", d => self.projection(d.geometry.coordinates)[0] )
            .attr("cy", d => self.projection(d.geometry.coordinates)[1] )
        this.regionGroup.selectAll('text')
            .attr("x", d => self.projection(d.geometry.coordinates)[0] )
            .attr("y", d => self.projection(d.geometry.coordinates)[1] )
        this.hexCentroids = {}
        this.hexPaths.each(d => this.hexCentroids[d.properties.constituency] = this.path.centroid(d));
    }

    initProjection() {
        var elDimensions = this.elDimensions;
        var scale = 2000 * (elDimensions.width / 180)
        this.projection = d3.geo.transverseMercator()
            .scale(Math.min(scale, 6500))
            .translate([elDimensions.width / 2, elDimensions.height / 2])
            .center([0, 54.1])
            .rotate([2,0])  
            .precision(10.0);
        if (!this.path) this.path = d3.geo.path();
        this.path.projection(this.projection)
    }

    renderTooltip(constituencyId) {
        this.tooltipConstituency = constituencyId;
        if (!this.tooltip) {
            var tooltip = '<div class="cartogram__tooltip"></div>';
            this.el.insertAdjacentHTML('beforeend', tooltip);
            this.tooltip = this.el.querySelector('.cartogram__tooltip');
            this.tooltip.addEventListener('click', (evt) => this.opts.tooltipCallback(this.tooltipConstituency))
        }
        
        if (!this.constituenciesById) return; // no data yet

        var c = this.constituenciesById[constituencyId];

        var msg;
        if (c['2015'].winningParty) {
            var partyName = (party) => 
                `<span class="veri__blip veri__blip--${party.toLowerCase()}"></span>` +
                `<strong>${party}</strong>`

            var e = c['2015']

            var verb = e.winningParty === e.sittingParty ? 'holds' : 'gains';
            var fromParty = verb === 'gains' ? ` from ${partyName(e.sittingParty)}` : '';
            var how = e.percentageMajority ? `with a ${e.percentageMajority}% majority` : '';

            msg = `<p>${partyName(e.winningParty)} ${verb}${fromParty} ${how}</p>`
        } else {
            msg = '<p>Result pending</p>'
        }

        this.tooltip.innerHTML = 
            '<span class="cartogram__tooltip__spout"></span>' +
            `<h4>${c.name}</h4>${msg}` +
            '<span class="cartogram__tooltip__tap2expand"></span>';

        var rect = this.tooltip.getBoundingClientRect();
        var centroid = this.hexCentroids[constituencyId];
        var coords = this.mapCoordsToScreenCoords(centroid);
        this.tooltip.style.visibility = 'visible';
        
        var elDimensions = this.elDimensions;
        var topSide = coords[1] > (elDimensions.height / 2);
        this.tooltip.style.top = (topSide ? coords[1]-rect.height : coords[1]) + 'px';
        var desiredLeft = (coords[0] - (rect.width / 2));
        var maxLeft = elDimensions.width - rect.width;
        var minLeft = 0;
        var actualLeft = Math.max(minLeft, Math.min(desiredLeft, maxLeft));
        this.tooltip.style.left = actualLeft + 'px';

        var spoutOffset = Math.min(rect.width - 12, coords[0] - actualLeft);
        this.tooltip.querySelector('.cartogram__tooltip__spout').style.left = spoutOffset + 'px';
        this.tooltip.className = 'cartogram__tooltip' + (topSide ? ' cartogram__tooltip--above' : ' cartogram__tooltip--below');
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.style.visibility = '';
    }

    renderHex() {
        this.hexFeatures = topojson.feature(hexagonsTopo, hexagonsTopo.objects.hexagons).features
        this.hexGroup = this.map.append('g').attr('class', 'cartogram__hexgroup')
        this.hexPaths = this.hexGroup.selectAll("path")
                                .data(this.hexFeatures)
        // window.setTimeout(function() {
            this.hexPaths
                .enter().append("path")
                .attr("d", this.path)
            if (this.lastRenderedData) this.render(this.lastRenderedData);

        // }.bind(this), 300)

        // this.hexCentroids = {}
        // this.hexPaths.each(d => this.hexCentroids[d.properties.constituency] = this.path.centroid(d));
    }

    renderRegions() {
        var self = this;
        this.regionFeatures = topojson.feature(regionsTopo, regionsTopo.objects.regions).features
        this.regionFeaturesCities = this.regionFeatures.filter(d => d.geometry.type === "Point" && !d.properties.abbr);
        this.regionFeaturesRegions = this.regionFeatures.filter(d => d.geometry.type === "Point" && d.properties.abbr);
        this.regionGroup = this.map.append('g').attr('class', 'cartogram__regiongroup')

        // render region boundaries
        this.regionGroup.selectAll("path")
            .data(this.regionFeatures.filter(d => d.geometry.type !== "Point")).enter()
            .append('path')
                // .attr("d", this.path);

        // render city points
        this.regionGroup.selectAll("circle.city")
            .data(this.regionFeaturesCities).enter()
            .append("circle")
                .attr("class","cartogram__city")
                    // .attr("cx", d => self.projection(d.geometry.coordinates)[0] )
                    // .attr("cy", d => self.projection(d.geometry.coordinates)[1] )
                    .attr("r",2)

        // render region/city labels and dropshadows
        this.renderRegionLabels('text.region', "cartogram__label cartogram__label--below", this.regionFeaturesRegions)
        this.renderRegionLabels('text.region', "cartogram__label", this.regionFeaturesRegions)
        this.renderRegionLabels('text.city', "cartogram__label cartogram__label--city cartogram__label--below", this.regionFeaturesCities)
        this.renderRegionLabels('text.city', "cartogram__label cartogram__label--city", this.regionFeaturesCities)
    }

    renderRegionLabels(type, className, data) {
        this.regionGroup.selectAll(type)
            .data(data).enter()
            .append("text")
                .attr("class",className)
                // .attr("x", d => this.projection(d.geometry.coordinates)[0] )
                // .attr("y", d => this.projection(d.geometry.coordinates)[1] )
                .attr("dy", "-.35em")
                .text(d => d.properties['abbr'] || d.properties.name)
    }

    coordsToClosestConstituency(coords) {
        var mapCoords = this.screenCoordsToMapCoords(coords);
        var sortedByDistance = Object.keys(this.hexCentroids)
            .map( function(cId){ 
                var centroid = this.hexCentroids[cId];
                return [cId, getDist(centroid[0],centroid[1],mapCoords[0],mapCoords[1])];
            }.bind(this))
            .sort(function(a,b) { return a[1] - b[1]; })
        var closest = sortedByDistance[0];
        return closest[1] < 100 ? closest[0] : null;
    }

    screenCoordsToMapCoords(coords) {
        return [0,1].map(i => (coords[i]- this.translate[i]) / this.scale[i])
    }

    mapCoordsToScreenCoords(coords) {
        return [0,1].map(i => (coords[i] * this.scale[i]) + this.translate[i]);
    }

    initButtons() {
        var controls = document.createElement('div');
        var resetButton = '<div class="cartogram__reset-zoom"></div>';
        controls.innerHTML = resetButton;
        this.el.appendChild(controls)

        controls.querySelector('.cartogram__reset-zoom')
            .addEventListener('click', function() { this.resetZoom(); this.selectConstituency(null); }.bind(this) );
    }

    initEventHandling() {
        var self = this;

        if (this.opts.mouseBindings) {
            this.svg.on('mousemove',function(){
                    var coords = d3.mouse(this);
                    var mouseConstituency = self.coordsToClosestConstituency(coords);
                    self.focusConstituency(mouseConstituency);
            })

            this.svg.on('mouseleave', function() { this.blurConstituency(); this.hideTooltip(); }.bind(this))
        }

        this.svg.on("click",function(){
            var coords = d3.mouse(this);
            var constituency = self.coordsToClosestConstituency(coords);
            self.selectConstituency(constituency);
        })

        var lastWidth = this.elDimensions.width;
        var rerenderTimeout;
        window.addEventListener('resize', function(evt) {
            var thisWidth = this.elDimensions.width;
            if (lastWidth != thisWidth) {
                window.clearTimeout(rerenderTimeout);
                rerenderTimeout = window.setTimeout(this.project.bind(this), 500);
            }
        }.bind(this))
    }

    get elDimensions() { return this.el.getBoundingClientRect() }
    get elCenter() { 
        var rect = this.el.getBoundingClientRect();
        return [rect.width/2, rect.height/2];
    }

    focusConstituency(constituencyId) {
        if (this.focusedConstituency === constituencyId) return;

        this.blurConstituency();

        this.focusedConstituency = constituencyId;
        if (!constituencyId) return this.blurConstituency();

        var focusHexGroupEl = this.focusHexGroup[0][0];
        this.hexPaths
            // .classed('cartogram__hex--focus', false )
            .filter(d => d.properties.constituency === constituencyId)
            // .classed('cartogram__hex--focus', true)
            .each(function() { 
                var clone = this.cloneNode();
                clone.setAttribute('class', clone.getAttribute('class') + ' cartogram__hex--focus');
                focusHexGroupEl.appendChild(clone); 
            })

        this.renderTooltip(constituencyId);
    }

    blurConstituency() {
        var focusHexGroupEl = this.focusHexGroup[0][0];
        this.focusedConstituency = null;
        this.hexPaths
            .each(function() { focusHexGroupEl.innerHTML = ''; } )
        this.hideTooltip();
    }

    setLatest(constituencyIds) {
        this.selectedLatestIds = constituencyIds;
        this.hexPaths
            .classed('cartogram__hex--latest', false)
            .filter(d => constituencyIds.indexOf(d.properties.constituency) !== -1)
            .classed('cartogram__hex--latest', true);

    }

    selectConstituency(constituencyId) {
        this.selectConstituencyCallback(constituencyId);
    }

    zoomToConstituency(constituencyId) {
        if (!constituencyId) return this.resetZoom();

        this.el.setAttribute('zoomed', '');

        var centroid = this.hexCentroids[constituencyId];
        var [cx, cy] = this.elCenter;
        var offsetX = (cx - centroid[0]) / 2;
        var offsetY = (cy - centroid[1]) / 2;
        var translateX = (-1 * centroid[0]) + offsetX;
        var translateY = (-1 * centroid[1]) + offsetY;
        this.setTransform([translateX, translateY], [2,2])
        if (this.focusedConstituency) {
            var focused = this.focusedConstituency;
            this.focusedConstituency = null;
            this.hideTooltip();
            window.setTimeout(() => this.focusConstituency(focused), 500);
        }

        this.hexPaths
            .classed('cartogram__hex--selected', false )
            .filter(d => d.properties.constituency === constituencyId)
            .classed('cartogram__hex--selected', true)
            .moveToFront()
    }

    resetZoom() {
        this.el.removeAttribute('zoomed');
        this.setTransform([0,0], [1,1])
        this.hexPaths && this.hexPaths.classed('cartogram__hex--selected', false )

    }

    setTransform(translate, scale) {
        this.translate = translate;
        this.scale = scale;

        this.map.transition()
            .ease(d3.ease('out'))
            .duration(200)
            .attr('transform', `translate(${translate}) scale(${scale})`);
    }

    render(data) {
        var self = this;
        this.lastRenderedData = data;
        var constituenciesById = this.constituenciesById = {};
        data.constituencies.forEach(c => constituenciesById[c.ons_id] = c)

        if (!this.texture) {
            this.texture = textures.lines()
                .size(4)
                .strokeWidth(1)
                .stroke("#aaa")
                .orientation("6/8")
                .background("#e1e1e1")
            this.texture2 = textures.lines()
                .size(4)
                .strokeWidth(1)
                .stroke("#aaa")
                .background("#e1e1e1");
            this.svg.call(this.texture);
            this.svg.call(this.texture2);
        }

        this.hexPaths
            .attr('class', function(d) {
                var constituency = constituenciesById[d.properties.constituency];
                return 'cartogram__hex cartogram__hex--' + (constituency['2015'].winningParty || 'pending').toLowerCase();
            });

        var alternate = 0;
        this.hexPaths
            .each(function(d) {
                var hasResult = constituenciesById[d.properties.constituency]['2015'].winningParty;
                if (hasResult) d3.select(this).style('fill', '');
                else d3.select(this).style('fill', () => (alternate++ % 2) ? self.texture.url() : self.texture2.url());
            });

        if (this.selectedLatestIds) this.setLatest(this.selectedLatestIds);
    }
}
