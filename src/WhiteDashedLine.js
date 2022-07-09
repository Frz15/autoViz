import * as THREE from 'three'

class WhiteDashedLine {
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
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        };
        this.material = new THREE.MeshLambertMaterial(this.materialSettings);
        for(let i=0; i<Math.floor(arr.length/2)*2; i=i+2)
        {
            this.curve = new THREE.CatmullRomCurve3(arr.slice(i,i+2));
            this.extrudeSettings = {
                steps: 2,
                bevelEnabled: true,
                extrudePath: this.curve
            };
            this.geometry = new THREE.ExtrudeGeometry(this.shape1, this.extrudeSettings);
            let object = new THREE.Mesh(this.geometry, this.material);
            this.objects.add(object);
        }
    }

}

export {WhiteDashedLine}