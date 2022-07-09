import React from "react";
import * as THREE from "three";
import { Row, Col, Switch, Typography, Radio } from "antd"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { YellowSolideLine } from "./YellowSolideLine";
import { WhiteSolideLine } from "./WhiteSolideLine";
import { WhiteDashedLine } from "./WhiteDashedLine";
import { YellowDashedLine } from "./YellowDashedLine";
import { VirtualLine } from "./VirtualLine.js";
import { PointCloud3 } from "./SubPC2";
import PredictPath from "./PredictPath.js";
import ROSLIB from "roslib";
import DecisionPath from "./DecisionPath";

const { Title } = Typography;

let map_offset_x, map_offset_y;

map_offset_x = 250;
map_offset_y = -450;
let origin_x = 442158;
let origin_y = 4427554;

let quaternion_object = new THREE.Quaternion();
let quaternion_ego = new THREE.Quaternion();
let quaternion_gmap = new THREE.Quaternion();
let rotation_object, rotation_ego;
let rotation_gmap = new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ');
quaternion_gmap.setFromEuler(rotation_gmap);

let dividers_arr = [];

let cars = [];
let cyclists = [];
let people = [];
let trucks = [];

const car_num = 40;
const cyclist_num = 20;
const person_num = 40;
const truck_num = 20;

let objects_msg = null;


let view_length = 10;
let god_view_length = 30;
let hide_height = 1000;

const mode = "overtake";

if (mode === "stop2") {
    origin_y = 4427549;
}

const decision_path_num = 100;

const alert_distance = 4.0;

class Hmi extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            viewAngle: "god",
            showEgo: true,
            showObjects: true,
            showField: true,
            showLines: true,
            showDecisionPath: true,
            showObjectPath: true
        }
        this.scene = new THREE.Scene();
        this.uiScene = new THREE.Scene();
        this.orthoCamera = new THREE.OrthographicCamera(- 10, 10, 10, - 10, 10, 20);
        this.orthoCamera.position.set(0, 0, 10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(new THREE.Color(0xffffff));
        this.renderer.shadowMap.enabled = true;
        this.clock = new THREE.Clock();
        this.scene.background = new THREE.Color().setHSL(0.6, 0, 1);
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
        this.hemiLight.color.setHSL(0.6, 1, 0.6);
        this.hemiLight.groundColor.setHSL(210 / 360, 0.126, 0.502);
        this.hemiLight.position.set(0, 0, 100);
        // this.scene.add(hemiLight);

        this.predict_paths = [];

        this.dividers_done = false;

        this.ros = new ROSLIB.Ros({
            url: 'ws://localhost:9090'
        });

        this.listener_dividers = new ROSLIB.Topic({
            ros: this.ros,
            name: "/hmi/dividers",
            messageType: "bag_transformer/dividers",
            queue_size: 0
        })

        this.listener_dividers.subscribe((msg) => {
            this.dividers = msg.dividers;
            this.listener_dividers.unsubscribe();
        })

        this.listener_objects = new ROSLIB.Topic({
            ros: this.ros,
            name: "/hmi/data",
            messageType: "bag_transformer/hmi_data",
            queue_size: 0
        })

        this.listener_objects.subscribe((msg) => {
            this.utm_x = msg.ego_utm_x;
            this.utm_y = msg.ego_utm_y;
            this.yaw = msg.ego_yaw;
            this.decision_point = msg.ego_decision_path;
            if (this.ego) {
                if (this.state.showEgo) {
                    this.ego.position.set(this.utm_x - origin_x + map_offset_x, this.utm_y - origin_y + map_offset_y, 0.1);
                    rotation_ego = new THREE.Euler(Math.PI / 2, Math.PI / 2 + this.yaw, 0, 'XYZ');
                    quaternion_ego.setFromEuler(rotation_ego);
                    this.ego.quaternion.set(quaternion_ego.x, quaternion_ego.y, quaternion_ego.z, quaternion_ego.w);
                } else {
                    this.ego.position.set(0, 0, hide_height);
                }
                if (this.state.viewAngle === "god") {
                    this.camera.position.set(this.utm_x - origin_x + map_offset_x + Math.sin(this.yaw) * god_view_length, this.utm_y - origin_y + map_offset_y - Math.cos(this.yaw) * god_view_length, 20);
                    this.orbitControls.target = new THREE.Vector3(this.utm_x - origin_x + map_offset_x, this.utm_y - origin_y + map_offset_y, 0);
                    this.camera.up.x = 0;
                    this.camera.up.y = 0;
                    this.camera.up.z = 1;
                } else if (this.state.viewAngle === "driver") {
                    this.camera.position.set(this.utm_x - origin_x + map_offset_x, this.utm_y - origin_y + map_offset_y, 3);
                    this.orbitControls.target = new THREE.Vector3(this.utm_x - origin_x + map_offset_x - Math.sin(this.yaw) * view_length, this.utm_y - origin_y + map_offset_y + Math.cos(this.yaw) * view_length, 0);
                    this.camera.up.x = 0;
                    this.camera.up.y = 0;
                    this.camera.up.z = 1;
                } else if (this.state.viewAngle === "updown") {
                    this.camera.position.set(this.utm_x - origin_x + map_offset_x, this.utm_y - origin_y + map_offset_y, 30);
                    this.orbitControls.target = new THREE.Vector3(this.utm_x - origin_x + map_offset_x, this.utm_y - origin_y + map_offset_y, 0);
                    this.camera.up.x = - Math.sin(this.yaw);
                    this.camera.up.y = Math.cos(this.yaw);
                }
            }
            objects_msg = msg.objects;
            if (this.state.showObjectPath && this.state.showObjects && msg.hasPredictPath) {
                let predict_path_num = this.predict_paths.length;
                for (let i = 0; i < objects_msg.length; i++) {
                    let predict_path_arr = [];
                    if (objects_msg[i].traj_predict.length > 1) {
                        for (let j = 0; j < objects_msg[i].traj_predict.length; j++) {
                            predict_path_arr.push(new THREE.Vector3(objects_msg[i].traj_predict[j].utm_x - origin_x + map_offset_x, objects_msg[i].traj_predict[j].utm_y - origin_y + map_offset_y, 0.2));
                        }
                        if (i < predict_path_num) {
                            let predict_path = new PredictPath(predict_path_arr);
                            this.scene.remove(this.predict_paths[i]);
                            this.predict_paths[i] = predict_path.object;
                            this.scene.add(this.predict_paths[i]);
                        } else {
                            let predict_path = new PredictPath(predict_path_arr);
                            this.predict_paths.push(predict_path.object);
                            this.scene.add(this.predict_paths[this.predict_paths.length - 1]);
                        }
                    }
                }
                if (objects_msg.length < predict_path_num) {
                    for (let j = objects_msg.length; j < predict_path_num; j++) {
                        this.scene.remove(this.predict_paths[j]);
                    }
                }
            } else if ((!this.state.showObjectPath || !this.state.showObjects) && msg.hasPredictPath) {
                let predict_path_num = this.predict_paths.length;
                for (let i = 0; i < predict_path_num; i++) {
                    this.scene.remove(this.predict_paths[i]);
                }
            }
            if (cars.length === car_num && people.length === person_num && cyclists.length === cyclist_num && trucks.length === truck_num && objects_msg) {
                let car_id = 0;
                let person_id = 0;
                let cyclist_id = 0;
                let truck_id = 0;
                if (this.state.showObjects) {
                    for (let i = 0; i < objects_msg.length; i++) {
                        rotation_object = new THREE.Euler(Math.PI / 2, Math.PI / 2 + this.yaw + objects_msg[i].yaw, 0, 'XYZ');
                        quaternion_object.setFromEuler(rotation_object);
                        let object_ego_distance = 4.0;
                        for (let m = 0; m < objects_msg[i].traj_predict.length; m++) {
                            for (let n = 0; n < this.decision_point.length; n++) {
                                let object_ego_distance_2 = Math.sqrt(Math.pow(objects_msg[i].traj_predict[m].utm_x - this.decision_point[n].utm_x, 2) + Math.pow(objects_msg[i].traj_predict[m].utm_y - this.decision_point[n].utm_y, 2));
                                if (object_ego_distance_2 < object_ego_distance) {
                                    object_ego_distance = object_ego_distance_2;
                                }
                                let object_ego_distance_3 = Math.sqrt(Math.pow(objects_msg[i].traj_predict[m].utm_x - this.utm_x, 2) + Math.pow(objects_msg[i].traj_predict[m].utm_y - this.utm_y, 2));
                                if (object_ego_distance_3 < object_ego_distance) {
                                    object_ego_distance = object_ego_distance_3;
                                }
                            }
                        }
                        let object_opacity = (objects_msg[i].score - 0.95) * 20;
                        if (object_opacity < 0.3) {
                            object_opacity = 0.3;
                        }

                        if (objects_msg[i].type === 1 && person_id < person_num) {
                            people[person_id].quaternion.set(quaternion_object.x, quaternion_object.y, quaternion_object.z, quaternion_object.w);
                            people[person_id].position.set(objects_msg[i].utm_x - origin_x + map_offset_x, objects_msg[i].utm_y - origin_y + map_offset_y, 0.1);
                            people[person_id].children[0].material.opacity = object_opacity;
                            if (object_ego_distance < alert_distance) {
                                people[person_id].children[0].material.color = new THREE.Color(0xFF69B4);
                            } else {
                                people[person_id].children[0].material.color = new THREE.Color(0xFFFFFF);
                            }
                            person_id = person_id + 1;
                        } else if (objects_msg[i].type === 2 && cyclist_id < cyclist_num) {
                            cyclists[cyclist_id].quaternion.set(quaternion_object.x, quaternion_object.y, quaternion_object.z, quaternion_object.w);
                            cyclists[cyclist_id].position.set(objects_msg[i].utm_x - origin_x + map_offset_x, objects_msg[i].utm_y - origin_y + map_offset_y, 0.1);
                            cyclists[cyclist_id].children[0].material.opacity = object_opacity;
                            if (object_ego_distance < alert_distance) {
                                cyclists[cyclist_id].children[0].material.color = new THREE.Color(0xFF69B4);
                            } else {
                                cyclists[cyclist_id].children[0].material.color = new THREE.Color(0xFFFFFF);
                            }
                            cyclist_id = cyclist_id + 1;
                        } else if (objects_msg[i].type === 3 && car_id < car_num) {
                            cars[car_id].quaternion.set(quaternion_object.x, quaternion_object.y, quaternion_object.z, quaternion_object.w);
                            cars[car_id].position.set(objects_msg[i].utm_x - origin_x + map_offset_x, objects_msg[i].utm_y - origin_y + map_offset_y, 0.1);
                            cars[car_id].children[0].material.opacity = object_opacity;
                            if (object_ego_distance < alert_distance) {
                                cars[car_id].children[0].material.color = new THREE.Color(0xFF69B4);
                            } else {
                                cars[car_id].children[0].material.color = new THREE.Color(0xFFFFFF);
                            }
                            car_id = car_id + 1;
                        } else if (objects_msg[i].type === 4 && truck_id < truck_num) {
                            trucks[truck_id].quaternion.set(quaternion_object.x, quaternion_object.y, quaternion_object.z, quaternion_object.w);
                            trucks[truck_id].position.set(objects_msg[i].utm_x - origin_x + map_offset_x, objects_msg[i].utm_y - origin_y + map_offset_y, 0.1);
                            trucks[truck_id].children[0].material.opacity = object_opacity;
                            if (object_ego_distance < alert_distance) {
                                trucks[truck_id].children[0].material.color = new THREE.Color(0xFF69B4);
                            } else {
                                trucks[truck_id].children[0].material.color = new THREE.Color(0xFFFFFF);
                            }
                            truck_id = truck_id + 1;
                        }
                    }
                }

                for (let i = car_id; i < car_num; i++) {
                    cars[i].position.set(0, 0, hide_height);
                }
                for (let i = person_id; i < person_num; i++) {
                    people[i].position.set(0, 0, hide_height);
                }
                for (let i = cyclist_id; i < cyclist_num; i++) {
                    cyclists[i].position.set(0, 0, hide_height);
                }
                for (let i = truck_id; i < truck_num; i++) {
                    trucks[i].position.set(0, 0, hide_height);
                }
            }

            if (this.dividers && !this.dividers_done) {
                for (let i = 0; i < this.dividers.length; i++) {
                    let arr = [];
                    for (let j = 0; j < this.dividers[i].divider_points.length; j++) {
                        arr.push(new THREE.Vector3(this.dividers[i].divider_points[j].utm_x - origin_x + map_offset_x, this.dividers[i].divider_points[j].utm_y - origin_y + map_offset_y, 0.05));
                    }
                    if (this.dividers[i].type === 1) {
                        let divider_line = new WhiteSolideLine(arr);
                        this.scene.add(divider_line.object);
                        dividers_arr.push(divider_line.object);
                    } else if (this.dividers[i].type === 2) {
                        let divider_line = new WhiteDashedLine(arr);
                        this.scene.add(divider_line.objects);
                        dividers_arr.push(divider_line.objects);
                    } else if (this.dividers[i].type === 3) {
                        let divider_line = new YellowSolideLine(arr);
                        this.scene.add(divider_line.object);
                        dividers_arr.push(divider_line.object);
                    } else if (this.dividers[i].type === 4) {
                        let divider_line = new YellowDashedLine(arr);
                        this.scene.add(divider_line.objects);
                        dividers_arr.push(divider_line.objects);
                    } else if (this.dividers[i].type === 5) {
                        let divider_line = new VirtualLine(arr);
                        this.scene.add(divider_line.objects);
                        dividers_arr.push(divider_line.objects);
                    }
                }
                this.dividers_done = true;
            }
            if (this.decision_point) {
                if (this.state.showDecisionPath) {
                    // 规划轨迹
                    this.scene.remove(this.decision_path);
                    let arr = [];
                    for (let i = 0; i < decision_path_num; i++) {
                        arr.push(new THREE.Vector3(this.decision_point[i].utm_x - origin_x + map_offset_x, this.decision_point[i].utm_y - origin_y + map_offset_y, 0.2));
                    }
                    if (arr.length > 1) {
                        let decision_path = new DecisionPath(arr)
                        this.decision_path = decision_path.object;
                        this.decision_path.material.color = new THREE.Color(0.5, 0.5, 0.5);
                        this.scene.add(this.decision_path);
                    }
                } else {
                    this.scene.remove(this.decision_path);
                }
            }
        })
    }

    handleMsg = (message) => {
        this.image.src = 'data:image/jpeg;base64,' + message.data;
    }

    animate = () => {
        this.renderer.autoClear = false;
        this.renderer.render(this.scene, this.camera);
        let delta = this.clock.getDelta();
        this.orbitControls.update(delta);

        if (this.state.showLines) {
            dividers_arr.forEach((item, index) => {
                item.position.set(0, 0, 0);
            })
        } else {
            dividers_arr.forEach((item, index) => {
                item.position.set(0, 0, hide_height);
            })
        }

        requestAnimationFrame(this.animate);
        this.camera.updateProjectionMatrix();
    };

    componentDidMount() {
        this.camera = new THREE.PerspectiveCamera(57, document.querySelector("#container").clientWidth / document.querySelector("#container").clientHeight, 0.1, 8000);
        this.camera.up.x = 0;
        this.camera.up.y = 0;
        this.camera.up.z = 1;
        document.querySelector("#container").appendChild(this.renderer.domElement);
        this.renderer.setSize(document.querySelector("#container").clientWidth, document.querySelector("#container").clientHeight);
        console.log(document.querySelector("#container").clientWidth)
        const dirLight = new THREE.DirectionalLight(0x404040, 1);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(0, 1000, 1000);
        dirLight.position.multiplyScalar(1);
        this.scene.add(dirLight);

        const loader = new GLTFLoader();
        loader.load(
            '../../gmap.gltf',
            (gltf) => {
                let s = gltf.scene;
                s.quaternion.set(quaternion_gmap.x, quaternion_gmap.y, quaternion_gmap.z, quaternion_gmap.w);
                s.position.set(map_offset_x, map_offset_y, 0);
                this.scene.add(s);
            }
        )
        loader.load(
            '../../ego.gltf',
            (gltf) => {
                let s = gltf.scene;
                s.position.set(0, 5, 0);
                this.ego = s;
                this.scene.add(this.ego);
            })

        for (let i = 0; i < car_num; i++) {
            loader.load(
                '../../car.gltf',
                (gltf) => {
                    let s = gltf.scene;
                    cars.push(s);
                    s.position.set(0, 0, 50 + 3 * i);
                    this.scene.add(s);
                    s.traverse((gltf) => {
                        if (gltf.isMesh) {
                            gltf.material = new THREE.MeshLambertMaterial({
                                transparent: true
                            })
                        }
                    });
                }
            )
        }
        for (let i = 0; i < person_num; i++) {
            loader.load(
                '../../person.gltf',
                (gltf) => {
                    let s = gltf.scene;
                    s.children[0].material.transparent = true;
                    people.push(s);
                    s.position.set(0, 10, 50 + 3 * i);
                    this.scene.add(s);
                    s.traverse((gltf) => {
                        if (gltf.isMesh) {
                            gltf.material = new THREE.MeshLambertMaterial({
                                transparent: true
                            })
                        }
                    });
                }
            )
        }
        for (let i = 0; i < cyclist_num; i++) {
            loader.load(
                '../../person-bicycle.gltf',
                (gltf) => {
                    let s = gltf.scene;
                    s.children[0].material.transparent = true;
                    cyclists.push(s);
                    s.position.set(0, 15, 50 + 3 * i);
                    this.scene.add(s);
                    s.traverse((gltf) => {
                        if (gltf.isMesh) {
                            gltf.material = new THREE.MeshLambertMaterial({
                                transparent: true
                            })
                        }
                    });
                }
            )
        }
        for (let i = 0; i < truck_num; i++) {
            loader.load(
                '../../truck.gltf',
                (gltf) => {
                    let s = gltf.scene;
                    s.children[0].material.transparent = true;
                    trucks.push(s);
                    s.position.set(0, 5, 50 + 3 * i);
                    this.scene.add(s);
                    s.traverse((gltf) => {
                        if (gltf.isMesh) {
                            gltf.material = new THREE.MeshLambertMaterial({
                                transparent: true
                            })
                        }
                    });
                }
            )
        }

        // SKYDOME

        const vertexShader = "varying vec3 vWorldPosition; \n" +
        "void main() {\n" +
            "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );\n" +
            "vWorldPosition = worldPosition.xyz;\n" +
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n" +
        "}"
        const fragmentShader = "uniform vec3 topColor;\n" +
        "uniform vec3 bottomColor;\n" +
        "uniform float offset;\n" +
        "uniform float exponent;\n" +
        "varying vec3 vWorldPosition;\n" +
        "void main() {\n" +
            "float h = normalize( vWorldPosition + offset ).z;\n" +
            "gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );\n" +
        "}";
        const uniforms = {
            "topColor": { value: new THREE.Color(0x0077ff) },
            "bottomColor": { value: new THREE.Color(0xffffff) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        uniforms["topColor"].value.copy(this.hemiLight.color);

        // this.scene.fog.color.copy(uniforms["bottomColor"].value);

        const skyGeo = new THREE.SphereGeometry(1500, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target = new THREE.Vector3(-800, -400, 0);
        this.camera.position.set(-800, -400, 300);
        const axesHelper = new THREE.AxesHelper(500);
        axesHelper.position.set(0, 0, 3);
        this.scene.add(axesHelper);

        this.animate();

        this.image = document.getElementById('image');
        this.listener_image = new ROSLIB.Topic({
            ros: this.ros,
            name: "/hmi/image",
            messageType: 'sensor_msgs/CompressedImage',
            queue_size: 1
        });
        this.listener_image.subscribe(this.handleMsg);
    }

    radio_click = (e) => {
        this.setState({
            viewAngle: e.target.value
        })
    }

    handleContainerClick = (e) => {
        this.setState({
            viewAngle: "free"
        })
    }

    egoShow = (checked) => {
        this.setState({
            showEgo: checked
        })
    }

    objectsShow = (checked) => {
        this.setState({
            showObjects: checked
        })
    }

    linesShow = (checked) => {
        this.setState({
            showLines: checked
        })
    }

    decisionPathShow = (checked) => {
        this.setState({
            showDecisionPath: checked
        })
    }

    objectPathShow = (checked) => {
        this.setState({
            showObjectPath: checked
        })
    }

    render() {
        return (
            <div>
                <Row>
                    <Col span={17}>
                        <div id="container" onClick={this.handleContainerClick} style={{ width: '59vw', height: 850 }}>
                        </div>
                    </Col>
                    <Col span={7}>
                        <div style={{ width: '27vw'}}>
                            <img src="../../lab1.png" alt="自动驾驶实验室"></img>
                        </div>
                        <div style={{ border: "1px solid rgba(0,0,0,.06)", width: '27vw', height: 257 }}>
                            <Title level={3} align='center'>选择视角</Title>
                            <Radio.Group defaultValue="god" style={{ padding: '0 100px' }} buttonStyle="solid">
                                <Radio.Button value="god" onClick={this.radio_click}>上帝视角</Radio.Button>
                                <Radio.Button value="driver" onClick={this.radio_click}>驾驶员视角</Radio.Button>
                                <Radio.Button value="updown" onClick={this.radio_click}>俯视视角</Radio.Button>
                            </Radio.Group>
                            <hr></hr>
                            <br></br>
                            <Title level={3} align='center'>选择可视化对象</Title>
                            <Row>
                                <Col span={12}>
                                    自车：<Switch defaultChecked onChange={this.egoShow} /> <br />
                                    自车规划轨迹：<Switch defaultChecked onChange={this.decisionPathShow} /> <br />
                                </Col>
                                <Col span={12}>
                                    交通参与者：<Switch defaultChecked onChange={this.objectsShow} /> <br />
                                    交通参与者轨迹预测：<Switch defaultChecked onChange={this.objectPathShow} /> <br />
                                    交通标线：<Switch defaultChecked onChange={this.linesShow} /> <br />
                                </Col>
                            </Row>
                        </div>
                        <div style={{ border: "1px solid rgba(0,0,0,.06)", width: '27vw' }}>
                            <PointCloud3 viewAngle={this.state.viewAngle}></PointCloud3>
                        </div>
                        <Row>
                            <div align="center" style={{ width: '27vw' }}>
                                <img id="image" alt="原始图像" style={{ width: '27vw' }}></img>
                            </div>
                        </Row>
                    </Col>
                </Row>
            </div >
        )
    }
}

export { Hmi };
