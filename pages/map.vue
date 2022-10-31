<template>
    <div>
        <form class="py-2">
            <div class="d-flex justify-content-center align-content-center">
                <input
                    style="width: 300px"
                    name="address"
                    placeholder="address"
                    autocomplete="shipping address-line1"
                    v-model="form.address"
                />
                <b-button id="setAdu">Set Adu</b-button>
            </div>
            <!--
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
                                setupMap()
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
                                setupMap()
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
                                setupMap()
                        "
                        variant="info"
                        >Default 2</b-button
                    >
                </b-col>
            </b-row>
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
                />-->
        </form>
        <b-button
            v-b-toggle.sidebar-menu
            style="
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 1;
                background-color: #4d04af;
            "
            id="btn_menu"
            >Menu</b-button
        >
        <b-sidebar id="sidebar-menu" bg-variant="white" style="z-index: 1">
            <div class="px-2">
                <h2>{{ form.address }}</h2>
                <hr />
                <b-tabs>
                    <b-tab title="Details">
                        <span>LAND USE CATEGORY</span>
                        <p>Residential</p>
                        <span>LAND USE</span>
                        <p>Single Family Dwelling</p>
                        <b-row>
                            <b-col>
                                <span>CITY</span>
                                <p>Santa Rosa</p>
                            </b-col>
                            <b-col>
                                <span>COUNTY</span>
                                <p>Sonoma County</p>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col>
                                <span>STATE</span>
                                <p>California</p>
                            </b-col>
                            <b-col>
                                <span>ZIP CODE</span>
                                <p>95401</p>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col>
                                <span>LOT AREA</span>
                                <p>5,918 sqft</p>
                            </b-col>
                            <b-col>
                                <span>PROPERTY ID</span>
                                <p>{{ parcelId }}</p>
                            </b-col>
                        </b-row>
                    </b-tab>
                    <b-tab title="Projects"></b-tab>
                    <b-tab title="Documents"></b-tab>
                </b-tabs>
            </div>
        </b-sidebar>
        <div id="map" style="width: 100%; height: 100vh"></div>
    </div>
</template>
<script>
import { mapGetters } from "vuex";
import { debounce } from "lodash";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { DragControls } from "three/examples/jsm/controls/DragControls";

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
                zoom: 22,
            },
            map: {},
            marker: {},
            search: {},
            draw: {},
            popup: {},
            geojsonArrays: [],
            coordinates: {
                lat: this.$route.query.lat,
                lng: this.$route.query.lng,
                //lat: -35.39847,
                //lng: 148.9819
            },
            form: {
                address: null,
                apartment: null,
                city: null,
                state: null,
                country: null,
            },
            urlSourceParcel: "mapbox://martoast.citysandiego",
            sourceLayer: "citysandiego",
            parcelId: null,
            tooltipId: null,
            hoveredStateId: null,
            modelConfig:{
                camera: null,
                scene: null,
                renderer: null
            }
            //scene: null,
            //camera: null
        };
    },

    mounted() {
        this.setupMap();
    },

    computed: {
        ...mapGetters({
            places: "places/places",
            geojson: "geojson/geojson",
            polygon: "polygons/polygon",
        }),
    },

    methods: {
        setupMap() {
            this.initMap();
            this.initSearch();

            //first time the page is loaded
            this.getPolygons(this.coordinates);

            //Hover to parcels
            this.initHoverParcel();
        },

        initSources() {
            this.map.addSource("parcel_source", {
                type: "vector",
                url: this.urlSourceParcel,
                generateId: true,
            });
        },

        initMap() {
            //new map
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

            //fetch to API when make a click
            this.map.on("click", (e) => {
                this.coordinates.lat = parseFloat(e.lngLat.lat);
                this.coordinates.lng = parseFloat(e.lngLat.lng);
                this.config.zoom = this.map.getZoom();
                this.getAddress();
                this.getPolygons(e.lngLat);
            });

            //zoom event
            this.map.on("zoom", (e) => {
                this.config.zoom = this.map.getZoom();
            });

            this.map.on("style.load", () => {
                this.map.addLayer(this.add3dModel(), "waterway-label");

                this.map.on("mousemove", "3d-model", (e) => {
                    console.log("moving 3d model...");
                });

                this.map.on("mousemove", "building-extrusion", (e) => {
                    console.log("touching 3d...");
                });

                this.initSources();
            });
        },

        add3dModel() {
            var modelOrigin = [this.$route.query.lng, this.$route.query.lat];
            //let modelOrigin = [-117.02390122960196, 32.58871798986128]
            var modelAltitude = 0;
            var modelRotate = [Math.PI / 2, 0, 0];

            let modelAsMercatorCoordinate =
                this.$mapboxgl.MercatorCoordinate.fromLngLat(
                    modelOrigin,
                    modelAltitude
                );

            // transformation parameters to position, rotate and scale the 3D model onto the map
            let modelTransform = {
                translateX: modelAsMercatorCoordinate.x,
                translateY: modelAsMercatorCoordinate.y,
                translateZ: modelAsMercatorCoordinate.z,
                rotateX: modelRotate[0],
                rotateY: modelRotate[1],
                rotateZ: modelRotate[2],
                /* Since the 3D model is in real world meters, a scale transform needs to be
                 * applied since the CustomLayerInterface expects units in MercatorCoordinates.
                 */
                scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
            };

            var mapbox = this.map;
            var mapboxgl = this.$mapboxgl;

            console.log(this.coordinates);

            

            let customLayer = {
                id: "3d-model",
                type: "custom",
                renderingMode: "3d",
                onAdd: (map, gl) => {

                    this.modelConfig.camera = new THREE.Camera();
                    this.modelConfig.scene = new THREE.Scene();

                    // create two three.js lights to illuminate the model
                    const directionalLight = new THREE.DirectionalLight(
                        0xffffff
                    );
                    directionalLight.position.set(0, -70, 100).normalize();
                    this.modelConfig.scene.add(directionalLight);

                    const directionalLight2 = new THREE.DirectionalLight(
                        0xffffff
                    );
                    directionalLight2.position.set(0, 70, 100).normalize();
                    this.modelConfig.scene.add(directionalLight2);

                    let urlSrc = "./models/adutwo.fbx";

                    this.modelConfig.loader = new FBXLoader();
                    this.modelConfig.loader.load(urlSrc, (fbx) => {
                        console.log(fbx);
                        fbx.scale.set(0.02, 0.02, 0.02);
                        fbx.position.set(-37, 0, 20);
                        this.modelConfig.scene.add(fbx);
                    });

                    document
                        .getElementById("setAdu")
                        .addEventListener("click", () => {

                            let init = true;
                            let onBuilding = false;

                            this.map.moveLayer("maineSelected", "building-extrusion");
                            
                            this.map.on("mouseenter", "building-extrusion", (e) => {
                                console.log("inside the bulding...");
                                onBuilding = true;
                            });

                            this.map.on("mouseleave", "building-extrusion", (e) => {
                                console.log("outnside the bulding...");
                                onBuilding = false;
                            });
 
                            this.map.on("mousemove", "maineSelected", (e) => {                             

                            if (init && !onBuilding) {

                                modelAsMercatorCoordinate =
                                    this.$mapboxgl.MercatorCoordinate.fromLngLat(
                                        [e.lngLat.lng, e.lngLat.lat],
                                        modelAltitude
                                    );
                                modelTransform = {
                                    translateX: modelAsMercatorCoordinate.x,
                                    translateY: modelAsMercatorCoordinate.y,
                                    translateZ: modelAsMercatorCoordinate.z,
                                    rotateX: modelRotate[0],
                                    rotateY: modelRotate[1],
                                    rotateZ: modelRotate[2],

                                    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
                                };
                            }
                        });
                        
                        this.map.on("click", "maineSelected", (e) => {
                                init = false;
                            });
                        });

                    // use the Mapbox GL JS map canvas for three.js
                    this.modelConfig.renderer = new THREE.WebGLRenderer({
                        canvas: map.getCanvas(),
                        context: gl,
                        antialias: false,
                    });

                    this.modelConfig.renderer.autoClear = false;
                },

                render: (gl, matrix) => {
                    var rotationX = new THREE.Matrix4().makeRotationAxis(
                        new THREE.Vector3(1, 0, 0),
                        modelTransform.rotateX
                    );
                    var rotationY = new THREE.Matrix4().makeRotationAxis(
                        new THREE.Vector3(0, 1, 0),
                        modelTransform.rotateY
                    );
                    var rotationZ = new THREE.Matrix4().makeRotationAxis(
                        new THREE.Vector3(0, 0, 1),
                        modelTransform.rotateZ
                    );

                    var m = new THREE.Matrix4().fromArray(matrix);
                    var l = new THREE.Matrix4()
                        .makeTranslation(
                            modelTransform.translateX,
                            modelTransform.translateY,
                            modelTransform.translateZ
                        )
                        .scale(
                            new THREE.Vector3(
                                modelTransform.scale,
                                -modelTransform.scale,
                                modelTransform.scale
                            )
                        )
                        .multiply(rotationX)
                        .multiply(rotationY)
                        .multiply(rotationZ);
                    
                    this.modelConfig.camera.projectionMatrix = m.multiply(l);
                    this.modelConfig.renderer.resetState();
                    this.modelConfig.renderer.render(this.modelConfig.scene, this.modelConfig.camera);
                    this.map.triggerRepaint();
                },
            };

            return customLayer;
        },

        initTooltip() {
            this.popup = new this.$mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
            });
            this.map.on("mousemove", "sandiego_parcels", (e) => {
                if (this.tooltipId != e.features[0].properties.parcel_id) {
                    this.tooltipId = e.features[0].properties.parcel_id;
                    this.popup
                        .setLngLat(e.lngLat)
                        .setHTML(e.features[0].properties.parcel_id)
                        .addTo(this.map);
                }
            });

            this.map.on("mouseleave", "sandiego_parcels", (e) => {
                this.popup.remove();
            });
        },

        initHoverParcel() {
            let hoveredStateId = null;

            this.map.on("load", (e) => {
                this.map.addLayer({
                    id: "sandiego_parcels",
                    generateId: true,
                    source: "parcel_source",
                    "source-layer": this.sourceLayer,
                    type: "fill",
                    paint: {
                        "fill-color": "rgba(133,8,142,0.1)",
                        "fill-outline-color": "rgba(133,8,142,1)",
                        "fill-opacity": [
                            "case",
                            ["boolean", ["feature-state", "hover"], false],
                            1,
                            0.5,
                        ],
                    },
                });

                this.map.moveLayer("sandiego_parcels", "building-extrusion");

                this.map.on("mousemove", "sandiego_parcels", (e) => {
                    if (this.parcelId != e.features[0].properties.parcel_id) {
                        this.parcelId = e.features[0].properties.parcel_id;

                        if (e.features.length > 0) {
                            if (hoveredStateId !== null) {
                                this.map.setFeatureState(
                                    {
                                        source: "parcel_source",
                                        id: hoveredStateId,
                                        sourceLayer: this.sourceLayer,
                                    },
                                    { hover: false }
                                );
                            }
                            hoveredStateId = e.features[0].id;
                            this.map.setFeatureState(
                                {
                                    source: "parcel_source",
                                    id: hoveredStateId,
                                    sourceLayer: this.sourceLayer,
                                },
                                { hover: true }
                            );
                        }
                    }
                });

                // When the mouse leaves the state-fill layer, update the feature state of the
                // previously hovered feature.
                this.map.on("mouseleave", "sandiego_parcels", () => {
                    if (hoveredStateId !== null) {
                        this.map.setFeatureState(
                            {
                                source: "parcel_source",
                                id: hoveredStateId,
                                sourceLayer: this.sourceLayer,
                            },
                            { hover: false }
                        );
                    }
                    hoveredStateId = null;
                });
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
                //fetch to API
                this.getPolygons(this.coordinates);

                //this.$refs.sideBarMenu.show();
                document.getElementById("btn_menu").click;
                //this.$refs.sideBarMenu.toggle();
            });
        },

        //fetch's
        async getAddress() {
            let params = {
                lat: this.coordinates.lat,
                lng: this.coordinates.lng,
                access_token: this.access_token,
            };
            await this.$store.dispatch("places/get", params);
            this.form.address = this.places[0].place_name;
        },

        async getPolygons(lngLat) {
            await this.$store.dispatch("polygons/find", lngLat);

            let itemsArrays = JSON.parse(this.polygon.geojson).coordinates;
            this.geojsonArrays = [];

            //fix response polygons to the polygonSource array
            itemsArrays[0].forEach((item) => {
                let itemArray = [item[1], item[0]];
                this.geojsonArrays.push(itemArray);
            });

            //bounds to get parcel center
            this.centeredView(this.geojsonArrays);

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
                    "fill-color": "rgb(133,8,142)", // blue color fill
                    "fill-opacity": 1,
                },
            });
            // Add a black outline around the polygon.
            this.map.addLayer({
                id: "outlineSelected",
                type: "line",
                source: "polygonSourceSelected",
                layout: {},
                paint: {
                    "line-color": "rgba(133,8,142,1)",
                    "line-width": 3,
                },
            });

            this.map.moveLayer("maineSelected", "building-extrusion");
            this.map.moveLayer("outlineSelected", "building-extrusion");
        },

        centeredView(coordinates) {
            var bounds = new this.$mapboxgl.LngLatBounds(
                coordinates[0],
                coordinates[0]
            );

            for (var coord of coordinates) {
                bounds.extend(coord);
            }

            var center = bounds;

            //this.marker.setLngLat(center.getCenter());

            this.map.easeTo({
                center: center.getCenter(),
                speed: 2,
                duration: 2500,
                curve: 2,
            });

            this.map.fitBounds(bounds, {});
        },
    },

    watch: {
        coordinates: {
            deep: true,
            handler(value, old) {
                this.$router.push({
                    query: this.coordinates,
                });
            },
        },

        parcelId: debounce(async function (value, old) {
            //fetch
            //console.log("debouncing...");
            //console.log(this.parcelId);
        }, 600),
    },
};
</script>
<style>
.nav-link {
    color: #85088e;
}
</style>
