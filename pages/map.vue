<template>
    <div>
        <b-button
            v-b-toggle.sidebar-menu
            style="
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 1;
                background-color: #4d04af;
            "
            >Menu</b-button
        >
        <b-sidebar id="sidebar-menu" style="z-index: 1">
            <form>
                <label>Search</label>
                <input
                    style="width: 300px"
                    name="address"
                    placeholder="address"
                    autocomplete="shipping address-line1"
                    v-model="form.address"
                />
                <b-row class="my-2">
                    <b-col>
                        <b-button
                            @click="initPolygonDraw()"
                            variant="outline-primary"
                            >Draw Polygon</b-button
                        >
                    </b-col>
                    <b-col>
                        <b-button
                            @click="
                                (mapStyle =
                                    'mapbox://styles/elgerardo/cl8yrf6l1000e15o68btt9hgi'),
                                    map.remove(),
                                    createMap()
                            "
                            variant="info"
                            >Default</b-button
                        >
                    </b-col>
                </b-row>
                <b-row class="my-2">
                    <b-col>
                        <b-button
                            @click="
                                (mapStyle =
                                    'mapbox://styles/soloskilos/cl8ywrz0j000l14mrphfgsifg'),
                                    map.remove(),
                                    createMap()
                            "
                            variant="info"
                            >Satellite</b-button
                        >
                    </b-col>
                    <b-col>
                        <b-button
                            @click="
                                (mapStyle =
                                    'mapbox://styles/soloskilos/cl8s8ldp4000w15phd0pcw50r'),
                                    map.remove(),
                                    createMap()
                            "
                            variant="info"
                            >Default 2</b-button
                        >
                    </b-col>
                </b-row>
                <!--<input
                    name="apartment"
                    placeholder="apartment"
                    autocomplete="shipping address-line2"
                    v-model="form.apartment"
                />
                <input
                    name="city"
                    placeholder="city"
                    autocomplete="shipping address-level2"
                    v-model="form.city"
                />
                <input
                    name="state"
                    placeholder="state"
                    autocomplete="shipping address-level1"
                    v-model="form.state"
                />
                <input
                    name="country"
                    placeholder="country"
                    autocomplete="shipping country"
                    v-model="form.country"
                />-->
            </form>
        </b-sidebar>
        <div id="map" style="width: 100%; height: 100vh"></div>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
    async fetch({ store, route }) {
        await store.dispatch("polygons/find", route.query);
    },

    data() {
        return {
            access_token:
                "pk.eyJ1IjoiZWxnZXJhcmRvIiwiYSI6ImNsOG90NjFtMzFucG0zeWw1YWRheTV5ZmYifQ.87BCgCSXpjLIHkqGsWUW7g",
            mapStyle: "mapbox://styles/elgerardo/cl9d3ovzq000115ubx8rs0flv",
            config: {
                zoom: 17,
            },
            map: {},
            marker: {},
            search: {},
            draw: {},
            popup: {},
            coordinates: {
                lat: 32.710708,
                lng: -117.129671,
            },
            form: {
                address: null,
                apartment: null,
                city: null,
                state: null,
                country: null,
            },
            geojsonArrays: [],
            currentBuildingId: 0,
            currentPolygonId: 0,
            hoveredStateId: null,
        };
    },

    mounted() {
        this.createMap();
    },

    computed: {
        ...mapGetters({
            places: "places/places",
            geojson: "geojson/geojson",
            polygon: "polygons/polygon",
        }),
    },

    methods: {
        createMap() {
            this.initMap();
            this.initMarker();
            this.initSearch();
            this.initHoverBuilding(this.map);
            //first time the page is loaded
            this.getPolygons(this.coordinates, true);
        },

        initMap() {
            this.$mapboxgl.accessToken = this.access_token;
            this.map = new this.$mapboxgl.Map({
                container: "map",
                style: this.mapStyle,
                zoom: this.config.zoom,
                pitch: 45, //inclination
                bearing: -17.6, // rotation
                antialias: true,
                center: [this.coordinates.lng, this.coordinates.lat],
                projection: "globe", // display the map as a 3D globe,
                attributionControl: false,
            });

            this.map.on("click", (e) => {
                this.coordinates.lat = parseFloat(e.lngLat.lat);
                this.coordinates.lng = parseFloat(e.lngLat.lng);
                this.config.zoom = this.map.getZoom();
                this.getAddress();
                this.getPolygons(e.lngLat, true);
            });

            this.map.on("zoom", (e) => {
                this.config.zoom = this.map.getZoom();
            });

            this.map.on("load", () => {
                //this.initHoverPolygon();
            });

            this.popup = new this.$mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
            });

            this.map.on("mouseenter", "sandiego-parcels", (e) => {
                let content = this.map.queryRenderedFeatures(e.point,{
                    layers:["sandiego-parcels"]
                })
                console.log(content);
            });

            this.map.on("mouseenter", "building", (e) => {
                this.popup
                    .setLngLat(e.lngLat)
                    .setHTML("Anything...")
                    .addTo(this.map);

                if (this.currentBuildingId != e.features[0].id) {
                    this.currentBuildingId = e.features[0].id;
                    this.getPolygons(e.lngLat, false);
                }
            });

            this.map.on("mouseleave", "building", () => {
                this.map.getCanvas().style.cursor = "";
                this.popup.remove();
            });
        },

        initHoverPolygon() {
            this.map.addSource("mapbox-streets", {
                type: "vector",
                url: "mapbox://mapbox.mapbox-streets-v8",
                generateId: true,
            });

            this.map.addLayer({
                id: "building-fill",
                type: "fill",
                "source-layer": "building",
                source: "mapbox-streets",
                layout: {},
                paint: {
                    "fill-color": "#aaa",
                    "fill-opacity": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        0,
                        0,
                    ],
                },
            });

            this.map.on("mousemove", "building", (e) => {
                if (e.features.length > 0) {
                    if (this.hoveredStateId !== null) {
                        this.map.setFeatureState(
                            {
                                source: "mapbox-streets",
                                sourceLayer: "building",
                                id: this.hoveredStateId,
                            },
                            { hover: false }
                        );
                    }
                    this.hoveredStateId = e.features[0].id;
                    this.map.setFeatureState(
                        {
                            source: "mapbox-streets",
                            sourceLayer: "building",
                            id: this.hoveredStateId,
                        },
                        { hover: true }
                    );
                }
            });

            this.map.on("mouseleave", "building", () => {
                if (this.hoveredStateId !== null) {
                    this.map.setFeatureState(
                        {
                            source: "mapbox-streets",
                            sourceLayer: "building",
                            id: this.hoveredStateId,
                        },
                        { hover: false }
                    );
                }
                this.hoveredStateId = null;
            });
        },

        initHoverBuilding(map) {
            this.map.on("style.load", function () {
                const layers = map.getStyle().layers;
                const labelLayerId = layers.find(
                    (layer) =>
                        layer.type === "symbol" && layer.layout["text-field"]
                ).id;

                if (map.getSource("composite")) {
                    map.addLayer(
                        {
                            id: "3d-buildings",
                            source: "composite",
                            "source-layer": "building",
                            filter: ["==", "extrude", "true"],
                            type: "fill-extrusion",
                            minzoom: 17,
                            paint: {
                                "fill-extrusion-color": [
                                    "case",
                                    [
                                        "boolean",
                                        ["feature-state", "hover"],
                                        false,
                                    ],
                                    "#aaa",
                                    "#aaa",
                                ],
                                "fill-extrusion-height": [
                                    "case",
                                    [
                                        "boolean",
                                        ["feature-state", "hover"],
                                        false,
                                    ],
                                    ["get", "height"],
                                    0,
                                ],
                                "fill-extrusion-base": [
                                    "case",
                                    [
                                        "boolean",
                                        ["feature-state", "hover"],
                                        false,
                                    ],
                                    ["get", "base_height"],
                                    0,
                                ],
                            },
                        },
                        labelLayerId
                    );
                }

                let fHover;
                map.on("mousemove", (e) => {
                    //157001066
                    var features = map.queryRenderedFeatures(e.point, {
                        layers: ["3d-buildings"],
                    });
                    if (features[0]) {
                        mouseout();
                        mouseover(features[0]);
                    } else {
                        mouseout();
                    }
                });

                map.on("mouseout", function (e) {
                    mouseout();
                });

                function mouseout() {
                    if (!fHover) return;
                    map.getCanvasContainer().style.cursor = "default";
                    map.setFeatureState(
                        {
                            source: fHover.source,
                            sourceLayer: fHover.sourceLayer,
                            id: fHover.id,
                        },
                        {
                            hover: false,
                        }
                    );
                }

                function mouseover(feature) {
                    fHover = feature;

                    map.getCanvasContainer().style.cursor = "pointer";

                    map.setFeatureState(
                        {
                            source: fHover.source,
                            sourceLayer: fHover.sourceLayer,
                            id: fHover.id,
                        },
                        {
                            hover: true,
                        }
                    );
                }
            });
        },

        initMarker() {
            this.marker = new this.$mapboxgl.Marker({
                color: "blue",
                draggable: true,
            })
                .setLngLat([this.coordinates.lng, this.coordinates.lat])
                .addTo(this.map);

            this.marker.on("dragend", (event) => {
                this.coordinates.lng = this.marker.getLngLat().lng;
                this.coordinates.lat = this.marker.getLngLat().lat;
            });
        },

        initSearch() {
            this.search = this.$search.autofill({
                accessToken: this.access_token,
                options: { country: "us" },
                confirmOnBrowserAutofill: true,
            });

            //watch this function

            this.search.addEventListener("retrieve", (event) => {
                this.coordinates.lat =
                    event.detail.features[0].geometry.coordinates[1];
                this.coordinates.lng =
                    event.detail.features[0].geometry.coordinates[0];
                this.map.easeTo({
                    center: this.coordinates,
                    speed: 2,
                    duration: 2500,
                    curve: 2,
                });
                this.getPolygons(this.coordinates, true);
            });
        },

        initPolygonDraw() {
            this.draw = new this.$MapboxDraw({
                displayControlsDefault: false,
                // Select which mapbox-gl-draw control buttons to add to the map.
                controls: {
                    polygon: true,
                    trash: true,
                },
                // Set mapbox-gl-draw to draw by default.
                // The user does not have to click the polygon control button first.
                defaultMode: "draw_polygon",
            });

            this.map.addControl(this.draw);
        },

        async getPolygons(lngLat, selected) {
            await this.$store.dispatch("polygons/find", lngLat);
            if (selected) {
                let itemsArrays = JSON.parse(this.polygon.geojson).coordinates;
                this.geojsonArrays = [];

                //fix response polygons to the polygonSource array
                itemsArrays[0].forEach((item) => {
                    let itemArray = [item[1], item[0]];
                    this.geojsonArrays.push(itemArray);
                });

                if (this.map.getLayer("outlineSelected"))
                    this.map.removeLayer("outlineSelected");
                if (this.map.getLayer("maineSelected"))
                    this.map.removeLayer("maineSelected");
                if (this.map.getSource("polygonSourceSelected"))
                    this.map.removeSource("polygonSourceSelected");

                this.map.addSource("polygonSourceSelected", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            // These coordinates outline Maine.
                            coordinates: [this.geojsonArrays],
                        },
                    },
                });

                // Add a new layer to visualize the polygon.
                this.map.addLayer({
                    id: "maineSelected",
                    type: "fill",
                    source: "polygonSourceSelected", // reference the data source
                    layout: {},
                    paint: {
                        "fill-color": "#4d04af", // blue color fill
                        "fill-opacity": 0.8,
                    },
                });
                // Add a black outline around the polygon.
                this.map.addLayer({
                    id: "outlineSelected",
                    type: "line",
                    source: "polygonSourceSelected",
                    layout: {},
                    paint: {
                        "line-color": "#4d04af",
                        "line-width": 3,
                    },
                });
            } else if (this.currentPolygonId != this.polygon.parcel_id) {
                let itemsArrays = JSON.parse(this.polygon.geojson).coordinates;
                this.geojsonArrays = [];

                //fix response polygons to the polygonSource array
                itemsArrays[0].forEach((item) => {
                    let itemArray = [item[1], item[0]];
                    this.geojsonArrays.push(itemArray);
                });

                if (this.map.getLayer("outlineHover"))
                    this.map.removeLayer("outlineHover");
                if (this.map.getLayer("maineHover"))
                    this.map.removeLayer("maineHover");
                if (this.map.getSource("polygonSourceHover"))
                    this.map.removeSource("polygonSourceHover");

                this.map.addSource("polygonSourceHover", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            // These coordinates outline Maine.
                            coordinates: [this.geojsonArrays],
                        },
                    },
                });

                // Add a new layer to visualize the polygon.
                this.map.addLayer({
                    id: "maineHover",
                    type: "fill",
                    source: "polygonSourceHover", // reference the data source
                    layout: {},
                    paint: {
                        "fill-color": "#0080ff", // blue color fill
                        "fill-opacity": 0.2,
                    },
                });
                // Add a black outline around the polygon.
                this.map.addLayer({
                    id: "outlineHover",
                    type: "line",
                    source: "polygonSourceHover",
                    layout: {},
                    paint: {
                        "line-color": "#000",
                        "line-width": 3,
                    },
                });
                this.currentPolygonId = this.polygon.parcel_id;
            }
        },

        async getAddress() {
            let params = {
                lat: this.coordinates.lat,
                lng: this.coordinates.lng,
                access_token: this.access_token,
            };
            await this.$store.dispatch("places/get", params);
            this.form.address = this.places[0].place_name;
        },

        init3D_not_working() {
            // Insert the layer beneath any symbol layer.
            const layers = this.map.getStyle().layers;
            const labelLayerId = layers.find(
                (layer) => layer.type === "symbol" && layer.layout["text-field"]
            ).id;

            // The 'building' layer in the Mapbox Streets
            // vector tileset contains building height data
            // from OpenStreetMap.
            this.map.addLayer(
                {
                    id: "add-3d-buildings",
                    source: "composite",
                    "source-layer": "building",
                    filter: ["==", "extrude", "true"],
                    type: "fill-extrusion",
                    minzoom: 15,
                    transition: {
                        duration: 300,
                        delay: 0,
                    },
                    paint: {
                        "fill-extrusion-color": "#aaa",

                        // Use an 'interpolate' expression to
                        // add a smooth transition effect to
                        // the buildings as the user zooms in.
                        "fill-extrusion-height": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            15,
                            0,
                            15.05,
                            ["get", "height"],
                        ],
                        "fill-extrusion-base": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            15,
                            0,
                            15.05,
                            ["get", "min_height"],
                        ],
                        "fill-extrusion-opacity": 0.6,
                    },
                },
                labelLayerId
            );
        },
    },

    watch: {
        coordinates: {
            deep: true,
            handler(value, old) {
                this.marker.setLngLat(this.coordinates);
                this.$router.push({
                    query: this.coordinates,
                });
                this.map.easeTo({
                    center: this.coordinates,
                    speed: 2,
                    duration: 2500,
                    curve: 2,
                });
            },
        },
    },
};
</script>
<style>
mapbox-search-listbox {
    position: absolute;
    z-index: 10;
}

.mbx183d3cf5--MapboxSearch {
    position: absolute;
    z-index: 2;
}
</style>
