<template>
    <div>
        <form>
            <input
                style="width: 750px"
                name="address"
                placeholder="address"
                autocomplete="shipping address-line1"
                v-model="form.address"
            />
            <b-button @click="initPolygonDraw()">Draw Polygon</b-button>
            <b-button @click="map.setStyle('mapbox://styles/javy3r18/cl8yrxo04000014py4v4pmavh')">Javier Style</b-button>
            <b-button @click="map.setStyle('mapbox://styles/elgerardo/cl8yrf6l1000e15o68btt9hgi')">Me Style</b-button>
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
        <div id="map" style="width: 100%; height: 100vh"></div>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
    data() {
        return {
            access_token:
                "pk.eyJ1IjoiZWxnZXJhcmRvIiwiYSI6ImNsOG90NjFtMzFucG0zeWw1YWRheTV5ZmYifQ.87BCgCSXpjLIHkqGsWUW7g",
            map: {},
            marker: {},
            search: {},
            draw: {},
            coordinates: {
                lat: 33.16944,
                lng: -117.07504,
            },
            form: {
                address: null,
                apartment: null,
                city: null,
                state: null,
                country: null,
            },
            geojsonArrays: [],
        };
    },

    mounted() {
        this.createMap();
        this.filterData();
    },

    computed: {
        ...mapGetters({
            places: "places/places",
            geojson: "geojson/geojson",
        }),
    },

    methods: {
        createMap() {
            this.initMap();
            this.initMarker();
            this.initSearch();
        },

        initMap() {
            this.$mapboxgl.accessToken = this.access_token;
            this.map = new this.$mapboxgl.Map({
                container: "map",
                style: "mapbox://styles/elgerardo/cl8yrf6l1000e15o68btt9hgi",
                zoom: 11,
                pitch: 45, //inclination
                bearing: -17.6, // rotation
                antialias: true,
                //                center: [coordinates.longitude, coordinates.latitute],
                center: [this.coordinates.lng, this.coordinates.lat],
                projection: "globe", // display the map as a 3D globe,
                attributionControl: false,
            });

            this.map.on("click", (event) => {
                this.coordinates.lat = parseFloat(event.lngLat.lat);
                this.coordinates.lng = parseFloat(event.lngLat.lng);
                this.getAddress();
            });

            this.map.on("load", () => {
                //this.init3D();
                this.addPolygon();
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
            });
        },

        /*init3D() {
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
        },*/

        addPolygon() {

            let exampleArray = [
                [-117.074993,33.169305],
                [-117.07489,33.169303],
                [-117.074884,33.169519],
                [-117.074987,33.169521],
                [-117.074993,33.169305]
            ]

            this.map.addSource("maine", {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        // These coordinates outline Maine.
                        coordinates: [
                        this.geojsonArrays
                        ],
                    },
                },
            });
            
            // Add a new layer to visualize the polygon.
            this.map.addLayer({
                id: "maine",
                type: "fill",
                source: "maine", // reference the data source
                layout: {},
                paint: {
                    "fill-color": "#0080ff", // blue color fill
                    "fill-opacity": 0.5,
                },
            });
            // Add a black outline around the polygon.
            this.map.addLayer({
                id: "outline",
                type: "line",
                source: "maine",
                layout: {},
                paint: {
                    "line-color": "#000",
                    "line-width": 3,
                },
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

        async getAddress() {
            let params = {
                lat: this.coordinates.lat,
                lng: this.coordinates.lng,
                access_token: this.access_token,
            };
            await this.$store.dispatch("places/get", params);

            this.form.address = this.places[0].place_name;

            /*this.form.city = this.places[0].context[2].text;
            this.form.state = this.places[0].context[3].short_code;
            this.form.country = this.places[0].context[4].short_code;*/
        },

        filterData(){
            this.geojson.forEach(item => {
                let itemArray = [item.lng,item.lat];
                this.geojsonArrays.push(itemArray);
            });
        }
    },

    watch: {
        coordinates: {
            deep: true,
            handler(value, old) {
                this.marker.setLngLat(this.coordinates);
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
