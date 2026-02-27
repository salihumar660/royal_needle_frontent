import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "../leafletIconFix";
import axios from "axios";
import '../App.css';
import L, { icon } from "leaflet";
import { Table, Empty, Modal, Form, Input, Select, Button, Space, Popconfirm, Result, Col } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    CloseOutlined,
    FileOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";
const { Option } = Select;

export default function DistrictList() {
    const [districts, setDistricts] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("asc");
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [name, setName] = useState("");
    const [provinceId, setProvinceId] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [errors, setErrors] = useState({});
    const { confirm } = Modal;

    const showDeleteConfirm = (id) => {
        confirm({
            title: 'Are you sure you want to delete this record?',
            icon: <ExclamationCircleOutlined />,
            content: 'This action is irreversible and will permanently remove the data.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            centered: true,
            onOk() {
                handleDelete(id);
            },
            onCancel() {
                console.log('Cancel delete');
            },
        });
    };
    const columns = [
        { title: "S.No", dataIndex: "index" },
        { title: "Name", dataIndex: "name" },
        { title: "Latitude", dataIndex: "latitude" },
        { title: "Longitude", dataIndex: "longitude" },
        { title: "Province", dataIndex: ["province", "name"] },
        {
            title: "Action", key: "action", render: (_, record) => (
                <Space>
                    <Button
                        className="edit-btn"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        className="dlt-btn"
                        danger
                        shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={() => showDeleteConfirm(record.id)}
                    />
                </Space>
            ),
        },
    ];
    const dataSource = districts.map((d, index) => ({
        key: d.id,
        index: index + 1,
        ...d,
    }));

    // Fetch all provinces for dropdown
    const fetchProvinces = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/provinces");
            setProvinces(res.data);
        } catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        fetchProvinces();
    }, []); // only once on mount

    // Fetch districts based on selectedProvince, search, and sort
    const fetchDistricts = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:8000/api/districts", {
                params: {
                    province_id: selectedProvince,
                    search: search,
                    sort: sort,
                },
            });
            setDistricts(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };
    useEffect(() => {
        fetchDistricts();
    }, [selectedProvince, search, sort]);
    //edit and update api fetching 
    const handleSubmit = async (e) => {
        const payload = {
            name,
            province_id: provinceId,
            latitude,
            longitude,
        }
        try {
            if (editId) {
                //update
                await axios.put(
                    `http://localhost:8000/api/districts/${editId}`,
                    payload
                );
            } else {
                //create
                await axios.post(
                    `http://localhost:8000/api/districts`,
                    payload
                );
            }
            setName("");
            setEditId(null);
            setProvinceId("");
            setLatitude("");
            setLongitude("");
        }
        catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
            } else {
                console.error(err);
            }
        }
        await fetchDistricts();
    }
    const handleEdit = (pr) => {
        setEditId(pr.id);
        setName(pr.name);
        setProvinceId(pr.province_id);
        setLatitude(pr.latitude);
        setLongitude(pr.longitude);
    }
    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/districts/${id}`);
            setDistricts(districts.filter(d => d.id !== id));
        } catch (err) {
            console.error(err);
        }
        await fetchDistricts();
    }
    const greenIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
    const resetForm = provinceId || name || latitude || longitude || errors;
    const hasFilters = selectedProvince || search || sort !== "asc";
    return (
        <div>
            <div className="div-card">
                <h2 className="card-title">
                    {editId ? "Edit District" : "Add District"}
                </h2>
                <Form onFinish={handleSubmit} className="div-form">
                    {/* Province Select */}
                    <Form.Item
                        style={{ width: "25%" }}
                        label="Province"
                        validateStatus={errors.province_id ? "error" : ""}
                        help={errors.province_id?.[0] || ""}>
                        <Select value={provinceId || undefined}
                            placeholder="Select Province"
                            onChange={(value) => {
                                setProvinceId(value)
                                setErrors(prev => ({ ...prev, province_id: null }));
                            }
                            }
                            style={{ width: "100%" }}
                        >
                            {provinces.map((pr) => (
                                <Option key={pr.id} value={pr.id}>
                                    {pr.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* District Name */}
                    <Form.Item
                        label="District Name"
                        validateStatus={errors.name ? "error" : ""}
                        help={errors.name?.[0] || ""}>
                        <Input type="text" value={name}
                            className="form-item-input"
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrors(prev => ({ ...prev, name: null }));
                            }} placeholder="District Name" />
                    </Form.Item>
                    {/* Latitude Name */}
                    <Form.Item
                        label="Latitude"
                        validateStatus={errors.latitude ? "error" : ""}
                        help={errors.latitude?.[0] || ""}>
                        <Input
                            className="form-item-input"
                            type="text"
                            placeholder="Latitude"
                            value={latitude}
                            onChange={(e) => {
                                setLatitude(e.target.value)
                                setErrors(prev => ({ ...prev, latitude: null }));
                            }}
                            required
                        />
                    </Form.Item>
                    <Form.Item
                        label="Longitude"
                        validateStatus={errors.longitude ? "error" : ""}
                        help={errors.longitude?.[0] || ""}>
                        <Input
                            className="form-item-input"
                            type="text"
                            placeholder="Longitude"
                            value={longitude}
                            onChange={(e) => {
                                setLongitude(e.target.value)
                                setErrors(prev => ({ ...prev, longitude: null }));
                            }}
                            required
                        />
                    </Form.Item>

                    {/* Submit */}
                    <div className="form-actions">
                        <Space>
                            <Button
                                style={{ backgroundColor: "#198754" }}
                                type="primary"
                                htmlType="submit"
                                icon={editId ? <EditOutlined /> : <PlusOutlined />}
                            >
                                {editId ? "Update District" : "Add District"}
                            </Button>

                            {/* Cancel */}
                            {editId && (
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => {
                                        setEditId(null);
                                        setName("");
                                        setProvinceId("");
                                        setLatitude("");
                                        setLongitude("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                            {resetForm && (
                                <Button
                                    className="reset-btn"
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        setName("");
                                        setProvinceId("");
                                        setLatitude("");
                                        setLongitude("");
                                        setErrors("");
                                    }}
                                    block
                                >Reset</Button>
                            )}
                        </Space>
                    </div>
                </Form>
            </div>
            <div style={{ marginBottom: "10px" }} className="search-form">
                <label>
                    <Select
                        style={{ width: "100%" }}
                        placeholder="Select Province"
                        value={selectedProvince || undefined}
                        onChange={(value) => setSelectedProvince(value)}
                    >
                        {provinces.map((p) => (
                            <Option key={p.id} value={p.id}>
                                {p.name}
                            </Option>
                        ))}
                    </Select>
                </label>
                <Input
                    type="text"
                    placeholder="Search District"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginLeft: "10px", padding: "4px", width: "150px" }}
                />
                <Select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    style={{ marginLeft: "10px" }}
                >
                    <Option value="asc">A-Z</Option>
                    <Option value="desc">Z-A</Option>
                </Select>
                {hasFilters && (
                    <Col xs={24} sm={12} md={2}>
                        <Button
                            className="reset-btn"
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                setSelectedProvince("");
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
                    <h3>Districts List</h3>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            locale={{
                                emptyText: <Empty description="No District Records Found" />,
                            }}
                        />
                    </div>
                </div>
                <div className="map-wrapper map-custom">
                    <h3>District Map</h3>
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

                        {districts.map(
                            (d) =>
                                d.latitude &&
                                d.longitude && (
                                    <Marker
                                        key={d.id}
                                        position={[
                                            parseFloat(d.latitude),
                                            parseFloat(d.longitude),
                                        ]}
                                        icon={greenIcon}
                                    >
                                        <Popup>
                                            <strong>{d.name}</strong>
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
