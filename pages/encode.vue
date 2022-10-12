<template>
    
</template>
<script>
export default {
    created() {
        console.log("Json encoding...");

        let jsonContent = {
            frase1:"El cielo resplandece...",
            frase2:"a mi alrededor"
        }

        console.log("Json Content");
        console.log(jsonContent);

        let enconded = btoa(JSON.stringify(jsonContent));

        console.log("Enconded");
        console.log(enconded);

        let decoded = JSON.parse(atob(enconded));
        console.log("Decoded");
        console.log(decoded)

    },
}
</script>