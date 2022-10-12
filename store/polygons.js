export const state = () => ({
    polygon: {},
});

export const getters = {
    polygon: (state) => state.polygon,
};

export const mutations = {
    polygon(state, data) {
        state.polygon = data;
    },
};

export const actions = {
    async find({ commit }, params) {
        let response = await this.$axios.get(
            "https://seal-app-x5cdr.ondigitalocean.app/polygons/" +
                params.lng +
                "/" +
                params.lat +
                ""
        );
        commit("polygon", response.data);
    },
};
