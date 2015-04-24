import hexagonsTopo from '../carto/data/hexagons-topo.json!json'
import regionsTopo from '../carto/data/regions-topo.json!json'
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
    constructor(el, selectConstituencyCallback) {
        window.c = this;
        this.el = el;
        this.svg = d3.select(el).append("svg");
        this.map = this.svg.append('g');
        this.selectConstituencyCallback = selectConstituencyCallback;

        this.el.style.height = parseInt(window.innerHeight * 0.9, 10) + 'px';

        this.resetZoom();
        this.renderHex();
        this.renderRegions();
        this.project();
        this.initButtons();
        this.initEventHandling();

        var self = this;
        window.foo = (t,s) => self.setTransform(t,s)
        window.bar = () => self.initProjection()
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
            .precision(.1);
        if (!this.path) this.path = d3.geo.path();
        this.path.projection(this.projection)
    }

    renderTooltip(constituencyId) {
        if (!this.tooltip) {
            var tooltip = '<div class="cartogram__tooltip"></div>';
            this.el.insertAdjacentHTML('beforeend', tooltip);
            this.tooltip = this.el.querySelector('.cartogram__tooltip');
        }
        
        if (!this.constituenciesById) return; // no data yet

        var c = this.constituenciesById[constituencyId];
        var msg = c['2015'].winningParty ? 
            `<strong>${c['2015'].winningParty}</strong> wins` :
            'Result pending';

        this.tooltip.innerHTML = 
            `<h4>${c.name}</h4><p>${msg}</p>` +
            '<span class="cartogram__tooltip__tap2expand">Tap here to select</span>';

        var rect = this.tooltip.getBoundingClientRect();
        var centroid = this.hexCentroids[constituencyId];
        var coords = this.mapCoordsToScreenCoords(centroid);
        this.tooltip.style.visibility = 'visible';
        var leftHandSide = coords[0] > (this.elDimensions.width / 2);
        this.tooltip.style.left = (leftHandSide ? coords[0]-rect.width : coords[0]) +'px';
        this.tooltip.style.top = (coords[1] - (rect.height / 2)) + 'px';
        this.tooltip.className = 'cartogram__tooltip' + (leftHandSide ? ' cartogram__tooltip--left' : '');
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.style.visibility = '';
    }

    renderHex() {
        this.hexFeatures = topojson.feature(hexagonsTopo, hexagonsTopo.objects.hexagons).features
        this.hexGroup = this.map.append('g').attr('class', 'cartogram__hexgroup')
        this.hexPaths = this.hexGroup
            .selectAll("path")
            .data(this.hexFeatures)
            .enter().append("path")
            // .attr("d", this.path)

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
        var resetButton = '<div class="cartogram__reset-zoom">Reset zoom</div>';
        controls.innerHTML = resetButton;
        this.el.appendChild(controls)

        controls.querySelector('.cartogram__reset-zoom')
            .addEventListener('click', this.resetZoom.bind(this));
    }

    initEventHandling() {
        var self = this;

        this.svg.on('mousemove',function(){
                var coords = d3.mouse(this);
                var mouseConstituency = self.coordsToClosestConstituency(coords);
                self.focusConstituency(mouseConstituency);
        })

        this.svg.on('mouseout', () => this.blurConstituency())
        this.svg.on('mouseleave', () => this.hideTooltip())

        this.svg.on("mousedown",function(){
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
        this.focusedConstituency = constituencyId;
        if (!constituencyId) return this.blurConstituency();

        this.hexPaths
            .classed('cartogram__hex--focus', false )
            .filter(d => d.properties.constituency === constituencyId)
            .classed('cartogram__hex--focus', true)
            .moveToFront()

        this.renderTooltip(constituencyId);
    }

    blurConstituency() {
        this.focusedConstituency = null;
        this.hexPaths.classed('cartogram__hex--focus', false)
        this.hideTooltip();
    }

    selectConstituency(constituencyId) {
        this.zoomToConstituency(constituencyId);
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

        var latestIds = data.overview.latestInteresting.map(e => e.id)
        this.hexPaths
            .filter(d => latestIds.indexOf(d.properties.constituency) !== -1)
            .classed('cartogram__hex--latest', true);

        var alternate = 0;
        this.hexPaths
            .filter(d => !constituenciesById[d.properties.constituency]['2015'].winningParty)
            .style("fill", () => (alternate++ % 2) ? this.texture.url() : this.texture2.url())
    }
}
