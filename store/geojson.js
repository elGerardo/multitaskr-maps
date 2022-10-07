export const state = () => ({
    geojson: [
        { lat: 33.169305, lng: -117.074993 },
        { lat: 33.169303, lng: -117.07489 },
        { lat: 33.169519, lng: -117.074884 },
        { lat: 33.169521, lng: -117.074987 },
        { lat: 33.169305, lng: -117.074993 },
    ],
});

export const getters = {
    geojson: (state) => state.geojson,
};
