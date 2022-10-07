export const state = () => ({
    places: [],
});

export const getters = {
    places:(state) => state.places
};

export const mutations = {
    places(state, data) {
        state.places = data;
    },
};

export const actions = {
    async get({ commit }, params) {
        let response =
            await this.$axios.get("https://api.mapbox.com/geocoding/v5/mapbox.places/" +
            params.lng +
            "," +
            params.lat +
            ".json?access_token=" +
            params.access_token);
        commit("places", response.data.features);
    },
};
