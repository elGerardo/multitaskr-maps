import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default (context, inject) => {
    inject("GLTFLoader", GLTFLoader);
}