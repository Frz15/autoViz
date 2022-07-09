import React from "react";
import { Row, Col, Input, Typography, Space, AutoComplete, Button } from "antd"
import ROSLIB from "roslib"

const { Title } = Typography;

class RawImage extends React.Component {

    constructor(props) {
        super(props);
        this.optionsTopic = [
            {
                value: '/hmi/image',
            }
        ];
        this.optionsMsg = [
            {
                value: 'sensor_msgs/CompressedImage',
            }
        ];
        this.ros = new ROSLIB.Ros({
            url: 'ws://localhost:9090'
        });

        this.state = {
            topicName: "/hmi/image",
            msgType: "sensor_msgs/CompressedImage",
            isConnected: false
        }
    }

    handleChange = (e) => {
        this.setState({
            topicName: e
        })
    }

    handleClick = () => {
        this.image = document.getElementById('image');
        this.listener_image = new ROSLIB.Topic({
            ros: this.ros,
            name: this.state.topicName,
            messageType: 'sensor_msgs/CompressedImage'
        });
        this.listener_image.subscribe(this.handleMsg)
    }

    handleMsg = (message) => {
        this.setState({
            isConnected: true
        })
        this.image.src = 'data:image/jpeg;base64,' + message.data;
    }

    componentDidMount() {
        this.image = document.getElementById('image');
        this.listener_image = new ROSLIB.Topic({
            ros: this.ros,
            name: this.state.topicName,
            messageType: 'sensor_msgs/CompressedImage'
        });
    }

    render() {
        return (
            <div>
                <Row>
                    <Col span={14}>
                        <div align="center" style={{ paddingTop: 100 }}>
                            <img id="image" alt="原始图像" style={{ width: "90%" }}></img>
                        </div>
                    </Col>
                    <Col span={10} style={{ paddingTop: 250 }}>
                        { !this.state.isConnected &&
                            <Title level={2} align="center">
                                请输入原始图片话题名称及消息类型进行订阅
                            </Title>
                        }
                        { this.state.isConnected &&
                            <Title level={2} type="success" align="center">
                                订阅原始图片消息成功
                            </Title>
                        }
                        <Row style={{ paddingTop: 50 }}>
                            <Col span={11} offset={1}>
                                <Space direction="vertical">
                                    <Title level={5}> 话题名称(Topic Name): </Title>
                                    <Title level={5}> 消息类型(Message Type): </Title>
                                </Space>

                            </Col>
                            <Col span={12} offset={0}>
                                <Space direction="vertical">
                                    <AutoComplete
                                        style={{
                                            width: 300,
                                        }}
                                        options={this.optionsTopic}
                                        placeholder="请输入原始图片话题名称"
                                        onChange={this.handleChange}
                                        filterOption={(inputValue, option) =>
                                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                        }
                                    />
                                    <AutoComplete
                                        style={{
                                            width: 300,
                                        }}
                                        options={this.optionsMsg}
                                        placeholder="请输入原始图片消息类型"
                                        filterOption={(inputValue, option) =>
                                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                        }
                                    />
                                </Space>
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <Col offset={8}>
                                <Button type="primary" onClick={this.handleClick}>订阅消息</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        )
    }

}

export { RawImage }