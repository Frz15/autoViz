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
                            <img id="image" alt="εε§εΎε" style={{ width: "90%" }}></img>
                        </div>
                    </Col>
                    <Col span={10} style={{ paddingTop: 250 }}>
                        { !this.state.isConnected &&
                            <Title level={2} align="center">
                                θ―·θΎε₯εε§εΎηθ―ι’εη§°εζΆζ―η±»εθΏθ‘θ?’ι
                            </Title>
                        }
                        { this.state.isConnected &&
                            <Title level={2} type="success" align="center">
                                θ?’ιεε§εΎηζΆζ―ζε
                            </Title>
                        }
                        <Row style={{ paddingTop: 50 }}>
                            <Col span={11} offset={1}>
                                <Space direction="vertical">
                                    <Title level={5}> θ―ι’εη§°(Topic Name): </Title>
                                    <Title level={5}> ζΆζ―η±»ε(Message Type): </Title>
                                </Space>

                            </Col>
                            <Col span={12} offset={0}>
                                <Space direction="vertical">
                                    <AutoComplete
                                        style={{
                                            width: 300,
                                        }}
                                        options={this.optionsTopic}
                                        placeholder="θ―·θΎε₯εε§εΎηθ―ι’εη§°"
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
                                        placeholder="θ―·θΎε₯εε§εΎηζΆζ―η±»ε"
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
                                <Button type="primary" onClick={this.handleClick}>θ?’ιζΆζ―</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        )
    }

}

export { RawImage }