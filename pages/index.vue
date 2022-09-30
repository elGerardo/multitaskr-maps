<template>
    <div>
        <div id="map" style="width: 100%; height: 100vh"></div>
    </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
export default {
    data() {
        return {
            access_token:
                "pk.eyJ1IjoiZWxnZXJhcmRvIiwiYSI6ImNsOG90NjFtMzFucG0zeWw1YWRheTV5ZmYifQ.87BCgCSXpjLIHkqGsWUW7g",
            map: {},
            lng: 107.61861,
            lat: -6.90389,
            marker: {},
        };
    },

    mounted() {
        this.init();
    },

    methods: {
        init() {
            let successCallback = (location) => {
                this.success = true;

                (this.lat = location.coords.latitude),
                    (this.lng = location.coords.longitude),
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
            mapboxgl.accessToken = this.access_token;
            this.map = new mapboxgl.Map({
                container: "map",
                style: "mapbox://styles/mapbox/streets-v11",
                zoom: 11,
                pitch: 45, //inclination
                bearing: -17.6, // rotation
                antialias: true,
                //                center: [coordinates.longitude, coordinates.latitute],
                center: [this.lng, this.lat],
                projection: "globe", // display the map as a 3D globe,
                attributionControl: false,
            });

            this.marker = new mapboxgl.Marker({
                color: "#FFFFFF",
                draggable: true,
            })
                .setLngLat([this.lng, this.lat])
                .addTo(this.map);

            this.map.addControl(
                new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    mapboxgl: mapboxgl,
                })
            );

            this.map.on("click", (event) => {
                this.lat = parseFloat(event.lngLat.lat);
                this.lng = parseFloat(event.lngLat.lng);

                this.marker.setLngLat([this.lng, this.lat]);
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
        },
    },
};
</script>
