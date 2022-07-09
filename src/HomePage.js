import { Input, Button, Typography } from 'antd';
import React from 'react';
import ROSLIB from "roslib";

const { Title } = Typography;

class Home extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            ip: "",
            port: "",
            status: 'needipport'
        }
    }

    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    handleClick = () => {
        this.ros = new ROSLIB.Ros({
            url: 'ws://' + this.state.ip + ':' + this.state.port
        });

        this.ros.on('error', () => {
            console.log("on error");
            this.setState({
                status: "error"
            })
        })

        this.ros.on('connection', () => {
            console.log("on connection");
            this.setState({
                status: "isConnected"
            })
        })

        this.props.handle(this.ros)

    }

    handleClick2 = () => {
        this.ros.close()
        this.setState({
            status: "needipport"
        })
    }

    render() {
        return (
            <div>
                <Title level={3} align='center'>请开启远程websocket服务器，并输入远程websocket服务器的ip地址和端口号</Title>
                <div align='center' style={{ paddingTop: 200 }}>
                    {
                        this.state.status === 'isConnected' && (
                            <Title level={1} type="success">连接成功</Title>
                        )
                    }{
                        this.state.status === 'needipport' && (
                            <Title level={1}>尚未连接远程服务器</Title>
                        )
                    }{
                        this.state.status === 'error' && (
                            <Title level={1} type="danger">ip地址或端口错误，请重新尝试</Title>
                        )
                    }
                    <br />
                    <Input.Group compact>
                        <Input addonBefore="ws://" addonAfter=":" defaultValue="远程服务ip地址" style={{ width: 300 }} name='ip' onChange={this.handleChange} />
                        <Input defaultValue="端口号" addonAfter="  " style={{ width: 100 }} name='port' onChange={this.handleChange} />
                        {
                            this.state.status === 'error' && (
                                <Button type="primary" onClick={this.handleClick}>连接</Button>
                            )
                        }
                        {
                            this.state.status === 'needipport' && (
                                <Button type="primary" onClick={this.handleClick}>连接</Button>
                            )
                        }
                        {
                            this.state.status === 'isConnected' && (
                                <Button type="primary" onClick={this.handleClick2}>断开连接</Button>
                            )
                        }
                    </Input.Group>
                </div>
            </div >
        )
    }
}



export { Home }