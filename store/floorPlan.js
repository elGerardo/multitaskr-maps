export const state = () => ({
    /*floorPlan: {
        center: [-117.13549629960957, 32.55294661226159],
        coordinates: [
            [-117.076035095306, 32.60992921676056],
            [-117.076035095306, 32.609880962358176],
            [-117.07591739747306, 32.609880962358176],
            [-117.07591739747306, 32.60992921676056],
            [-117.076035095306, 32.60992921676056],
        ],
    },*/

    catalog: [
        {
            id: "adu_1",
            name: "ADU 1",
            description: "Description ADU 1",
            floorPlan: '{\n  "type": "FeatureCollection",\n  "features": [\n    {\n      "type": "Feature",\n      "properties": {},\n      "geometry": {\n        "coordinates": [\n          [\n            [\n              -117.076035095306,\n              32.60992921676056\n            ],\n            [\n              -117.076035095306,\n              32.609880962358176\n            ],\n            [\n              -117.07591739747306,\n              32.609880962358176\n            ],\n            [\n              -117.07591739747306,\n              32.60992921676056\n            ],\n            [\n              -117.076035095306,\n              32.60992921676056\n            ]\n          ]\n        ],\n        "type": "Polygon"\n      }\n    }\n  ]\n}'

        },
        {
            id: "adu_2",
            name: "ADU 2",
            description: "Description ADU 2",
            floorPlan: '{\n  "type": "FeatureCollection",\n  "features": [\n    {\n      "type": "Feature",\n      "properties": {},\n      "geometry": {\n        "coordinates": [\n          [\n            [\n              -117.0758987563481,\n              32.609948998628525\n            ],\n            [\n              -117.07580825866327,\n              32.609948998628525\n            ],\n            [\n              -117.07580825866327,\n              32.609991848390564\n            ],\n            [\n              -117.0758987563481,\n              32.609991848390564\n            ],\n            [\n              -117.0758987563481,\n              32.609948998628525\n            ]\n          ]\n        ],\n        "type": "Polygon"\n      }\n    }\n  ]\n}'
        },
        {
            id: "adu_3",
            name: "ADU 3",
            description: "Description ADU 3",
            floorPlan: '{\n  "type": "FeatureCollection",\n  "features": [\n    {\n      "type": "Feature",\n      "properties": {},\n      "geometry": {\n        "coordinates": [\n          [\n            [\n              -117.07589969749372,\n              32.60994585586276\n            ],\n            [\n              -117.07589969749372,\n              32.60991942720922\n            ],\n            [\n              -117.07581577363476,\n              32.60991942720922\n            ],\n            [\n              -117.07581577363476,\n              32.60994585586276\n            ],\n            [\n              -117.07589969749372,\n              32.60994585586276\n            ]\n          ]\n        ],\n        "type": "Polygon"\n      }\n    }\n  ]\n}'
        },
    ],

    floorPlan:
        '{\n  "type": "FeatureCollection",\n  "features": [\n    {\n      "type": "Feature",\n      "properties": {},\n      "geometry": {\n        "coordinates": [\n          [\n            [\n              -117.076035095306,\n              32.60992921676056\n            ],\n            [\n              -117.076035095306,\n              32.609880962358176\n            ],\n            [\n              -117.07591739747306,\n              32.609880962358176\n            ],\n            [\n              -117.07591739747306,\n              32.60992921676056\n            ],\n            [\n              -117.076035095306,\n              32.60992921676056\n            ]\n          ]\n        ],\n        "type": "Polygon"\n      }\n    }\n  ]\n}',
});

export const getters = {
    floorPlan: (state) => state.floorPlan,
    catalog: (state) => state.catalog
};

export const mutations = {
    floorPlan(state, data) {
        state.floorPlan = data;
    },
};

export const actions = {
    async find({ commit }, adu_id) {
        let collection;
        if (adu_id == "adu_1") {
            collection =
                '{\n  "type": "FeatureCollection",\n  "features": [\n    {\n      "type": "Feature",\n      "properties": {},\n      "geometry": {\n        "coordinates": [\n          [\n            [\n              -117.076035095306,\n              32.60992921676056\n            ],\n            [\n              -117.076035095306,\n              32.609880962358176\n            ],\n            [\n              -117.07591739747306,\n              32.609880962358176\n            ],\n            [\n              -117.07591739747306,\n              32.60992921676056\n            ],\n            [\n              -117.076035095306,\n              32.60992921676056\n            ]\n          ]\n        ],\n        "type": "Polygon"\n      }\n    }\n  ]\n}';
        }
        if (adu_id == "adu_2") {
            collection =
                '{\n  "type": "FeatureCollection",\n  "features": [\n    {\n      "type": "Feature",\n      "properties": {},\n      "geometry": {\n        "coordinates": [\n          [\n            [\n              -117.0758987563481,\n              32.609948998628525\n            ],\n            [\n              -117.07580825866327,\n              32.609948998628525\n            ],\n            [\n              -117.07580825866327,\n              32.609991848390564\n            ],\n            [\n              -117.0758987563481,\n              32.609991848390564\n            ],\n            [\n              -117.0758987563481,\n              32.609948998628525\n            ]\n          ]\n        ],\n        "type": "Polygon"\n      }\n    }\n  ]\n}';
        }
        if (adu_id == "adu_3") {
            collection =
                '{\n  "type": "FeatureCollection",\n  "features": [\n    {\n      "type": "Feature",\n      "properties": {},\n      "geometry": {\n        "coordinates": [\n          [\n            [\n              -117.07589969749372,\n              32.60994585586276\n            ],\n            [\n              -117.07589969749372,\n              32.60991942720922\n            ],\n            [\n              -117.07581577363476,\n              32.60991942720922\n            ],\n            [\n              -117.07581577363476,\n              32.60994585586276\n            ],\n            [\n              -117.07589969749372,\n              32.60994585586276\n            ]\n          ]\n        ],\n        "type": "Polygon"\n      }\n    }\n  ]\n}';
        }
        await commit("floorPlan", collection);
    },
};
