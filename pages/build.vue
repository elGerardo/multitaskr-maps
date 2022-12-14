<template>
    <div class="d-flex">
        <div :class="[$style.sideBar, 'w-25 p-3']">
            <!--
            <div>
                <b-card
                    img-src=""
                    img-width="200"
                    img-alt="Card image"
                    img-left
                    :class="['mb-3']"
                >
                    <b-card-text>
                        Some quick example text to build on the card and make up
                        the bulk of the card's content.
                    </b-card-text>
                </b-card>
                <div
                    :class="[
                        'd-flex justify-content-center align-items-center',
                    ]"
                >
                    <div :class="['w-75']"><p>ADU INFO</p></div>
                    <div :class="['w-25']">
                        <button
                            :class="[$style.primary_button]"
                            @click="
                                () => {
                                    adu.canDelete = !adu.canDelete;
                                    if (!adu.canDelete) {
                                        deletePolygon(
                                            {
                                                source: 'polygon_floorplan',
                                                layer: 'transform_floor_plan',
                                            },
                                            'floorPlan'
                                        );
                                        return;
                                    }
                                    addPolygon(
                                        floorPlan,
                                        'floorPlan',
                                        centerBound,
                                        null
                                    );
                                    return;
                                }
                            "
                        >
                            {{ adu.canDelete ? "Cancel" : "Set ADU" }}
                        </button>
                    </div>
                </div>
                <div v-if="adu.canDelete">
                    <button
                        :class="[
                            adu.isMoving
                                ? $style.primary_button_focus
                                : $style.primary_button,
                        ]"
                        @click="adu.isMoving = true"
                    >
                        Move ADU
                    </button>
                    <label
                        class="mt-3 d-block"
                        style="color: #747474"
                        for="rotate"
                        >Rotate ADU</label
                    >
                    <b-form-input
                        id="rotate"
                        v-model="adu.rotate"
                        type="range"
                        min="0"
                        step="10"
                        max="360"
                    ></b-form-input>
                </div>
            </div>
            <hr />
            -->
            <div
                v-if="isLoading"
                :class="[
                    `d-flex justify-content-center flex-direction-column mb-3`,
                ]"
            >
                <b-spinner label="Loading..."></b-spinner>
            </div>
            <p v-if="isLoading" :class="[`text-center`]">
                Loading ADU's Catalog...
            </p>
            <div v-if="!isLoading" v-for="item of catalog" :key="item.id">
                <b-card
                    img-src=""
                    img-width="200"
                    img-alt="Card image"
                    img-left
                    :class="['mb-3']"
                >
                    <b-card-text>
                        {{ item.description }}
                    </b-card-text>
                </b-card>
                <div
                    :class="[
                        'd-flex justify-content-center align-items-center',
                    ]"
                >
                    <div :class="['w-25']">
                        <button
                            :class="[$style.primary_button]"
                            @click="
                                () => {
                                    if (adu.currentId != item.id) {
                                        adu.canDelete = true;
                                    } else {
                                        adu.canDelete = false;
                                    }

                                    if (!adu.canDelete) {
                                        deletePolygon(
                                            {
                                                source: 'polygon_floorplan',
                                                layer: 'transform_floor_plan',
                                            },
                                            'floorPlan'
                                        );
                                        if (adu.currentId != item.id) {
                                            adu.canDelete = !adu.canDelete;
                                            addPolygon(
                                                floorPlan,
                                                'floorPlan',
                                                centerBound,
                                                null,
                                                item.id
                                            );
                                            return;
                                        }
                                        adu.currentId = null;
                                        return;
                                    }
                                    addPolygon(
                                        floorPlan,
                                        'floorPlan',
                                        centerBound,
                                        null,
                                        item.id
                                    );
                                    return;
                                }
                            "
                        >
                            {{
                                adu.canDelete && adu.currentId == item.id
                                    ? "Cancel"
                                    : "Set ADU"
                            }}
                        </button>
                    </div>
                </div>
                <div v-if="adu.canDelete && adu.currentId == item.id">
                    <button
                        :class="[
                            adu.isMoving
                                ? $style.primary_button_focus
                                : $style.primary_button,
                        ]"
                        @click="adu.isMoving = true"
                    >
                        Move ADU
                    </button>
                    <label
                        class="mt-3 d-block"
                        style="color: #747474"
                        for="rotate"
                        >Rotate ADU</label
                    >
                    <b-form-input
                        id="rotate"
                        v-model="adu.rotate"
                        type="range"
                        min="0"
                        step="10"
                        max="360"
                    ></b-form-input>
                </div>
                <hr />
            </div>
        </div>

        <div
            id="map"
            style="height: 100vh"
            :class="['w-75 position-relative']"
        ></div>
    </div>
</template>
<script>
import { mapGetters } from "vuex";

export default {
    data() {
        return {
            access_token:
                "pk.eyJ1IjoiZWxnZXJhcmRvIiwiYSI6ImNsOG90NjFtMzFucG0zeWw1YWRheTV5ZmYifQ.87BCgCSXpjLIHkqGsWUW7g",
            mapStyle: "mapbox://styles/elgerardo/clb6xongb001214t4cs6t4tr4",
            urlSourceParcel: "mapbox://martoast.citysandiego",
            sourceLayer: "citysandiego",
            config: {
                zoom: 19.5,
                mapPitch: 0,
                mapBearing: -17.6,
            },
            coordinates: {
                lng: this.$route.query.lng,
                lat: this.$route.query.lat,
            },
            parcel: {
                building: [],
                buildingsId: [],
                parcel_id: 0,
            },
            adu: {
                currentId: null,
                centerCoordinates: null,
                polygonCoordinates: null,
                rotate: 0,
                isMoving: false,
                isAllowed: true,
                isADUSet: false,
                canDelete: false,
            },
            isLoading: true,
            geojsonArrays: [],
            centerBound: null,
            selectedParcelgGeometry: null,
            selectedBuildingGeometry: null,
        };
    },

    mounted() {
        this.setupMap();
    },

    computed: {
        ...mapGetters({
            polygon: "polygons/polygon",
            floorPlan: "floorPlan/floorPlan",
            catalog: "floorPlan/catalog",
        }),
    },

    methods: {
        setupMap() {
            this.initMap();
        },

        initMap() {
            this.$mapboxgl.accessToken = this.access_token;
            this.map = new this.$mapboxgl.Map({
                container: "map",
                style: this.mapStyle,
                zoom: this.config.zoom,
                pitch: this.config.mapPitch,
                bearing: this.config.mapBearing,
                antialias: true,
                center: [this.coordinates.lng, this.coordinates.lat],
            });

            this.map.on("click", (e) => {
                this.coordinates.lat = parseFloat(e.lngLat.lat);
                this.coordinates.lng = parseFloat(e.lngLat.lng);
            });

            this.map.on("mousemove", "parcel_layer", (e) => {
                if (this.adu.isMoving) {
                    this.addPolygon(this.floorPlan, "floorPlan", e.lngLat);
                }
            });

            this.map.on("click", "parcel_layer", (e) => {
                if (this.adu.isMoving) {
                    this.adu.isMoving = false;
                }
            });

            this.map.on("load", async () => {
                await this.getParcel();
                this.map.once("idle", () => {
                    this.isLoading = false;
                });
            });
        },

        async addPolygon(
            geometry,
            type,
            coordinates,
            counter = 0,
            floorPlanId = null
        ) {
            if (type == "parcel") {
                let parcelPolygon = this.$turf.polygon([geometry]);

                this.map.addSource("parcel_source", {
                    type: "geojson",
                    data: parcelPolygon,
                });

                this.map.addLayer({
                    id: "parcel_layer",
                    type: "fill",
                    source: "parcel_source",
                    paint: {
                        "fill-color": "#4d04af",
                        "fill-opacity": 0.5,
                    },
                    layout: {},
                });
                this.map.moveLayer("building_base", "parcel_layer");
                return;
            }
            if (type == "buildings") {
                let buildingPolygon = this.$turf.polygon([geometry]);

                this.map.addSource(`building_source_${counter}`, {
                    type: "geojson",
                    data: buildingPolygon,
                });

                this.map.addLayer({
                    id: `building_layer_${counter}`,
                    type: "fill",
                    source: `building_source_${counter}`,
                    paint: {
                        "fill-color": "#7d7d7d",
                    },
                    layout: {},
                });
                this.map.moveLayer("building_base", "parcel_layer");
                return;
            }
            if (type == "floorPlan") {
                if (floorPlanId !== null) {
                    this.adu.currentId = floorPlanId;
                    await this.$store.dispatch("floorPlan/find", floorPlanId);
                    geometry = this.floorPlan;
                }

                let floorPlanGeometry = JSON.parse(geometry);

                let polygon = this.$turf.polygon(
                    floorPlanGeometry.features[0].geometry.coordinates
                );

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
                return;
            }
        },

        deletePolygon(data, type) {
            if (type == "floorPlan") {
                let layer = data.layer;
                let source = data.source;

                if (this.map.getLayer(layer.toString()))
                    this.map.removeLayer(layer.toString());
                if (this.map.getSource(source.toString()))
                    this.map.removeSource(source.toString());

                return;
            }
        },

        async getParcel() {
            await this.$store.dispatch("polygons/find", this.coordinates);
            if (this.polygon.parcel_id !== this.parcel.parcel_id) {
                this.parcel.parcel_id = this.polygon.parcel_id;
                let itemsArrays = JSON.parse(this.polygon.geojson).coordinates;
                this.geojsonArrays = [];

                itemsArrays[0].forEach((item) => {
                    let itemArray = [item[1], item[0]];
                    this.geojsonArrays.push(itemArray);
                });

                this.centeredView();
                this.addPolygon(this.geojsonArrays, "parcel");
                this.addParcelPointGrid(this.geojsonArrays);
            }
        },

        addSelectedParcel() {
            let parcelPolygon = this.$turf.polygon([this.geojsonArrays]);

            this.map.addSource("parcel_source", {
                type: "geojson",
                data: parcelPolygon,
            });

            this.map.addLayer({
                id: "parcel_layer",
                type: "fill",
                source: "parcel_source",
                paint: {
                    "fill-color": "#4d04af",
                    "fill-opacity": 0.5,
                },
                layout: {},
            });
            this.map.moveLayer("building_base", "parcel_layer");
        },

        addParcelDifference(building, parcel) {
            let parcelGeometry = this.$turf.polygon([
                parcel.geometry.coordinates[0],
            ]);
            let buildingGeometry = this.$turf.polygon([
                building.geometry.coordinates[0],
            ]);

            let difference = this.$turf.difference(
                parcelGeometry,
                buildingGeometry
            );

            this.map.addSource("parcel_difference", {
                type: "geojson",
                data: difference,
            });

            this.map.addLayer({
                id: "parcel_difference_fill",
                type: "fill",
                source: "parcel_difference",
                paint: {
                    "fill-color": "#15111b",
                    "fill-opacity": 0.5,
                },
            });

            let bbox = this.$turf.bbox(difference);
            let bboxLayer = this.$turf.bboxPolygon(bbox);

            this.map.addSource("bboxLayer", {
                type: "geojson",
                data: bboxLayer,
            });

            /*this.map.addLayer({
                id: "bboxLayer_layer",
                type: "line",
                source: "bboxLayer",
                paint: {
                    "line-color": "red",
                    "line-width": 2,
                },
            });*/

            let cellWidth = 1;
            let cellHeight = 0.05;

            let bufferedBbox = this.$turf.bbox(
                this.$turf.buffer(difference, cellWidth, { units: "meters" })
            );
            var cellSide = 2;
            var options = { units: "meters", mask: difference };

            var squareGrid = this.$turf.squareGrid(
                bufferedBbox,
                cellSide,
                options
            );

            this.map.addSource("parcel_difference_grid", {
                type: "geojson",
                data: squareGrid,
            });

            /*this.map.addLayer({
                id: "parcel_difference_fill_grid",
                type: "line",
                source: "parcel_difference_grid",
                paint: {
                    "line-color": "#04af15",
                    "line-width": 2,
                },
            });*/

            this.$turf.featureEach(
                squareGrid,
                (currentFeature, featureIndex) => {
                    let intersected = this.$turf.intersect(
                        squareGrid.features[0],
                        currentFeature
                    );
                    console.log(intersected);
                }
            );
        },

        contentPointGrid(coordinates) {
            this.parcel.buildings = [];
            this.parcel.buildingsId = [];
            let buildingCounter = 1;
            let polygon = this.$turf.polygon([coordinates]);
            let bbox = this.$turf.bbox(polygon);
            let cellSide = 5;
            let options = { units: "meters" };
            let grid = this.$turf.pointGrid(bbox, cellSide, options);
            let currentPitch = this.map.getPitch();
            //let buildingCounter = 1;
            this.map.setPitch(0);
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
                        layers: ["building_base"],
                    }
                );
                markerLoop.remove();
                if (contentRenderBuildings.length > 0) {
                    let buildingId =
                        contentRenderBuildings[0]._vectorTileFeature.id;
                    if (!this.parcel.buildingsId.includes(buildingId)) {
                        let belongsParcel = this.validateIntersection(
                            this.geojsonArrays,
                            contentRenderBuildings[0].geometry.coordinates[0],
                            "parcel_building"
                        );
                        if (belongsParcel) {
                            let geometry =
                                contentRenderBuildings[0].geometry
                                    .coordinates[0];
                            this.parcel.buildingsId.push(buildingId);
                            this.parcel.buildings.push({
                                buildingGeometry: geometry,
                            });
                            this.addPolygon(
                                geometry,
                                "buildings",
                                null,
                                buildingCounter
                            );
                            buildingCounter += 1;
                        }
                    }
                    /*let geometry =
                        contentRenderBuildings[0].geometry.coordinates[0];*/
                    //this.addPolygon(geometry, "building", buildingCounter);
                    //buildingCounter += 1;

                    /*this.setPolygonLimits(
                        contentRenderBuildings[0].geometry.coordinates[0],
                        "building"
                    );*/
                }
            }
            this.map.setPitch(currentPitch);
        },

        validateIntersection(firstGeometry, secondGeometry) {
            let poly1 = this.$turf.polygon([firstGeometry]);

            let poly2 = this.$turf.polygon([secondGeometry]);
            let isIntersected = this.$turf.intersect(poly1, poly2);
            return isIntersected;
        },

        async addParcelPointGrid(coordinates) {
            await this.contentPointGrid(coordinates);
        },

        centeredView() {
            let bounds = new this.$mapboxgl.LngLatBounds(
                this.geojsonArrays[0],
                this.geojsonArrays[0]
            );

            for (let coord of this.geojsonArrays) {
                bounds.extend(coord);
            }

            this.centerBound = bounds.getCenter();

            this.goToCurrentLocaton();
        },

        goToCurrentLocaton() {
            this.map.easeTo({
                center: this.centerBound,
                speed: 2,
                duration: 1000,
                curve: 2,
                zoom: 20,
            });
        },
    },

    watch: {
        coordinates: {
            deep: true,
            handler: function (value, old) {
                this.getParcel();
                this.$router.push({
                    query: this.coordinates,
                });
            },
        },
        "adu.rotate": {
            handler: function (value, old) {
                this.addPolygon(this.floorPlan, "floorPlan", this.coordinates);
            },
        },
    },
};
</script>
<style module>
@import url(./build.module.css);
</style>
