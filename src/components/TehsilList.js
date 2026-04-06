import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "../leafletIconFix";
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import L, { icon } from "leaflet";
import 'leaflet.awesome-markers';
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
import axios from "axios";
import '../App.css';
const { Option } = Select;

function TehsilList() {
    const [tehsils, setTehsils] = useState([]);
    const [formDistricts, setformDistricts] = useState([]);
    const [filterDistricts, setfilterDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("asc");
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [name, setName] = useState("");
    const [districtId, setDistrictId] = useState("");
    const [provinceId, setProvinceId] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [errors, setErrors] = useState("");
    const { confirm } = Modal;
    const [form] = Form.useForm();

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
        { title: "District", dataIndex: ["district", "name"] },
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
    const dataSource = tehsils.map((t, index) => ({
        key: t.id,
        index: index + 1,
        ...t,
    }));
    // const [deleteId, setDeleteId] = useState(null);
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
    }, []);
    // Fetch all districts for dropdown
    const fetchDistrictsByProvince = async (provinceId) => {
        if (!provinceId) {
            setformDistricts([]);
            setDistrictId("");
            return Promise.resolve();
        }
        try {
            const res = await axios.get(
                `http://localhost:8000/api/provinces/${provinceId}/districts`
            );
            setformDistricts(res.data);
            setDistrictId("");
            return Promise.resolve();
        } catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
    };
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!selectedProvince) {
                setfilterDistricts([]);
                setSelectedDistrict("");
                return;
            }
            try {
                const res = await axios.get(
                    `http://localhost:8000/api/provinces/${selectedProvince}/districts`
                );
                setfilterDistricts(res.data);
                setSelectedDistrict("");
            } catch (err) {
                console.error(err);
            }
        };
        fetchDistricts();
    }, [selectedProvince]);

    // Fetch all tehsils from dropdown
    const fetchTehsils = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:8000/api/tehsils", {
                params: {
                    province_id: selectedProvince,
                    district_id: selectedDistrict,
                    search: search,
                    sort: sort,
                },
            });
            setTehsils(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };
    useEffect(() => {
        fetchTehsils();
    }, [selectedProvince, selectedDistrict, search, sort]);
    //edit and update api fetching
    const handleSubmit = async () => {
        // e.preventDefault();
        const payload = {
            name, province_id: provinceId, district_id: districtId, latitude, longitude
        };
        try {
            if (editId) {
                //update
                await axios.put(
                    `http://localhost:8000/api/tehsils/${editId}`,
                    payload
                );
            } else {
                //create
                await axios.post(
                    `http://localhost:8000/api/tehsils`,
                    payload
                );
            }
            form.resetFields();
            setEditId(null);
            fetchTehsils();
            setName("");
            setProvinceId("");
            setDistrictId("");
            setLatitude("");
            setLongitude("");
            setErrors({});
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
            } else {
                console.error(err);
            }
        }
        await fetchTehsils();
    }
    const handleEdit = (pr) => {
        setEditId(pr.id);
        setName(pr.name);
        setProvinceId(pr.province_id);
        fetchDistrictsByProvince(pr.province_id).then(() => {
            setDistrictId(pr.district_id);
        });
        setLatitude(pr.latitude);
        setLongitude(pr.longitude);

    };
    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/tehsils/${id}`);
            setTehsils(tehsils.filter(tehsil => tehsil.id !== id));
        } catch (err) {
            console.error(err);
        }
    };
    const resetForm = districtId || provinceId || name || latitude || longitude || errors;
    const hasFilters = selectedProvince || selectedDistrict || search || sort !== "asc";
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
                    {editId ? "Edit Tehsil" : "Add Tehsil"}
                </h2>
                {/* Form block */}
                <Form form={form} onFinish={handleSubmit} className="div-form">
                    {/* Name */}
                    <Form.Item
                        label="Tehsil Name"
                        validateStatus={errors.name ? "error" : ""}
                        help={errors.name?.[0] || ""}>
                        <Input type="text" value={name}
                            className="form-item-input"
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrors(prev => ({ ...prev, name: null }));
                            }} placeholder="Tehsil Name" />
                    </Form.Item>
                    {/* Province */}
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
                    {/* District */}
                    <Form.Item
                        label="District"
                        style={{ width: "25%" }}
                        validateStatus={errors.district_id ? "error" : ""}
                        help={errors.district_id?.[0] || ""}>
                        <Select value={districtId || undefined}
                            placeholder="Select District"
                            onChange={(value) => {
                                setDistrictId(value)
                                setErrors(prev => ({ ...prev, district_id: null }));
                            }}>
                            {formDistricts.map((d) => (
                                <Option key={d.id} value={d.id}>{d.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* Latitude */}
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
                    {/* Longitude */}
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
                    {/* Action buttons logic */}
                    <Form.Item wrapperCol={{ offset: 6 }} >
                        <Space>
                            <Button
                                style={{ backgroundColor: "#198754" }}
                                type="primary"
                                htmlType="submit"
                                icon={editId ? <EditOutlined /> : <PlusOutlined />}
                            // loading={loading}
                            >
                                {editId ? "Update Tehsil" : "Add Tehsil"}
                            </Button>

                            {editId && (
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => {
                                        setEditId(null);
                                        setName("");
                                        setProvinceId("");
                                        setDistrictId("");
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
                                        setEditId(null);
                                        setProvinceId("");
                                        setDistrictId("");
                                        setName("");
                                        setLatitude("");
                                        setLongitude("");
                                        setErrors("");
                                    }}
                                    block>
                                    Reset
                                </Button>
                            )}
                        </Space>
                    </Form.Item>
                </Form>
            </div>
            {/* Search block */}
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
                <label>
                    <Select
                        style={{ width: "100%" }}
                        placeholder="Select District"
                        value={selectedDistrict || undefined}
                        onChange={(value) => setSelectedDistrict(value)}
                    >
                        {filterDistricts.map((d) => (
                            <Option key={d.id} value={d.id}>
                                {d.name}
                            </Option>
                        ))}
                    </Select>
                </label>
                <Input
                    type="text"
                    placeholder="Search Tehsil..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginLeft: "10px", padding: "4px", width: "150px" }}
                />
                <Select
                    value={sort}
                    onChange={(value) => setSort(value)}
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
                                setSelectedDistrict("");
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
                {/* Table Block */}
                <div className="table-wrapper">
                    <h3>Tehsils List</h3>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            loading={loading}
                            pagination={{ pageSize: 5 }}
                            locale={{
                                emptyText: <Empty description="No Tehsil Records Found" />,
                            }}
                        />
                    </div>
                </div>
                {/* Map Block */}
                <div className="map-wrapper">
                    <h3>Tehsil Map</h3>
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

                        {tehsils.map(
                            (t) =>
                                t.latitude &&
                                t.longitude && (
                                    <Marker
                                        key={t.id}
                                        position={[
                                            parseFloat(t.latitude),
                                            parseFloat(t.longitude),
                                        ]}
                                        icon={greenIcon}
                                    >
                                        <Popup>
                                            <strong>{t.name}</strong>
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
export default TehsilList;