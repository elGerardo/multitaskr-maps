<template>
    <div class="d-flex">
        <div :class="[$style.sideBar, 'w-25 p-3']">
            <b-card
                img-src=""
                img-width="200"
                img-alt="Card image"
                img-left
                :class="['mb-3']"
            >
                <b-card-text>
                    Some quick example text to build on the card and make up the
                    bulk of the card's content.
                </b-card-text>
            </b-card>
            <div :class="['d-flex justify-content-center align-items-center']">
                <div :class="['w-75']"><p>ADU INFO</p></div>
                <div :class="['w-25']">
                    <button :class="[$style.primary_button]" @click="addFloorPlanADU(coordinates)">Set ADU</button>
                </div>
            </div>

            <hr />
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
            adu: {
                centerCoordinates: null,
                polygonCoordinates: null,
                rotate: 0,
                isMoving: false,
                isAllowed: true,
                isADUSet: false,
            },
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

            this.map.on("load", () => {
                this.getPolygon();
            });
        },

        async getPolygon() {
            await this.$store.dispatch("polygons/find", this.coordinates);

            let itemsArrays = JSON.parse(this.polygon.geojson).coordinates;
            this.geojsonArrays = [];

            itemsArrays[0].forEach((item) => {
                let itemArray = [item[1], item[0]];
                this.geojsonArrays.push(itemArray);
            });

            this.centeredView();

            this.setPolygonLimits(this.geojsonArrays, "parcel");
            this.addParcelPointGrid(this.geojsonArrays);

            this.addParcelDifference(
                this.selectedBuildingGeometry,
                this.selectedParcelgGeometry
            );
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

            //            this.map.moveLayer("transform_floor_plan", "building-extrusion");

            /*let floorplanSource = this.map.getSource("polygon_floorplan");

            this.floorPlanCoordinates =
                floorplanSource._data.geometry.coordinates[0];*/

            return;
        },


        addParcelDifference(building, parcel) {
            console.log(
                parcel.geometry.coordinates[0],
                building.geometry.coordinates[0]
            );

            let parcelGeometry = this.$turf.polygon([parcel.geometry.coordinates[0]]);
            let buildingGeometry = this.$turf.polygon([building.geometry.coordinates[0]]);

            let difference = this.$turf.difference(parcelGeometry, buildingGeometry);

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
        },

        contentPointGrid(coordinates) {
            let polygon = this.$turf.polygon([coordinates]);
            let bbox = this.$turf.bbox(polygon);
            let cellSide = 5;
            let options = { units: "meters" };
            let grid = this.$turf.pointGrid(bbox, cellSide, options);
            let currentPitch = this.map.getPitch();

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
                    this.setPolygonLimits(
                        contentRenderBuildings[0].geometry.coordinates[0],
                        "building"
                    );
                }
            }
            this.map.setPitch(currentPitch);
        },

        async addParcelPointGrid(coordinates) {
            this.isLoading = true;
            await this.contentPointGrid(coordinates);
            this.isLoading = false;
        },

        setPolygonLimits(coordinates, type) {
            let polygon = this.$turf.polygon([coordinates]);

            if (type == "parcel") {
                if (!this.map.getSource("parcel_limits")) {
                    let scaledPoly = this.$turf.transformScale(polygon, 0.9, {
                        units: "meters",
                    });

                    this.selectedParcelgGeometry = scaledPoly;

                    this.map.addSource("parcel_limits", {
                        type: "geojson",
                        data: scaledPoly,
                    });

                    this.map.addLayer({
                        id: "parcel_limits_line",
                        type: "line",
                        source: "parcel_limits",
                        paint: {
                            "line-color": "#4d04af",
                            "line-width": 3,
                        },
                    });
                }
                return;
            }

            if (!this.map.getSource("building_limits")) {
                let scaledPoly = this.$turf.transformScale(polygon, 1.5, {
                    units: "meters",
                });

                this.selectedBuildingGeometry = scaledPoly;

                this.map.addSource("building_limits", {
                    type: "geojson",
                    data: scaledPoly,
                });

                this.map.addLayer({
                    id: "building_limits_line",
                    type: "line",
                    source: "building_limits",
                    paint: {
                        "line-color": "#1e0c36",
                        "line-width": 3,
                    },
                });
            }
            return;
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
                this.getPolygon();
                this.$router.push({
                    query: this.coordinates,
                });
            },
        },
    },
};
</script>
<style module>
@import url(./build.module.css);
</style>
