<template>
    <b-container>
        <form
            @submit.prevent="onSubmit"
            class="d-flex justify-content-center align-items-center"
            style="height: 100vh"
        >
            <div>
                <h3>Multitaskr Maps</h3>
                <b-row>
                    <b-col>
                        <b-form-input
                            style="width: 300px"
                            name="address"
                            placeholder="search address..."
                            autocomplete="shipping address-line1"
                            v-model="form.address"
                            required
                        ></b-form-input>
                    </b-col>
                    <b-col>
                        <b-button
                            type="submit"
                            style="background-color: #4d04af"
                        >
                            <span class="mx-2">Go</span
                            ><b-icon icon="arrow-right-circle-fill"></b-icon>
                        </b-button>
                    </b-col>
                </b-row>
            </div>
        </form>
    </b-container>
</template>
<script>
import Vue from "vue";

import { mapGetters } from "vuex";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
export default {
    data() {
        return {
            access_token:
                "pk.eyJ1IjoiZWxnZXJhcmRvIiwiYSI6ImNsOG90NjFtMzFucG0zeWw1YWRheTV5ZmYifQ.87BCgCSXpjLIHkqGsWUW7g",
            form: {
                address: null,
                apartment: null,
                city: null,
                state: null,
                country: null,
            },
            coordinates: {
                lat: 33.16944,
                lng: -117.07504,
            },
            search: {},
        };
    },

    mounted() {
        this.initSearch();
    },

    methods: {
        initSearch() {
            this.search = this.$search.autofill({
                accessToken: this.access_token,
                options: { country: "us" },
            });

            this.search.addEventListener("retrieve", (event) => {
                this.coordinates.lat =
                    event.detail.features[0].geometry.coordinates[1];
                this.coordinates.lng =
                    event.detail.features[0].geometry.coordinates[0];
                //this.loadSingleBuilding();
            });
        },

        onSubmit() {
            console.log("submiting...");

            this.$router.push({
                path: "map",
                query: this.coordinates,
            });
        },
    },
};
</script>
