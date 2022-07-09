import * as THREE from 'three'
import { DoubleSide } from "three";

export default class StraightArrow {
    constructor(options) {
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.rotation = options.rotation;
        this.color = options.color;
        let shape = new THREE.Shape();
        shape.moveTo(0.075, 0);
        shape.lineTo(0.075, 1.8);
        shape.lineTo(0.225, 1.8);
        shape.lineTo(0, 3);
        shape.lineTo(-0.225, 1.8);
        shape.lineTo(-0.075, 1.8);
        shape.lineTo(-0.075, 0);
        shape.lineTo(0, 0);
        this.shapeGeometry = new THREE.ShapeGeometry(shape);
        this.materialSettings = {
            color: this.color,
            side: DoubleSide
        }
        this.material = new THREE.MeshLambertMaterial(this.materialSettings);
        this.object = new THREE.Mesh(this.shapeGeometry, this.material);
        this.object.position.set(this.position.x, this.position.y, this.position.z);
        this.object.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    }

}