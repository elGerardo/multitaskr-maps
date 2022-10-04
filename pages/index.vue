<template>
    <div>
        <form>
            <input
                name="address"
                placeholder="address"
                autocomplete="shipping address-line1"
            />
            <input
                name="apartment"
                placeholder="apartment"
                autocomplete="shipping address-line2"
            />
            <input
                name="city"
                placeholder="city"
                autocomplete="shipping address-level2"
            />
            <input
                name="state"
                placeholder="state"
                autocomplete="shipping address-level1"
            />
            <input
                name="country"
                placeholder="country"
                autocomplete="shipping country"
            />
        </form>
        <div id="map" style="width: 100%; height: 100vh"></div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            access_token:
                "pk.eyJ1IjoiZWxnZXJhcmRvIiwiYSI6ImNsOG90NjFtMzFucG0zeWw1YWRheTV5ZmYifQ.87BCgCSXpjLIHkqGsWUW7g",
            map: {},
            marker: {},
            search: {},
            coordinates: {
                lng: 107.61861,
                lat: -6.90389,
            },
        };
    },

    mounted() {
        this.init();
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

            this.map.on("click", (event) => {
                this.coordinates.lat = parseFloat(event.lngLat.lat);
                this.coordinates.lng = parseFloat(event.lngLat.lng);
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
            });

            this.search = this.$search.autofill({
                accessToken: this.access_token,
                options: { country: "us" },
            });

            this.search.addEventListener("retrieve", (event) => {
                this.coordinates.lat =
                    event.detail.features[0].geometry.coordinates[1];
                this.coordinates.lng =
                    event.detail.features[0].geometry.coordinates[0];
                this.map.setCenter([
                    this.coordinates.lng,
                    this.coordinates.lat,
                ]);
            });
        },
    },

    watch: {
        coordinates: {
            deep: true,
            handler(value, old) {
                this.marker.setLngLat([
                    this.coordinates.lng,
                    this.coordinates.lat,
                ]);
            },
        },
    },
};
</script>
