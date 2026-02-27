import { useEffect, useState } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { icon } from "leaflet";
import { Row, Table, Empty, Modal, Form, Input, Select, Button, Space, Popconfirm, Result, Col } from "antd";
import "../leafletIconFix";
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
function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", province: "", district: "" });
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [tehsils, setTehsils] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedTehsil, setSelectedTehsil] = useState("");
    const [provinceId, setProvinceId] = useState("");
    const [districtId, setDistrictId] = useState("");
    const [tehsilId, setTehsilId] = useState("");
    const [errors, setErrors] = useState("");
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
        { title: "Email", dataIndex: "email" },
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
    const dataSource = users.map((u, index) => ({
        key: u.id,
        index: index + 1,
        ...u,
    }));
    //1. fetch all provinces
    const fetchProvinces = async () => {
        try {
            const res = await api.get("http://localhost:8000/api/provinces");
            setProvinces(res.data);
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        fetchProvinces();
    }, []);
    //2. fetch districts against province
    const fetchDistrictsByProvinces = async () => {
        if (!provinceId) {
            setDistricts([]);
            setDistrictId([""]);
            return;
        }
        try {
            const res = await api.get(`http://localhost:8000/api/provinces/${provinceId}/districts`);
            setDistricts(res.data);
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        fetchDistrictsByProvinces();
    }, []);
    // 3. fetch tehsils against district
    const fetchTehsilsByDistricts = async () => {
        if (!districtId) {
            setTehsils([]);
            setTehsilId([""]);
            return;
        }
        try {
            const res = await api.get(`http://localhost:8000/api/districts/${districtId}/tehsils`);
            setTehsils(res.data);
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        fetchTehsilsByDistricts();
    }, []);
    //fetch users
    const fetchUsers = () => {
        setLoading(true);
        api.get("/users")
            .then(res => setUsers(res.data))
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        fetchUsers();
    }, []);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };
    const handleSubmit = (values) => {
        try {
            if (editId) {
                // UPDATE
                api.put(`/users/${editId}`, values).then(() => {
                    resetForm();
                    fetchUsers();
                });
            } else {
                // CREATE
                api.post("/users", values).then(() => {
                    resetForm();
                    fetchUsers();
                });
            }
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
            } else {
                console.error(err);
            }
        }
    };
    const handleEdit = (user) => {
        setEditId(user.id);
        antdForm.setFieldsValue({
            name: user.name,
            email: user.email,
            password: "",
        });
    };

    const handleDelete = (id) => {
        api.delete(`/users/${id}`).then(() => {
            setUsers(users.filter(u => u.id !== id));
        });
    };
    const resetForm = () => {
        setEditId(null);
        antdForm.resetFields();
    };
    const [antdForm] = Form.useForm();
    const hasFilters = selectedProvince || selectedDistrict || users;
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
                    {editId ? "Edit User" : "Add User"}
                </h2>
                <Form layout="vertical" form={antdForm} onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Name"
                                name="name"
                                rules={[{ required: true, message: "Please enter name" }]}
                            >
                                <Input placeholder="Name"
                                    className="form-item-input" />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Email"
                                validateStatus={errors.email ? "error" : ""}
                                help={errors.email?.[0] || ""}
                                rules={[{ required: true, message: "Please enter email" }]}
                            >
                                <Input name="email" placeholder="Email"
                                    className="form-item-input"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Password"
                                name="password"
                                rules={editId ? [] : [{ required: true, message: "Please enter password" }]}
                            >
                                <Input placeholder="Password"
                                    className="form-item-input" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Province"
                                validateStatus={errors.provinceId ? "error" : ""}
                                help={errors.provinceId?.[0] || ""}>
                                <select value={provinceId}
                                    className="form-item-select"
                                    onChange={(e) => {
                                        setProvinceId(e.target.value);
                                        setErrors(prev => ({ ...prev, provinceId: null }));
                                        // setSelectedProvince(e.target.value); // for listing filter
                                    }}
                                >
                                    <option value="">Select Province</option>
                                    {provinces.map((pr) => (
                                        <option key={pr.id} value={pr.id}>
                                            {pr.name}
                                        </option>
                                    ))}
                                </select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="District"
                                validateStatus={errors.districtId ? "error" : ""}
                                help={errors.districtId?.[0] || ""}>
                                <select value={districtId} className="form-item-select"
                                    onChange={(e) => {
                                        setDistrictId(e.target.value)
                                        setErrors(prev => ({ ...prev, districtId: null }));
                                    }}>
                                    <option value="">Select District</option>
                                    {districts.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Tehsil"
                                validateStatus={errors.tehsilId ? "error" : ""}
                                help={errors.tehsilId?.[0] || ""}
                            >
                                <select value={tehsilId}
                                    className="form-item-select"
                                    onChange={(e) => {
                                        setTehsilId(e.target.value)
                                        setErrors(prev => ({ ...prev, tehsilId: null }));
                                    }}>
                                    <option value="">Select Tehsil</option>
                                    {tehsils.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="form-actions">
                        <Space>
                            <Button
                                style={{ backgroundColor: "#198754" }}
                                type="primary"
                                htmlType="submit"
                                icon={editId ? <EditOutlined /> : <PlusOutlined />}
                            >
                                {editId ? "Update User" : "Add User"}
                            </Button>

                            {/* Cancel */}
                            {editId && (
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={resetForm}
                                >
                                    Cancel
                                </Button>
                            )}
                        </Space>
                    </div>
                    {/* <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item> */}
                </Form>
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
                            pagination={{ pageSize: 10 }}
                            locale={{
                                emptyText: <Empty description="No Users Records Found" />,
                            }}
                        />
                    </div>
                </div>
                {/* Map Block */}
                <div className="map-wrapper map-custom">
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

                        {/* {tehsils.map(
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
                        )} */}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

export default Users;
