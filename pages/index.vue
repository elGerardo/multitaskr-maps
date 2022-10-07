<template>
    <div>
        <form>
            <input
                name="address"
                placeholder="address"
                autocomplete="shipping address-line1"
                v-model="form.address"
            />
            <input
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
            />
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
            coordinates: {
                lat: 32.5665,
                lng: -117.0235,
            },
            form: {
                address: null,
                apartment: null,
                city: null,
                state: null,
                country: null,
            },
        };
    },

    mounted() {
        this.createMap();
    },

    computed: {
        ...mapGetters({
            places: "places/places",
        }),
    },

    methods: {
        init() {
            let successCallback = (location) => {
                this.success = true;
                this.coordinates.lat = location.coords.latitude;
                this.coordinates.lng = location.coords.longitude;
                this.createMap();
            };

            let errorCallback = (location) => {
                console.log("Error Location");
            };

            navigator.geolocation.getCurrentPosition(
                successCallback,
                errorCallback
            );
        },

        createMap() {
            this.$mapboxgl.accessToken = this.access_token;
            this.map = new this.$mapboxgl.Map({
                container: "map",
                style: "mapbox://styles/mapbox/streets-v11",
                zoom: 11,
                pitch: 45, //inclination
                bearing: -17.6, // rotation
                antialias: true,
                //                center: [coordinates.longitude, coordinates.latitute],
                center: [this.coordinates.lng, this.coordinates.lat],
                projection: "globe", // display the map as a 3D globe,
                attributionControl: false,
            });

            this.marker = new this.$mapboxgl.Marker({
                color: "blue",
                draggable: true,
            })
                .setLngLat([this.coordinates.lng, this.coordinates.lat])
                .addTo(this.map);

            this.marker.on("dragend", (event) => {
                //console.log(event);
                this.coordinates.lng = this.marker.getLngLat().lng;
                this.coordinates.lat = this.marker.getLngLat().lat;
            });

            this.map.on("click", (event) => {
                //console.log(event);
                this.coordinates.lat = parseFloat(event.lngLat.lat);
                this.coordinates.lng = parseFloat(event.lngLat.lng);
                this.getAddress();
            });

            this.map.on("load", () => {
                // Insert the layer beneath any symbol layer.
                const layers = this.map.getStyle().layers;
                const labelLayerId = layers.find(
                    (layer) =>
                        layer.type === "symbol" && layer.layout["text-field"]
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

                this.addPolygon();
            });

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

        addPolygon() {
            this.map.addSource("maine", {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        // These coordinates outline Maine.
                        coordinates: [
                            [
                                [-117.04032221565436,32.56788775850487],
                                [-117.04047227600599,32.56772503030933],
                                [-117.04145086617561,32.562454274516284],
                                [-117.03323380160447,32.562619119624316],
                                [-117.028235431521,32.56763679941878]
                            ],
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

        async getAddress() {
            let params = {
                lat: this.coordinates.lat,
                lng: this.coordinates.lng,
                access_token: this.access_token,
            };
            await this.$store.dispatch("places/get", params);

            this.form.address =
                this.places[0].address + " " + this.places[0].text;

            this.form.city = this.places[0].context[2].text;
            this.form.state = this.places[0].context[3].short_code;
            this.form.country = this.places[0].context[4].short_code;
            console.log(this.places);
        },
    },

    watch: {
        coordinates: {
            deep: true,
            handler(value, old) {
                console.log(this.marker.getLngLat())
                this.marker.setLngLat(this.coordinates);
                this.map.easeTo({
                    center: this.coordinates,
                    speed: 2,
                    duration: 2500,
                    curve: 2,
                });
            },
        },
        /*search: {
            deep: true,
            handler(value, old) {
                console.log(value);
                this.map.easeTo({
                    center: this.coordinates,
                    zoom: 15,
                    speed: 2,
                    duration: 2500,
                    curve: 2,
                });
            },
        },*/
    },
};
</script>
