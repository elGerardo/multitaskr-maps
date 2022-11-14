<template>
    <div>
        <div
            id="loading_container"
            :style="isLoading ? 'displa:inline;' : 'display:none'"
        >
            <div>
                <h1>Loading...</h1>
            </div>
        </div>
        <b-navbar class="d-flex justify-content-center align-items-center">
            <form
                class="d-flex w-25"
                style="
                    color: none;
                    background-color: none;
                    border: none;
                    outline: none;
                "
            >
                <div
                    class="d-flex w-100"
                    style="border: 1px solid #e1d9dc; border-radius: 15px"
                >
                    <b-icon
                        icon="search"
                        class="mx-2"
                        style="color: #747474; margin-top: 7.5px"
                    />
                    <input
                        id="address"
                        name="address"
                        placeholder="Enter a location"
                        autocomplete="shipping address-line1"
                        style="
                            width: 100%;
                            outline: none;
                            border: none;
                            padding: 5px;
                            color: #747474;
                        "
                        v-model="form.address"
                    />
                </div>
            </form>
        </b-navbar>
        <div class="d-flex" style="height: 90vh; position: relative">
            <div style="width: 20%">
                <form :style="isLoading ? 'displa:none;' : 'display:block;'">
                    <div
                        class="d-flex flex-column p-3"
                        style="border-top: 1px solid #e1d9dc"
                    >
                        <div style="border-bottom: 1px solid #e1d9dc">
                            <label for="address" style="color: #747474"
                                >Address</label
                            >
                            <p class="font-weight-bold">{{ address }}</p>
                        </div>
                        <div
                            class="w-100 d-flex justify-content-center align-items-center flex-column pb-3"
                            style="border-bottom: 1px solid #e1d9dc"
                        >
                            <input
                                type="button"
                                style="
                                    border-radius: 5px 5px 0 0;
                                    outline: none;
                                    border: 1px solid #4d04af;
                                    background-color: #4d04af;
                                    color: white;
                                    width: 75%;
                                "
                                class="mt-3"
                                @click="initFloorPlanADU()"
                                value="Set ADU"
                            />
                            <span
                                style="
                                    border-radius: 0 0 5px 5px;
                                    background-color: #f4c5cb;
                                    color: #804953;
                                    text-align: center;
                                    width: 75%;
                                "
                                v-if="!allowedADU && adu.isADUSet"
                                >Can't set ADU</span
                            >
                            <span
                                style="
                                    border-radius: 0 0 5px 5px;
                                    background-color: #cfead8;
                                    color: #1c684e;
                                    text-align: center;
                                    width: 75%;
                                "
                                v-if="allowedADU && adu.isADUSet"
                                >Available to set ADU</span
                            >
                            <div>
                                <label
                                    v-if="adu.isADUSet"
                                    class="mt-3"
                                    style="color: #747474"
                                    for="rotate"
                                    >Rotate ADU</label
                                >
                                <b-form-input
                                    v-if="adu.isADUSet"
                                    id="rotate"
                                    v-model="adu.rotate"
                                    type="range"
                                    min="0"
                                    step="10"
                                    max="360"
                                ></b-form-input>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div
                class="d-flex justify-content-center align-items-center flex-column position-absolute"
                style="right: 15px; top: 15px; z-index: 5"
            >
                <div class="bg-white shadow-lg rounded-circle px-2 py-1 my-3">
                    <button
                        @click="goToCurrentLocation"
                        class="bg-white current-location"
                        style="
                            outline: none;
                            border: none;
                            color: white;
                            margin: 0;
                            padding: 0;
                            color: #747474;
                        "
                    >
                        <b-icon icon="cursor"></b-icon>
                    </button>
                </div>
                <div
                    class="bg-white d-flex flex-column shadow-lg"
                    style="border-radius: 15px"
                >
                    <button
                        @click="
                            () => {
                                config.zoom += 2;
                                map.easeTo({
                                    zoom: config.zoom,
                                });
                            }
                        "
                        class="bg-white p-2 zoom-in"
                        style="
                            outline: none;
                            border: none;
                            border-radius: 15px 15px 0 0;
                            font-size: 24px;
                            font-weight: 400;
                            color: #747474;
                        "
                    >
                        +
                    </button>
                    <button
                        @click="
                            () => {
                                config.zoom -= 2;
                                map.easeTo({
                                    zoom: config.zoom,
                                });
                            }
                        "
                        class="bg-white p-2 zoom-out"
                        style="
                            outline: none;
                            border: none;
                            border-radius: 0 0 15px 15px;
                            font-size: 24px;
                            font-weight: 400;
                            color: #747474;
                        "
                    >
                        -
                    </button>
                </div>
            </div>
            <div id="map" style="width: 80%"></div>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import { mapGetters } from "vuex";
import { debounce } from "lodash";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default {
    async fetch({ store, route }) {
        await store.dispatch("polygons/find", route.query);
    },

    data() {
        return {
            access_token:
                "pk.eyJ1IjoiZWxnZXJhcmRvIiwiYSI6ImNsOG90NjFtMzFucG0zeWw1YWRheTV5ZmYifQ.87BCgCSXpjLIHkqGsWUW7g",
            mapStyle: "mapbox://styles/elgerardo/cl9d3ovzq000115ubx8rs0flv",
            urlSourceParcel: "mapbox://martoast.citysandiego",
            sourceLayer: "citysandiego",
            config: {
                zoom: 19.5,
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
            },
            modelLngLat: {
                lat: this.$route.query.lat,
                lng: this.$route.query.lng,
            },
            form: {
                address: null,
                apartment: null,
                city: null,
                state: null,
                country: null,
            },
            parcel: {
                hover: null,
                selected: null,
            },
            adu: {
                centerCoordinates: null,
                polygonCoordinates: null,
                rotate: 0,
                isMoving: false,
                isAllowed: true,
                isADUSet: false,
            },
            building: {
                coordinates: null,
            },
            modelConfig: {
                camera: null,
                scene: null,
                renderer: null,
                rotate: 0,
            },
            address: null,
            isLoading: true,
            modelTransform: null,
            modelAsMercatorCoordinate: null,
            modelAltitude: null,
            modelOrigin: null,
            centerBound: null,
            tooltipId: null,
            hoveredStateId: null,
            allowedADU: true,
            movingFloorplan: false,
            controlMoveADU: false,
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
            this.controlScroll(true);
            this.initMap();
            this.initHoverParcel();
        },

        initMap() {
            this.$mapboxgl.accessToken = this.access_token;
            this.map = new this.$mapboxgl.Map({
                container: "map",
                style: this.mapStyle,
                zoom: this.config.zoom,
                pitch: 45,
                bearing: -17.6,
                antialias: true,
                center: [this.coordinates.lng, this.coordinates.lat],
            });

            this.map.on("click", (e) => {
                this.coordinates.lat = parseFloat(e.lngLat.lat);
                this.coordinates.lng = parseFloat(e.lngLat.lng);
                this.config.zoom = this.map.getZoom();
                this.adu.rotate = 0;
                this.getAddress();
                this.getPolygons(e.lngLat);
            });

            this.map.on("zoom", (e) => {
                this.config.zoom = this.map.getZoom();
            });

            this.map.on("style.load", () => {
                this.initSources();
                this.initSearch();

                //first time the page is loaded
                this.getPolygons(this.coordinates);
                this.getAddress();

                this.map.on("click", "maineSelected", (e) => {
                    if (this.allowedADU) {
                        this.movingFloorplan = false;
                    }
                });

                this.map.on("mousemove", "maineSelected", (e) => {
                    if (this.movingFloorplan) {
                        this.adu.centerCoordinates = [
                            e.lngLat.lng,
                            e.lngLat.lat,
                        ];
                        this.addFloorPlanADU(e.lngLat);
                        this.move3dModel();
                    }
                });
            });
        },

        initSources() {
            this.map.addSource("parcel_source", {
                type: "vector",
                url: this.urlSourceParcel,
                generateId: true,
            });
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
                    if (
                        this.parcel.hover != e.features[0].properties.parcel_id
                    ) {
                        this.parcel.hover = e.features[0].properties.parcel_id;

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

                this.map.once("idle", (e) => {
                    this.initMarker();
                });
            });

            setTimeout(() => {
                console.log("looping");
                this.isLoading = false;
            }, 1000);
        },

        addParcelPointGrid(coordinates) {
            let polygon = this.$turf.polygon([coordinates]);
            let bbox = this.$turf.bbox(polygon);
            let cellSide = 3;
            let options = { units: "meters" };
            let grid = this.$turf.pointGrid(bbox, cellSide, options);

            for (let index = 0; index < grid.features.length; index++) {
                let markerLoop = new this.$mapboxgl.Marker({
                    color: "blue",
                    draggable: true,
                })
                    .setLngLat(grid.features[index].geometry.coordinates)
                    .addTo(this.map);

                let contentRenderBuildings = this.map.queryRenderedFeatures(
                    markerLoop._pos,
                    {
                        layers: ["building-extrusion"],
                    }
                );

                markerLoop.remove();

                if (contentRenderBuildings.length > 0) {
                    this.building.coordinates =
                        contentRenderBuildings[0].geometry.coordinates[0];
                    index = grid.features.length;
                }
            }
        },

        initSearch() {
            this.search = this.$search.autofill({
                accessToken: this.access_token,
                options: { country: "us" },
                confirmOnBrowserAutofill: true,
            });

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
                this.getAddress();
            });
        },

        initMarker() {
            this.marker = new this.$mapboxgl.Marker({
                color: "blue",
                draggable: true,
            })
                .setLngLat([this.coordinates.lng, this.coordinates.lat])
                .addTo(this.map);

            this.marker.remove();
        },

        initFloorPlanADU() {
            this.movingFloorplan = true;
            if (!this.adu.isADUSet) {
                this.addFloorPlanADU(this.centerBound);
                this.addParcelPointGrid(this.geojsonArrays);
                this.map.addLayer(this.add3dModel(this.centerBound));
                this.adu.isADUSet = true;
            }
        },

        addFloorPlanADU(coordinates) {
            this.adu.centerCoordinates = coordinates;
            let polygon = this.$turf.polygon([
                [
                    [-117.08251366591874, 32.60741737683557],
                    [-117.08251366591874, 32.607371064059905],
                    [-117.08245485192586, 32.607371064059905],
                    [-117.08245485192586, 32.60741737683557],
                    [-117.08251366591874, 32.60741737683557],
                ],
            ]);

            let center = this.$turf.centroid(polygon);

            let options = {
                pivot: [
                    center.geometry.coordinates[0],
                    center.geometry.coordinates[1],
                ],
            };

            let rotatedPoly = this.$turf.transformRotate(
                polygon,
                parseInt(this.adu.rotate),
                options
            );

            let from = this.$turf.point([
                center.geometry.coordinates[0],
                center.geometry.coordinates[1],
            ]);

            let to = this.$turf.point([coordinates.lng, coordinates.lat]);

            let bearing = this.$turf.rhumbBearing(from, to);

            let distance = this.$turf.rhumbDistance(from, to);

            var translatedPoly = this.$turf.transformTranslate(
                rotatedPoly,
                distance,
                bearing
            );

            this.adu.polygonCoordinates =
                translatedPoly.geometry.coordinates[0];

            if (!this.map.getSource("polygon_floorplan")) {
                this.map.addSource("polygon_floorplan", {
                    type: "geojson",
                    data: translatedPoly,
                });

                this.map.addLayer({
                    id: "transform_floor_plan",
                    type: "fill",
                    source: "polygon_floorplan",
                    paint: {
                        "fill-color": "#b390f9",
                    },
                    layout: {},
                });
                return;
            }

            this.map.getSource("polygon_floorplan").setData(translatedPoly);

            /*let floorplanSource = this.map.getSource("polygon_floorplan");

            this.floorPlanCoordinates =
                floorplanSource._data.geometry.coordinates[0];*/

            return;
        },

        validateFloorPlanAdu(coordinates) {
            let finishLoop = false;
            coordinates.forEach((item) => {
                if (!finishLoop) {
                    this.marker = new this.$mapboxgl.Marker({
                        color: "blue",
                        draggable: true,
                    })
                        .setLngLat(item)
                        .addTo(this.map);

                    let contentRender = this.map.queryRenderedFeatures(
                        this.marker._pos,
                        {
                            layers: ["sandiego_parcels"],
                        }
                    );

                    let contentRenderBuilding = this.map.queryRenderedFeatures(
                        this.marker._pos,
                        {
                            layers: ["building-extrusion"],
                        }
                    );

                    this.allowedADU = true;
                    this.map.setPaintProperty(
                        "transform_floor_plan",
                        "fill-color",
                        "#b390f9"
                    );
                    this.marker.remove();

                    if (this.building.coordinates != null) {
                        let aduPolygon = this.$turf.polygon([
                            this.adu.polygonCoordinates,
                        ]);

                        let buildingPolygon = this.$turf.polygon([
                            this.building.coordinates,
                        ]);

                        let intersection = this.$turf.intersect(
                            aduPolygon,
                            buildingPolygon
                        );
                        if (intersection) {
                            this.allowedADU = false;
                            finishLoop = true;
                            this.map.setPaintProperty(
                                "transform_floor_plan",
                                "fill-color",
                                "red"
                            );
                            return;
                        }
                    }

                    if (contentRenderBuilding.length > 0) {
                        this.allowedADU = false;
                        finishLoop = true;
                        this.map.setPaintProperty(
                            "transform_floor_plan",
                            "fill-color",
                            "red"
                        );
                        return;
                    }
                    if (contentRender.length === 0) {
                        this.allowedADU = false;
                        finishLoop = true;
                        this.map.setPaintProperty(
                            "transform_floor_plan",
                            "fill-color",
                            "red"
                        );
                        return;
                    }

                    if (
                        this.polygon.parcel_id !=
                        contentRender[0].properties.parcel_id
                    ) {
                        this.allowedADU = false;
                        finishLoop = true;
                        this.map.setPaintProperty(
                            "transform_floor_plan",
                            "fill-color",
                            "red"
                        );
                        return;
                    }
                }
            });
        },

        add3dModel(coordinates) {
            this.modelOrigin = [coordinates.lng, coordinates.lat];
            this.modelAltitude = 0;
            this.modelRotate = [Math.PI / 2, 0, 0];

            this.modelAsMercatorCoordinate =
                this.$mapboxgl.MercatorCoordinate.fromLngLat(
                    this.modelOrigin,
                    this.modelAltitude
                );

            this.modelTransform = {
                translateX: this.modelAsMercatorCoordinate.x,
                translateY: this.modelAsMercatorCoordinate.y,
                translateZ: this.modelAsMercatorCoordinate.z,
                rotateX: this.modelRotate[0],
                rotateY: this.modelRotate[1],
                rotateZ: this.modelRotate[2],
                scale: this.modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
            };

            let customLayer = {
                id: "3d-model",
                type: "custom",
                renderingMode: "3d",
                onAdd: (map, gl) => {
                    this.modelConfig.camera = new THREE.Camera();
                    this.modelConfig.scene = new THREE.Scene();

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
                        fbx.scale.set(0.02, 0.02, 0.02);
                        fbx.position.set(-37, 0, 17.5);
                        this.modelConfig.scene.add(fbx);
                    });

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
                        this.modelTransform.rotateX
                    );
                    var rotationY = new THREE.Matrix4().makeRotationAxis(
                        new THREE.Vector3(0, 1, 0),
                        this.modelTransform.rotateY
                    );
                    var rotationZ = new THREE.Matrix4().makeRotationAxis(
                        new THREE.Vector3(0, 0, 1),
                        this.modelTransform.rotateZ
                    );

                    var m = new THREE.Matrix4().fromArray(matrix);
                    var l = new THREE.Matrix4()
                        .makeTranslation(
                            this.modelTransform.translateX,
                            this.modelTransform.translateY,
                            this.modelTransform.translateZ
                        )
                        .scale(
                            new THREE.Vector3(
                                this.modelTransform.scale,
                                -this.modelTransform.scale,
                                this.modelTransform.scale
                            )
                        )
                        .multiply(rotationX)
                        .multiply(rotationY)
                        .multiply(rotationZ);

                    this.modelConfig.camera.projectionMatrix = m.multiply(l);
                    this.modelConfig.renderer.resetState();
                    this.modelConfig.renderer.render(
                        this.modelConfig.scene,
                        this.modelConfig.camera
                    );
                    this.map.triggerRepaint();
                },
            };

            return customLayer;
        },

        move3dModel() {
            this.modelAsMercatorCoordinate =
                this.$mapboxgl.MercatorCoordinate.fromLngLat(
                    [
                        this.adu.centerCoordinates.lng,
                        this.adu.centerCoordinates.lat,
                    ],
                    this.modelAltitude
                );

            this.modelLngLat.lat = this.adu.centerCoordinates.lat;
            this.modelLngLat.lng = this.adu.centerCoordinates.lng;
            this.modelTransform = {
                translateX: this.modelAsMercatorCoordinate.x,
                translateY: this.modelAsMercatorCoordinate.y,
                translateZ: this.modelAsMercatorCoordinate.z,
                rotateX: this.modelRotate[0],
                rotateY: ((-this.adu.rotate * 1.55) / 360) * 4,
                rotateZ: this.modelRotate[2],

                scale: this.modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
            };
        },

        centeredView(coordinates) {
            var bounds = new this.$mapboxgl.LngLatBounds(
                coordinates[0],
                coordinates[0]
            );

            for (var coord of coordinates) {
                bounds.extend(coord);
            }

            this.centerBound = bounds.getCenter();

            this.map.easeTo({
                center: bounds.getCenter(),
                speed: 2,
                duration: 2500,
                curve: 2,
                zoom: 19.5,
            });

            this.map.fitBounds(bounds, {});
        },

        //fetch's
        async getAddress() {
            let params = {
                lat: this.coordinates.lat,
                lng: this.coordinates.lng,
                access_token: this.access_token,
            };
            await this.$store.dispatch("places/get", params);
            this.address = this.places[0].place_name;
        },

        async getPolygons(lngLat) {
            await this.$store.dispatch("polygons/find", lngLat);

            if (this.parcel.selected != this.polygon.parcel_id) {
                this.isLoading = true;
                this.parcel.selected = this.polygon.parcel_id;

                let itemsArrays = JSON.parse(this.polygon.geojson).coordinates;
                this.geojsonArrays = [];

                itemsArrays[0].forEach((item) => {
                    let itemArray = [item[1], item[0]];
                    this.geojsonArrays.push(itemArray);
                });

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
                            coordinates: [this.geojsonArrays],
                        },
                    },
                });

                this.map.addLayer({
                    id: "maineSelected",
                    type: "fill",
                    source: "polygonSourceSelected",
                    layout: {},
                    paint: {
                        "fill-color": "rgb(133,8,142)",
                        "fill-opacity": 1,
                    },
                });
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
                if (this.adu.isADUSet) {
                    this.addFloorPlanADU(this.centerBound);

                    this.addParcelPointGrid(this.geojsonArrays);

                    if (!this.map.getLayer("3d-model")) {
                        this.map.addLayer(this.add3dModel(this.centerBound));
                    } else {
                        this.move3dModel();
                    }
                    this.map.moveLayer(
                        "transform_floor_plan",
                        "building-extrusion"
                    );

                    this.map.moveLayer("maineSelected", "transform_floor_plan");
                }

                this.isLoading = false;
            }
        },

        controlScroll(isLoading) {
            console.log(isLoading);
            if (isLoading) {
                document.getElementsByTagName("body")[0].style.overflowY =
                    "hidden";
            }
            if (!isLoading) {
                document.getElementsByTagName("body")[0].style.overflowY =
                    "scroll";
            }
        },

        goToCurrentLocation() {
            this.map.easeTo({
                center: this.centerBound,
                speed: 2,
                duration: 2000,
                curve: 2,
                pitch: 45,
                zoom: 19.5,
            });
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

        "adu.polygonCoordinates": {
            deep: true,
            handler: debounce(function (value, old) {
                if (this.map.getLayer("sandiego_parcels"))
                    this.validateFloorPlanAdu(value);
            }, 250),
        },

        "adu.rotate": {
            handler(value, old) {
                console.log("moving");
                this.addFloorPlanADU(this.adu.centerCoordinates);
                this.move3dModel();
            },
        },

        /*"parcel.hover": debounce(async function (value, old) {
            //fetch
            //console.log("debouncing...");
            //console.log(this.parcelId);
        }, 600),*/

        isLoading: debounce(function (value, old) {
            console.log(value);
            if (value) {
                this.controlScroll(true);
            } else {
                this.controlScroll(false);
            }
        }, 1000),

        /*"config.zoom": {
            handler: function (value, old) {
                this.map.setZoom(value);
            },
        },*/
    },
};
</script>
<style>
.nav-link {
    color: #85088e;
}

#loading_container {
    color: white;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(-45deg, #470882, #5d37be, #5d57d4, #5082fe);
    background-size: 400% 400%;
    animation: gradient 5s ease infinite;
}

@keyframes gradient {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}
</style>