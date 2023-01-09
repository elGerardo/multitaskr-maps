<template>
  <b-container>
    <form
      @submit.prevent="onSubmit"
      class="d-flex justify-content-center align-items-center"
      style="height: 100vh"
    >
      <div>
        <b-img
          src="/mk_logo.png"
          fluid
          alt="Responsive image"
        ></b-img>
        <b-row class="my-5">
          <div
            style="
              color: #c6c6c6;
              width: 10%;
              border-top: 1px solid #c6c6c6;
              border-bottom: 1px solid #c6c6c6;
              border-left: 1px solid #c6c6c6;
              border-right: none;
              border-radius: 10px 0 0 10px;
            "
            class="d-flex justify-content-center align-items-center"
          >
            <b-icon icon="search"></b-icon>
          </div>
          <input
            style="
              width: 70%;
              height: 40px;
              border-top: 1px solid #c6c6c6;
              border-bottom: 1px solid #c6c6c6;
              border-left: none;
              border-right: none;
              border-radius: none;
            "
            name="address"
            placeholder="search address..."
            autocomplete="shipping address-line1"
            v-model="form.address"
            required
            id="address"
          />
          <button
            type="submit"
            class="d-flex justify-content-center align-items-center"
            style="
              width: 20%;
              background-color: #4d04af;
              border: 1px solid #4d04af;
              border-radius: 0 10px 10px 0;
              color: white;
            "
          >
            <span class="mx-2">Go</span
            ><b-icon icon="arrow-right-circle-fill"></b-icon>
          </button>
        </b-row>
      </div>
    </form>
  </b-container>
</template>
<script>
import Vue from "vue";
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
        console.log(event);
        this.coordinates.lat = event.detail.features[0].geometry.coordinates[1];
        this.coordinates.lng = event.detail.features[0].geometry.coordinates[0];
      });

    },

    onSubmit() {
      this.$router.push({
        path: "map",
        query: this.coordinates,
      });
    },
  },
};
</script>
<style>
input:focus,
textarea:focus,
select:focus {
  outline: none;
}
</style>
