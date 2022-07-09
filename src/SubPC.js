import { Button, Input, Row, Col, Typography } from "antd";
import React from "react";
import ROSLIB from "roslib";
import * as THREE from "three";
import PointCloud2 from './PointCloud.js'
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader'

const { Title } = Typography

let quaternion_ego = new THREE.Quaternion();
let rotation_ego = new THREE.Euler(Math.PI / 2, Math.PI, 0, 'XYZ');
quaternion_ego.setFromEuler(rotation_ego);

class PointCloud extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            connected: false
        }
        this.ros = new ROSLIB.Ros({
            url: 'ws://127.0.0.1:9090'
        });
        this.tfClient = new ROSLIB.TFClient({
            ros: this.ros,
            fixedFrame: '/velodyne',
            angularThres: 0.01,
            transThres: 0.01
        });

    }

    componentDidMount() {
        this.container = document.querySelector('#container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(57, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 30);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.up.x = 0;
        this.camera.up.y = 0;
        this.camera.up.z = 1;
        this.camera.position.z = 5;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(new THREE.Color(0xffffff));
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target = new THREE.Vector3(0, 0, 0);
        this.orbitControls.autoRotate = false;
        this.clock = new THREE.Clock();
        this.ambientLight = new THREE.AmbientLight(0x606060);
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff);
        this.directionalLight.position.set(0, 0, 10).normalize();
        this.directionalLight2 = new THREE.DirectionalLight(0xffffff);
        this.directionalLight2.position.set(0, 0, -10).normalize();
        this.scene.add(this.directionalLight2);
        this.scene.add(this.directionalLight);

        const loader = new GLTFLoader();
        loader.load(
            '../../ego.gltf',
            (gltf) => {
                let s = gltf.scene;
                s.quaternion.set(quaternion_ego.x, quaternion_ego.y, quaternion_ego.z, quaternion_ego.w);
                s.position.set(0, 0, -3);
                this.scene.add(s);
            }
        )
        this.tick();
    }

    handleClick = () => {
        this.pc = new PointCloud2({
            ros: this.ros,
            rootObject: this.scene,
            topic: '/hmi/pointcloud',
            tfClient: this.tfClient,
            max_pts: 200000,
            colorsrc: 'intensity',
            colormap: (x) => {
                let x1 = x / 255
                let white = 0xffffff;
                let black = 0xff0000;
                let c = parseInt(x1 * (white - black))
                let d = c.toString(16)
                while (d.length < 6) {
                    d = '0' + d;
                }
                return new THREE.Color('#' + d)
            },
            material: { size: 0.05 }
        })
        this.pc.subscribe();
        this.setState({
            connected: true
        })
    }

    tick = () => {
        window.requestAnimationFrame(this.tick);
        let delta = this.clock.getDelta();
        this.orbitControls.update(delta);
        this.renderer.render(this.scene, this.camera);
        if(this.state.connected)
        {
            this.scene.add(this.pc.points.object);
        }
    }


    render() {
        return (
            <div>
                <div id="container" style={{ height: 750, width: "90%" }}></div>
                <br />
                <Row>
                    <Col span={7} offset={3}>
                        {!this.state.connected &&
                            <Title level={4}>请输入原始点云话题名称以订阅消息</Title>
                        }
                        {this.state.connected &&
                            <Title level={4} type="success">原始点云消息订阅成功</Title>
                        }
                    </Col>
                    <Col span={1.5}>
                        <Title level={5}>话题名称：</Title>
                    </Col>
                    <Col span={4}>
                        <Input placeholder="请输入话题名称"></Input>
                    </Col>
                    <Col span={4} offset={1}>
                        <Button type="primary" onClick={this.handleClick}>订阅消息</Button>
                    </Col>
                </Row>
            </div>
        )
    }
}

export { PointCloud }