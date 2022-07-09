import React from "react";
import { Row, Col, Typography, Space, AutoComplete, Button } from "antd";
import ROSLIB from "roslib";

const { Title } = Typography;

class PositionMsg extends React.Component {

    constructor(props) {
        super(props)
        this.optionsTopic = [
            {
                value: '/hmi/ego_pose',
            }
        ];
        this.optionsMsg = [
            {
                value: 'bag_transformer/ego_pose',
            }
        ];
        this.ros = new ROSLIB.Ros({
            url: 'ws://127.0.0.1:9090'
        });
        this.state = {
            isConnected: false
        }
    }

    handleChange = (e) => {
        this.setState({
            topicName: e
        })
    }

    handleClick = () => {
        this.listener_pose = new ROSLIB.Topic({
            ros: this.ros,
            name: this.state.topicName,
            messageType: 'bag_transformer/ego_pose'
        });

        this.listener_pose.subscribe(this.handleMsg)
    }

    handleMsg = (msg) => {
        if(msg.altitude !== null){
            this.setState({
                isConnected: true
            })
        }else{
            this.setState({
                isConnected: false
            })
        }
    }

    render() {
        return(
            <div style={{ paddingTop: 250 }}>
                {
                    !this.state.isConnected && (
                    <Title level={2} align='center'>请输入定位消息的话题名称和消息类型</Title>
                    )
                }
                {
                    this.state.isConnected && (
                    <Title level={2} align='center' type="success">定位消息订阅成功</Title>
                    )
                }
                <Row>
                    <Col span={24} >
                        <Row style={{ paddingTop: 50 }}>
                            <Col span={4} offset={8}>
                                <Space direction="vertical">
                                    <Title level={5}> 话题名称(Topic Name): </Title>
                                    <Title level={5}> 消息类型(Message Type): </Title>
                                </Space>
                            </Col>
                            <Col span={8} offset={0}>
                                <Space direction="vertical">
                                    <AutoComplete
                                        style={{
                                            width: 300,
                                        }}
                                        options={this.optionsTopic}
                                        placeholder="请输入定位信息话题名称"
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
                                        placeholder="请输入定位信息消息类型"
                                        filterOption={(inputValue, option) =>
                                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                        }
                                    />
                                </Space>
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <Col offset={11}>
                                <Button type="primary" onClick={this.handleClick}>订阅消息</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        )
    }
}

export {PositionMsg}