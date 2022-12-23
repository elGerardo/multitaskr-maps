<template>
    <div :class="[$style.content, 'w-100']">
        <div id="map" :class="[$style.map, 'position-relative']">
            <canvas id="map_canvas" :class="[$style.map_canvas]"></canvas>
        </div>
        <div :class="[$style.sideBar, 'p-3']">
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

            <div v-if="!isLoading">
                <div v-for="item of catalog" :key="item.id">
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
                                                    item.floorPlan,
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
                                            item.floorPlan,
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
        </div>
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
                isRotating: false,
            },
            isCanvasRotating: false,
            currentX: 0,
            currentY: 0,
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

            this.map.on("mousedown", "transform_floor_plan", (e) => {
                e.preventDefault();
                this.adu.isMoving = true;
                this.map.on("mousemove", "parcel_layer", (e) => {
                    if (this.adu.isMoving && !this.adu.isRotating) {
                        this.coordinates.lat = e.lngLat.lat;
                        this.coordinates.lng = e.lngLat.lng;
                        this.addPolygon(this.floorPlan, "floorPlan", e.lngLat);
                    }
                });
                this.map.on("mouseup", () => {
                    this.adu.isMoving = false;
                });
            });

            this.map.on("touchstart", "transform_floor_plan", (e) => {
                e.preventDefault();
                this.adu.isMoving = true;
                this.map.on("touchmove", "parcel_layer", (e) => {
                    if (this.adu.isMoving && !this.adu.isRotating) {
                        this.coordinates.lat = e.lngLat.lat;
                        this.coordinates.lng = e.lngLat.lng;
                        this.addPolygon(this.floorPlan, "floorPlan", e.lngLat);
                    }
                });
                this.map.on("touchend", () => {
                    this.adu.isMoving = false;
                });
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

                this.map.loadImage(
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRw2Sfx3WfWCkAx8xnzIrPBDHZvcqGxWKbNWCbgsrV3zA&s",
                    (error, image) => {
                        if (error) throw error;

                        this.map.addImage("rotate", image);
                    }
                );
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
                if (this.map.getLayer("parcel_layer"))
                    this.map.removeLayer("parcel_layer");
                if (this.map.getSource("parcel_source"))
                    this.map.removeSource("parcel_source");

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
                if (this.map.getLayer(`building_layer_${counter}`))
                    this.map.removeLayer(`building_layer_${counter}`);
                if (this.map.getSource(`building_source_${counter}`))
                    this.map.removeSource(`building_source_${counter}`);

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

                    this.addImageRotate();

                    return;
                }

                this.map.getSource("polygon_floorplan").setData(translatedPoly);
                this.map.getSource("point").setData(translatedPoly);
                return;
            }
        },

        addImageRotate(coordinates) {
            if (this.map.getLayer("points")) this.map.removeLayer("points");
            if (this.map.getSource("point")) this.map.removeSource("point");

            this.map.addSource("point", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: this.adu.polygonCoordinates[0],
                            },
                        },
                    ],
                },
            });

            // Add a layer to use the image to represent the data.
            this.map.addLayer({
                id: "points",
                type: "symbol",
                source: "point", // reference the data source
                layout: {
                    "icon-image": "rotate", // reference the image
                    "icon-size": 0.25,
                },
            });

            this.map.on("mousedown", "points", (e) => {
                e.preventDefault();
                this.adu.isRotating = true;
                this.map.on("mousemove", (e) => {
                    this.initRotate(e);
                });
                this.map.once("mouseup", () => {
                    this.adu.isRotating = false;
                    this.map.off("mousemove");
                });
            });

            this.map.on("touchstart", "points", (e) => {
                e.preventDefault();
                //                console.log("toucbing...");
                this.adu.isRotating = true;
                this.map.on("touchmove", (e) => {
                    this.initRotate(e);
                    //                    console.log("toucbing move...");
                });
                this.map.once("touchend", () => {
                    this.adu.isRotating = false;
                    this.map.off("touchmove");
                    //console.log("end...");
                });
            });
        },

        getOrientation() {
            //get center
            this.centerBound;

            //get bbox
            let parcelPolygon = this.$turf.polygon([this.geojsonArrays]);

            let bbox = this.$turf.bbox(parcelPolygon);
            let bboxPolygon = this.$turf.bboxPolygon(bbox);

            let geometry = bboxPolygon.geometry.coordinates[0];

            //get midpoints of each vertex
            //let midpoints = [];
            let higherDistance = 0;
            let center = 0;
            let dataDistances = [];
            for (let index = 0; index < geometry.length; index++) {
                //if the next is undefined take center of current and first
                if (geometry[index + 1] !== undefined) {
                    //center of current and next
                    let features = this.$turf.points([
                        geometry[index],
                        geometry[index + 1],
                    ]);
                    center = this.$turf.center(features);
                    //midpoints.push(center.geometry.coordinates);

                    let lineString = this.$turf.lineString([
                        [this.centerBound.lng, this.centerBound.lat],
                        center.geometry.coordinates,
                    ]);

                    let to = [this.centerBound.lng, this.centerBound.lat]; //lng, lat
                    let from = center.geometry.coordinates; //lng, lat
                    let options = {
                        units: "meters",
                    };
                    let distance = this.$turf.distance(to, from, options);
                    let floatDistance = distance;
                    if (parseInt(distance) >= higherDistance) {
                        higherDistance = parseInt(distance);

                        dataDistances.push({
                            midpoints: center.geometry.coordinates,
                            higherDistance: higherDistance,
                            floatDistance: floatDistance,
                        });
                    }

                    if (this.map.getLayer(`line-layer-${index}`))
                        this.map.removeLayer(`line-layer-${index}`);
                    if (this.map.getSource(`line-source-${index}`))
                        this.map.removeSource(`line-source-${index}`);

                    this.map.addSource(`line-source-${index}`, {
                        type: "geojson",
                        data: lineString,
                    });

                    this.map.addLayer({
                        id: `line-layer-${index}`,
                        type: "line",
                        source: `line-source-${index}`,
                        layout: {
                            "line-join": "round",
                            "line-cap": "round",
                        },
                        paint: {
                            "line-color": "#888",
                            "line-width": 8,
                        },
                    });

                    this.map.moveLayer(`line-layer-${index}`, "parcel_layer");
                }
            }

            let maximum;

            maximum = Math.max.apply(
                Math,
                dataDistances.map((item) => item.higherDistance)
            );

            dataDistances.forEach((item) => {
                if (item.higherDistance == maximum) {
                    new this.$mapboxgl.Marker({
                        color: "blue",
                        draggable: true,
                    })
                        .setLngLat(item.midpoints)
                        .addTo(this.map);
                }
            });

            maximum = Math.max.apply(
                Math,
                dataDistances.map((item) => item.floatDistance)
            );

            let findResult = dataDistances.find(
                (x) => x.floatDistance === maximum
            );

            new this.$mapboxgl.Marker({
                color: "red",
                draggable: true,
            })
                .setLngLat(findResult.midpoints)
                .addTo(this.map);
        },

        initRotate(e) {
            if (this.adu.isRotating) {
                let p2 = {
                    x: window.innerWidth,
                    y: window.innerHeight,
                };
                let p1;
                if (e.originalEvent.changedTouches == undefined) {
                    p1 = {
                        x: e.originalEvent.pageX,
                        y: e.originalEvent.pageY,
                    };
                } else {
                    p1 = {
                        x: e.originalEvent.changedTouches[0].pageX,
                        y: e.originalEvent.changedTouches[0].pageY,
                    };
                }

                let angleDeg =
                    (Math.atan2(p2.y / 2 - p1.y, p2.x / 2 - p1.x) * 180) /
                    Math.PI;
                let fullangle =
                    angleDeg < 0
                        ? Math.round(angleDeg) * -1 +
                          (180 - Math.round(angleDeg) * -1) * 2
                        : angleDeg;
                this.adu.rotate = fullangle;
            }
            //            });
        },

        deletePolygon(data, type) {
            if (type == "floorPlan") {
                let layer = data.layer;
                let source = data.source;
                console.log(data);

                //floorplan
                if (this.map.getLayer(layer.toString()))
                    this.map.removeLayer(layer.toString());
                if (this.map.getSource(source.toString()))
                    this.map.removeSource(source.toString());

                //image rotate
                if (this.map.getLayer("points")) this.map.removeLayer("points");
                if (this.map.getSource("point")) this.map.removeSource("point");

                return;
            }
        },

        async getParcel() {
            await this.$store.dispatch("polygons/find", this.coordinates);
            if (this.polygon.parcel_id !== this.parcel.parcel_id) {
                this.deletePolygon(
                    {
                        layer: "transform_floor_plan",
                        source: "polygon_floorplan",
                    },
                    "floorPlan"
                );
                this.adu.canDelete = false;

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
                this.getOrientation();
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
                if (!this.adu.isMoving || !this.adu.isRotating) {
                    this.getParcel();
                    this.$router.push({
                        query: this.coordinates,
                    });
                }
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
