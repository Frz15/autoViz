import * as THREE from 'three'

class YellowSolideLine {
    constructor(arr) {

        this.shape1 = new THREE.Shape();
        this.width = 0.2;
        this.length = 0.01;
        this.shape1.moveTo(-this.length / 2, -this.width / 2);
        this.shape1.lineTo(this.length / 2, -this.width / 2);
        this.shape1.lineTo(this.length / 2, this.width / 2);
        this.shape1.lineTo(-this.length / 2, this.width / 2);
        this.shape1.lineTo(-this.length / 2, -this.width / 2);

        this.extrudeSettings = null;
        this.geometry = null;
        this.transverseLine = [];
        this.objects = new THREE.Group();
        this.materialSettings = {
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        };
        this.material = new THREE.MeshLambertMaterial(this.materialSettings);
        this.curve = new THREE.CatmullRomCurve3(arr);
        this.extrudeSettings = {
            steps: 100,
            bevelEnabled: true,
            extrudePath: this.curve
        };
        this.geometry = new THREE.ExtrudeGeometry(this.shape1, this.extrudeSettings);
        let object = new THREE.Mesh(this.geometry, this.material);
        this.objects.add(object);
        this.object = object;
    }

}

export {YellowSolideLine}