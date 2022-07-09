import React from 'react';
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Button } from "antd"
import ROSLIB from "roslib"

const COORDINATES_WGS84 = 1;
const COORDINATES_BD09 = 5;

class Baidumap extends React.Component {

    constructor(props) {
        super(props)
        this.threeLayer = new window.mapvgl.ThreeLayer();
        this.projection = window.mapvgl.MercatorProjection;
        this.point = this.projection.convertLL2MC(new window.BMapGL.Point(116.331, 40.0068));
        this.ros = new ROSLIB.Ros({
            url: 'ws://localhost:9090'
        });

        const loader = new GLTFLoader();
        loader.load('../../ego.gltf',
            this.handleGLTFLoader
        );
        this.axesHelper = new THREE.AxesHelper(5);
        this.axesHelper.position.x = this.point.lng;
        this.axesHelper.position.y = this.point.lat;

        this.light = new THREE.AmbientLight(0x404040);

        this.directionalLight = new THREE.DirectionalLight(0xffffff);
        this.hemispherelight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        this.directionalLight.position.set(this.point.lng, this.point.lat, 1000).normalize();
        this.marker = null;
        this.startPoint = null;
        this.endPoint = null;
        this.lng = 0;
        this.lat = 0;
        this.convertor = new window.BMapGL.Convertor();
    }

    handleGLTFLoader = (object) => {
        this.object = object.scene;
        this.threeLayer.add(this.object);
        this.object.position.x = this.point.lng;
        this.object.position.y = this.point.lat;
        this.object.position.z = 0;
        let rotation = new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ');
        let quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(rotation);
        this.object.quaternion.x = quaternion.x;
        this.object.quaternion.y = quaternion.y;
        this.object.quaternion.z = quaternion.z;
        this.object.quaternion.w = quaternion.w;
    }

    componentDidMount() {
        this.map = new window.BMapGL.Map("allmap");
        this.map.centerAndZoom(new window.BMapGL.Point(116.34, 40.007), 16);
        this.map.enableScrollWheelZoom();
        var view = new window.mapvgl.View({
            map: this.map
        });
        view.addLayer(this.threeLayer);
        this.threeLayer.add(this.axesHelper);
        this.threeLayer.add(this.light);
        this.threeLayer.add(this.directionalLight);
        this.threeLayer.add(this.hemispherelight);
        this.animate()
    }

    animate = () => {
        if (this.object && this.point2) {
            this.object.position.x = this.point2.lng;
            this.object.position.y = this.point2.lat;
            this.axesHelper.position.x = this.point2.lng;
            this.axesHelper.position.y = this.point2.lat;
            let rotation = new THREE.Euler(Math.PI / 2, Math.PI / 2 + this.yaw, 0, 'XYZ');
            let quaternion = new THREE.Quaternion();
            quaternion.setFromEuler(rotation);
            this.object.quaternion.x = quaternion.x;
            this.object.quaternion.y = quaternion.y;
            this.object.quaternion.z = quaternion.z;
            this.object.quaternion.w = quaternion.w;
        }
        this.threeLayer.add(this.object);
        requestAnimationFrame(this.animate);
    }

    showEgo = () => {
        this.listener_pose = new ROSLIB.Topic({
            ros: this.ros,
            name: "/hmi/ego_pose",
            messageType: "bag_transformer/ego_pose"
        });

        this.listener_pose.subscribe((msg) => {
            this.lng = msg.longitude
            this.lat = msg.latitude
            this.yaw = msg.yaw
        })

        setInterval(() => {
            let ggPoint = new window.BMapGL.Point(this.lng, this.lat);
            var pointArr = [];
            pointArr.push(ggPoint);
            this.convertor.translate(pointArr, COORDINATES_WGS84, COORDINATES_BD09, this.translateCallback)
        }, 100)
    }

    translateCallback = (data) => {
        this.point3 = new window.BMapGL.Point(data.points[0].lng, data.points[0].lat);
        this.point2 = this.projection.convertLL2MC(this.point3);
    }

    viewToEgo = () => {
        setInterval(() => {
            this.map.panTo(this.point3)
        }, 1000)
    }

    showStartPoint = () => {
        this.listener_pose2 = new ROSLIB.Topic({
            ros: this.ros,
            name: "/hmi/ego_pose",
            messageType: "bag_transformer/ego_pose"
        });
        this.listener_pose2.subscribe((msg) => {
            let point7 = new window.BMapGL.Point(msg.longitude, msg.latitude);
            this.map.clearOverlays();
            let pointArr2 = [];
            pointArr2.push(point7);
            this.convertor.translate(pointArr2, COORDINATES_WGS84, COORDINATES_BD09, this.trans)
            this.listener_pose2.unsubscribe();
        })
    }

    trans = (data) => {
        this.spoint = new window.BMapGL.Point(data.points[0].lng, data.points[0].lat);
        this.startPoint = this.projection.convertLL2MC(this.spoint);
        this.marker1 = new window.BMapGL.Marker(new window.BMapGL.Point(data.points[0].lng, data.points[0].lat));
        this.map.addOverlay(this.marker1);
        var opts = {
            width: 200,
            height: 100,
            title: '当前位置'
        };
        var infoWindow = new window.BMapGL.InfoWindow("当前经度为" + "\n 当前纬度为", opts);
        this.marker1.addEventListener('click', () => {
            this.map.openInfoWindow(infoWindow, this.spoint);
        });
    }

    handleMapClick = (e) => {
        this.endPoint = new window.BMapGL.Point(e.latlng.lng, e.latlng.lat);
        this.marker2 = new window.BMapGL.Marker(this.endPoint);
        this.map.addOverlay(this.marker2)
        this.map.removeEventListener('click', this.handleMapClick);
    }

    setEndPoint = () => {
        this.map.setTrafficOn();
        this.map.addEventListener('click', this.handleMapClick);
    }

    generatePath = () => {
        let driving = new window.BMapGL.DrivingRoute(this.map, { renderOptions: { map: this.map, autoViewport: true } });
        driving.search(this.spoint, this.endPoint);
    }

    render() {
        return (
            <>
                <div style={{ height: 800 }} id="allmap">
                </div>
                <Button onClick={this.showStartPoint} style={{marginLeft: 170}}>显示初始位置</Button>
                <Button onClick={this.setEndPoint} style={{marginLeft: 170}}>设置目的地</Button>
                <Button onClick={this.generatePath} style={{marginLeft: 170}}>生成路线</Button>
                <Button onClick={this.showEgo} style={{marginLeft: 170}}>显示车辆位置</Button>
                <Button onClick={this.viewToEgo} style={{marginLeft: 170}}>视角跟随车辆</Button>
            </>

        );
    }

}

export { Baidumap };