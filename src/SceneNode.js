import ROSLIB from 'roslib';
import * as THREE from 'three'

export default class SceneNode extends THREE.Object3D {
    constructor(options) {
        super();
        options = options || {};
        this.tfClient = options.tfClient;
        this.frameID = options.frameID || null;
        let object = options.object;
        this.pose = options.pose || new ROSLIB.Pose();
        this.visible = false;
        this.add(object);
        this.updatePose(this.pose);
        this.tfClient.subscribe(this.frameID, this.tfUpdate);
    }

    tfUpdate(msg) {
        var tf = new ROSLIB.Transform(msg);
        var poseTransformed = new ROSLIB.Pose(this.pose);
        poseTransformed.applyTransform(tf);
        this.updatePose(poseTransformed);
        this.visible = true;
    };

    updatePose(pose) {
        this.position.set(pose.position.x, pose.position.y, pose.position.z);
        this.quaternion.set(pose.orientation.x, pose.orientation.y,
            pose.orientation.z, pose.orientation.w);
        this.updateMatrixWorld(true);
    };

    unsubscribeTf() {
        this.tfClient.unsubscribe(this.frameID, this.tfUpdate);
    };

}