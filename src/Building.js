import * as THREE from 'three'

export default class Building {
    constructor(arr) {

        this.shape1 = new THREE.Shape();
        this.width = 0.2;
        this.length = 0.01;
        this.shape1.moveTo(...arr[0]);
        for (let i = 1; i < arr.length; i++) {
            this.shape1.lineTo(...arr[i]);
        }
        this.shape1.lineTo(...arr[0]);

        this.extrudeSettings = null;
        this.geometry = null;
        this.transverseLine = [];
        this.objects = new THREE.Group();
        this.materialSettings = {
            color: 0x404040
        };
        this.material = new THREE.MeshLambertMaterial(this.materialSettings);
        this.curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.5)]);
        this.extrudeSettings = {
            steps: 300,
            bevelEnabled: true,
            bevelEnabled: true,
            bevelThickness: 5,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1,
            extrudePath: this.curve
        };
        this.geometry = new THREE.ExtrudeGeometry(this.shape1, this.extrudeSettings);
        let object = new THREE.Mesh(this.geometry, this.material);
        this.objects.add(object);
    }

}