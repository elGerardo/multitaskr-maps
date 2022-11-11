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
                <!--<b-button id="setAdu">Set Adu</b-button>
                <b-form-spinbutton
                    v-model="modelConfig.rotate"
                    id="sb-wrap"
                    wrap
                    step="20"
                    min="0"
                    max="360"
                    placeholder="rotate"
                    style="width: 350px"
                ></b-form-spinbutton>-->
                <b-button @click="movingFloorplan = true"
                    >Move Floorplan</b-button
                >
                <span v-show="!allowedADU" class="badge badge-danger"
                    >Can't set ADU</span
                >
                <span v-show="allowedADU" class="badge badge-success"
                    >Success</span
                >
                <b-button @click="adu.rotate += 10">Rotate +</b-button>
                <b-button @click="adu.rotate -= 10">Rotate -</b-button>
            </div>
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
                                <p>{{ parcel.hover }}</p>
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
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

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
            centerBound: null,
            urlSourceParcel: "mapbox://martoast.citysandiego",
            sourceLayer: "citysandiego",
            tooltipId: null,
            hoveredStateId: null,
            modelTransform: null,
            modelAsMercatorCoordinate: null,
            modelRotate: null,
            modelAltitude: null,
            modelOrigin: null,
            floorPlanCoordinates: null,
            allowedADU: true,
            movingFloorplan: false,
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
            //Hover to parcels
            this.initHoverParcel();
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
            });

            //fetch to API when make a click
            this.map.on("click", (e) => {
                this.coordinates.lat = parseFloat(e.lngLat.lat);
                this.coordinates.lng = parseFloat(e.lngLat.lng);
                this.config.zoom = this.map.getZoom();
                this.getAddress(); // show info in sidebar
                this.getPolygons(e.lngLat); // pint parcel selected
            });

            //zoom event
            this.map.on("zoom", (e) => {
                this.config.zoom = this.map.getZoom();
            });

            this.map.on("style.load", () => {
                this.initSources();

                this.initSearch();
                //first time the page is loaded
                this.getPolygons(this.coordinates);

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
                    //let model3d = this.map.getLayer("3d-model");
                    //console.log(model3d);

                    let polygon1 = this.$turf.polygon(
                        [
                            [
                                [128, -26],
                                [141, -26],
                                [141, -21],
                                [128, -21],
                                [128, -26],
                            ],
                        ],
                        {
                            fill: "#F00",
                            "fill-opacity": 0.1,
                        }
                    );

                    var polygon2 = this.$turf.polygon(
                        [
                            [
                                [126, -28],
                                [140, -28],
                                [140, -20],
                                [126, -20],
                                [126, -28],
                            ],
                        ],
                        {
                            fill: "#00F",
                            "fill-opacity": 0.1,
                        }
                    );

                    var difference = this.$turf.difference(polygon1, polygon2);
                    //if the result is null
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

                this.map.once("idle", (e) => {
                    this.initMarker();
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

        initMarker() {
            //creating marker
            //it used to get x and y positions and then
            //take the parcel information
            this.marker = new this.$mapboxgl.Marker({
                color: "blue",
                draggable: true,
            })
                .setLngLat([this.coordinates.lng, this.coordinates.lat])
                .addTo(this.map);

            this.marker.remove();

            /*
            let contentLayer = this.map.getLayer("sandiego_parcels");

            let contentRender = this.map.queryRenderedFeatures(
                this.marker._pos,
                {
                    layers: ["sandiego_parcels"],
                }
            );
            */
        },

        addFloorPlanADU(coordinates) {
            this.adu.centerCoordinates = coordinates;

            //ADU size
            let polygon = this.$turf.polygon([
                [
                    [-117.18605148256043, 32.83737944284863],
                    [-117.18605148256043, 32.83741344284863],
                    [-117.18611548256044, 32.83741344284863],
                    [-117.18611548256044, 32.83737944284863],
                    [-117.18605148256043, 32.83737944284863],
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
                this.adu.rotate,
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

            //first time is added
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
                        "fill-color": "blue",
                    },
                    layout: {},
                });
                /*
                this.map.moveLayer(
                    "transform_floor_plan",
                    "building-extrusion"
                );

                this.map.moveLayer("transform_floor_plan", "maineselected");
*/
                return;
            }

            this.map.getSource("polygon_floorplan").setData(translatedPoly);

            let floorplanSource = this.map.getSource("polygon_floorplan");

            this.floorPlanCoordinates =
                floorplanSource._data.geometry.coordinates[0];

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
                    this.marker.remove();
                    console.log(this.adu.polygonCoordinates);
                    console.log(this.building.coordinates);

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
                        console.log(intersection);
                        if (intersection) {
                            console.log("intersection");
                            console.log(intersection);
                            this.allowedADU = false;
                            finishLoop = true;
                            return;
                        }
                    }

                    if (contentRenderBuilding.length > 0) {
                        this.allowedADU = false;
                        finishLoop = true;
                        return;
                    }
                    if (contentRender.length === 0) {
                        this.allowedADU = false;
                        finishLoop = true;
                        return;
                    }

                    if (
                        this.polygon.parcel_id !=
                        contentRender[0].properties.parcel_id
                    ) {
                        this.allowedADU = false;
                        finishLoop = true;
                        return;
                    }
                }
            });
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
                    console.log("contentRenderBuildings");

                    this.building.coordinates =
                        contentRenderBuildings[0].geometry.coordinates[0];
                    console.log(
                        contentRenderBuildings[0].geometry.coordinates[0]
                    );
                    index = grid.features.length;
                }
            }
        },

        add3dModel() {
            this.modelOrigin = [this.$route.query.lng, this.$route.query.lat];
            //let modelOrigin = [-117.02390122960196, 32.58871798986128]
            this.modelAltitude = 0;
            this.modelRotate = [Math.PI / 2, 0, 0];

            this.modelAsMercatorCoordinate =
                this.$mapboxgl.MercatorCoordinate.fromLngLat(
                    this.modelOrigin,
                    this.modelAltitude
                );

            // transformation parameters to position, rotate and scale the 3D model onto the map
            this.modelTransform = {
                translateX: this.modelAsMercatorCoordinate.x,
                translateY: this.modelAsMercatorCoordinate.y,
                translateZ: this.modelAsMercatorCoordinate.z,
                rotateX: this.modelRotate[0],
                rotateY: this.modelRotate[1],
                rotateZ: this.modelRotate[2],
                /* Since the 3D model is in real world meters, a scale transform needs to be
                 * applied since the CustomLayerInterface expects units in MercatorCoordinates.
                 */
                scale: this.modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
            };

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
                        fbx.scale.set(0.02, 0.02, 0.02);
                        fbx.position.set(-37, 0, 20);
                        this.modelConfig.scene.add(fbx);
                    });

                    document
                        .getElementById("setAdu")
                        .addEventListener("click", () => {
                            let init = true;
                            let onBuilding = false;

                            this.map.moveLayer(
                                "maineSelected",
                                "building-extrusion"
                            );

                            this.map.on(
                                "mouseenter",
                                "building-extrusion",
                                (e) => {
                                    //                                    console.log("inside the bulding...");
                                    onBuilding = true;
                                }
                            );

                            this.map.on(
                                "mouseleave",
                                "building-extrusion",
                                (e) => {
                                    //                                    console.log("outnside the bulding...");
                                    onBuilding = false;
                                }
                            );

                            this.map.on("mousemove", "maineSelected", (e) => {
                                if (init && !onBuilding) {
                                    this.modelAsMercatorCoordinate =
                                        this.$mapboxgl.MercatorCoordinate.fromLngLat(
                                            [e.lngLat.lng, e.lngLat.lat],
                                            this.modelAltitude
                                        );

                                    this.modelLngLat.lat = e.lngLat.lat;
                                    this.modelLngLat.lng = e.lngLat.lng;

                                    this.modelTransform = {
                                        translateX:
                                            this.modelAsMercatorCoordinate.x,
                                        translateY:
                                            this.modelAsMercatorCoordinate.y,
                                        translateZ:
                                            this.modelAsMercatorCoordinate.z,
                                        rotateX: this.modelRotate[0],
                                        rotateY: this.modelRotate[1],
                                        rotateZ: this.modelRotate[2],

                                        scale: this.modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
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

            if (this.parcel.selected != this.polygon.parcel_id) {
                this.parcel.selected = this.polygon.parcel_id;

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

                this.addFloorPlanADU(this.centerBound);

                this.addParcelPointGrid(this.geojsonArrays);

                this.map.moveLayer(
                    "transform_floor_plan",
                    "building-extrusion"
                );

                this.map.moveLayer("maineSelected", "transform_floor_plan");
            }
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

            /*this.map.easeTo({
                center: center.getCenter(),
                speed: 2,
                duration: 2500,
                curve: 2,
            });*/

            //this.map.fitBounds(bounds, {});
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
        "modelConfig.rotate": {
            handler(value, old) {
                this.modelAsMercatorCoordinate =
                    this.$mapboxgl.MercatorCoordinate.fromLngLat(
                        [this.modelLngLat.lng, this.modelLngLat.lat],
                        this.modelAltitude
                    );

                this.modelTransform = {
                    translateX: this.modelAsMercatorCoordinate.x,
                    translateY: this.modelAsMercatorCoordinate.y,
                    translateZ: this.modelAsMercatorCoordinate.z,
                    rotateX: this.modelRotate[0],
                    rotateY: (value / 360) * 4,
                    rotateZ: this.modelRotate[2],

                    scale: this.modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
                };
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
                this.addFloorPlanADU(this.adu.centerCoordinates);
            },
        },

        "parcel.hover": debounce(async function (value, old) {
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
