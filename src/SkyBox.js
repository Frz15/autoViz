import * as THREE from 'three'

export default class SkyBox{
    constructor(options) {
        this.length = options.length || 500;
        this.width = options.width || 50;
        this.height = options.height || 500;
        this.path = options.path || "../../";
        this.format = options.format || ".jpg";
        this.urls = options.urls || [
            this.path + 'right' + this.format, this.path + 'left' + this.format,
            this.path + 'top' + this.format,   this.path + 'ground4' + this.format,
            this.path + 'front' + this.format, this.path + 'back' + this.format
        ];
        this.materials = [];
        this.object = null;
        this.generate_materials();
        this.generate_object();
    }

    generate_materials() {
        for (let i = 0; i < this.urls.length; ++i) {
            let loader = new THREE.TextureLoader()
            let texture = loader.load(this.urls[i], function () { }, undefined, function () { })
            this.materials.push(new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide
            })
            )
        }
    };

    generate_object() {
        this.object = new THREE.Mesh(new THREE.BoxGeometry(this.length, this.width, this.height), this.materials);
        this.object.rotation.set(Math.PI / 2, 0, 0);
        this.object.position.set(0, 0, 24.9);
    }
}

