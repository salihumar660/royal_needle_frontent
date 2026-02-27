import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "../leafletIconFix";
import "../App.css";
import L, { icon } from "leaflet";
import axios from "axios";
import { Table, Empty, Modal, Form, Input, Select, Button, Space, Popconfirm, Result, Col } from "antd";
import {
    PlusOutlined,
    CloseOutlined,
    FileAddOutlined,
    EditOutlined,
    DeleteOutlined,
    FileOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined
} from "@ant-design/icons";
import FormItem from "antd/es/form/FormItem";
function ProvinceList() {
    const [province, setProvince] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState("");
    const [sort, setSort] = useState("asc");
    const columns = [
        { title: "S.No", dataIndex: "index" },
        { title: "Name", dataIndex: "name" },
        { title: "Latitude", dataIndex: "latitude" },
        { title: "Longitude", dataIndex: "longitude" },
        {
            title: "Action", key: "action", render: (_, record) => (
                <Space>
                    <Button
                        className="edit-btn"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                </Space>
            ),
        },
    ];
    const dataSource = province.map((p, index) => ({
        key: p.id,
        index: index + 1,
        ...p,
    }));

    //define outside
    const fetchProvinces = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/provinces?search=${search}`
            );
            setProvince(response.data);
        } catch (error) {
            console.log("Error fetching provinces:", error);
        }
        setLoading(false);
    };

    //only call here
    useEffect(() => {
        fetchProvinces();
    }, [search]);

    //create & update
    const handleSubmit = async (e) => {

        try {
            if (editId) {
                // UPDATE
                await axios.put(
                    `http://localhost:8000/api/provinces/${editId}`,
                    { name, latitude, longitude }
                );
            } else {
                // CREATE
                await axios.post(
                    `http://localhost:8000/api/provinces`,
                    { name, latitude, longitude }
                );
            }

            setName("");
            setLatitude("");
            setLongitude("");
            setEditId(null);
            fetchProvinces();
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
            } else {
                console.error(err);
            }
        }
    };
    //edit
    const handleEdit = (pr) => {
        setEditId(pr.id);
        setName(pr.name);
        setLatitude(pr.latitude);
        setLongitude(pr.longitude);
    };
    const hasFilters = search || sort !== "asc";
    const greenIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
    return (
        <div>
            <div className="div-card">
                <h2 className="card-title">
                    {editId ? "Edit Province" : "Add Province"}
                </h2>

                {/* Form */}
                <Form onFinish={handleSubmit} className="div-form">
                    <div className="form-row">
                        <Form.Item
                            label="Province Name"
                            validateStatus={errors.name ? "error" : ""}
                            help={errors.name?.[0] || ""}>
                            <Input type="text" value={name}
                                className="form-item-input"
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setErrors(prev => ({ ...prev, name: null }));
                                }} placeholder="Province Name" />
                        </Form.Item>
                        <FormItem
                            label="Latitude"
                            validateStatus={errors.latitude ? "error" : ""}
                            help={errors.latitude?.[0] || ""}>
                            <input
                                className="form-item-input"
                                type="text"
                                step="any"
                                placeholder="Latitude"
                                value={latitude}
                                onChange={(e) => {
                                    setLatitude(e.target.value)
                                    setErrors(prev => ({ ...prev, latitude: null }));
                                }}
                                required
                            />
                        </FormItem>
                        <FormItem
                            label="Longitude"
                            validateStatus={errors.longitude ? "error" : ""}
                            help={errors.longitude?.[0] || ""}>
                            <input
                                className="form-item-input"
                                type="text"
                                step="any"
                                placeholder="Longitude"
                                value={longitude}
                                onChange={(e) => {
                                    setLongitude(e.target.value);
                                    setErrors(prev => ({ ...prev, longitude: null }));
                                }
                                }
                                required
                            />
                        </FormItem>
                    </div>

                    <div className="form-actions">
                        <Space>
                            <Button
                                style={{ backgroundColor: "#198754" }}
                                type="primary"
                                htmlType="submit"
                                icon={editId ? <EditOutlined /> : <PlusOutlined />}
                                loading={loading}
                            >
                                {editId ? "Update Province" : "Add Province"}
                            </Button>
                            {editId && (
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => {
                                        setEditId(null);
                                        setName("");
                                        setLatitude("");
                                        setLongitude("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </Space>
                    </div>
                </Form>
            </div >
            <div style={{ marginBottom: "10px" }} className="search-form">
                <input
                    type="text"
                    placeholder="Search Province..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {hasFilters && (
                    <Col xs={24} sm={12} md={2}>
                        <Button
                            className="reset-btn"
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                setSearch("");
                                setSort("asc");
                            }}
                            block>
                            Reset
                        </Button>
                    </Col>
                )}
            </div>
            <div className="content-row">
                <div className="table-wrapper">
                    <h3>Provinces Table</h3>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            locale={{
                                emptyText: <Empty description="No Province Records Found" />,
                            }}
                        />
                    </div>
                </div>
                <div className="map-wrapper map-custom">
                    <h3>Province Map</h3>
                    <MapContainer
                        center={[30.3753, 69.3451]}
                        zoom={5}
                        minZoom={4}
                        maxBounds={[
                            [23.0, 60.0],
                            [37.5, 77.5],
                        ]}
                        maxBoundsViscosity={1.0}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {province.map(
                            (pr) =>
                                pr.latitude &&
                                pr.longitude && (
                                    <Marker
                                        key={pr.id}
                                        position={[
                                            parseFloat(pr.latitude),
                                            parseFloat(pr.longitude),
                                        ]}
                                    >
                                        <Popup>
                                            <strong>{pr.name}</strong>
                                        </Popup>
                                    </Marker>
                                )
                        )}
                    </MapContainer>
                </div>
            </div>
        </div >
    );
}
export default ProvinceList;
