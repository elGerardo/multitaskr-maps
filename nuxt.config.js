export default {
    // Global page headers: https://go.nuxtjs.dev/config-head
    ssr: false, //server side render
    head: {
        title: "Mapbox App",
        htmlAttrs: {
            lang: "en",
        },
        meta: [
            { charset: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            { hid: "description", name: "description", content: "" },
            { name: "format-detection", content: "telephone=no" },
        ],
        link: [
            { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        ],
        script: [
        ],
    },

    // Global CSS: https://go.nuxtjs.dev/config-css
    css: [],

    // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
    plugins: [
        {
            src: "~/plugins/imports/mapboxgls.js",
        },
        {
          src: "~/plugins/imports/mapboxsearch.js",
        },
        {
          src: "~/plugins/imports/geocode.js",
        },
        {
            src: "~/plugins/imports/geocoding.js",
        },
        {
            src: "~/plugins/imports/mapboxdraw.js",
        },
        {
            src: "~/plugins/imports/three.js",
        },
        {
            src: "~/plugins/imports/gltfLoader.js",
        },
        {
            src: "~/plugins/imports/turf.js",
        },
    ],

    // Auto import components: https://go.nuxtjs.dev/config-components
    components: true,

    // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
    buildModules: [
    ],

    // Modules: https://go.nuxtjs.dev/config-modules
    modules: [
        // https://go.nuxtjs.dev/bootstrap
        "bootstrap-vue/nuxt",
        "@nuxtjs/axios",
    ],

    // Build Configuration: https://go.nuxtjs.dev/config-build
    build: {},
};
