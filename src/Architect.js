import React from 'react';
import { Routes, Route, Outlet, Link } from "react-router-dom";
import { Hmi } from './Hmi'
import { Home } from './HomePage';
import { Baidumap } from './BaiduMap';
import { RouteLayout } from './RouteLayout';
import { RawImage } from './SubImage';
import { PositionMsg } from './SubPose';
import { PointCloud } from './SubPC';
import { HmiData } from './SubHmiData'

export default class Architect extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            ros: null
        }
    }

    handleHomeClick = (msg) => {
        this.setState({
            ros: msg
        })
    }

    render() {
        return (
            <Routes>
                <Route path="/" element={<RouteLayout></RouteLayout>}>
                    <Route index element={<Home handle={this.handleHomeClick}></Home>} />
                    <Route path="hdmap" element={<Hmi></Hmi>} />
                    <Route path="baidumap" element={<Baidumap></Baidumap>} />
                    <Route path="rawimage" element={<RawImage></RawImage>}></Route>
                    <Route path="position" element={<PositionMsg></PositionMsg>}></Route>
                    <Route path="hmi_data" element={<HmiData></HmiData>}></Route>
                    <Route path="pointcloud" element={<PointCloud></PointCloud>}></Route>
                </Route>
            </Routes>
        )
    }
}