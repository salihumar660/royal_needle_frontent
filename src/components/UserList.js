import { useEffect, useState } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { icon } from "leaflet";
import axios from "axios";
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
    ExclamationCircleOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from "@ant-design/icons";
const { Option } = Select;
function Users() {
    const [users, setUsers] = useState([]);
    // create form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [tehsils, setTehsils] = useState([]);
    // Reset state
    const [form, setForm] = useState({ name: "", email: "", phone: "", province: "", district: "" });
    const [loading, setLoading] = useState(true);
    // Edit form state
    const [editId, setEditId] = useState(null);
    const [selectedName, setSelectedName] = useState("");
    const [selectedEmail, setSelectedEmail] = useState("");
    const [selectedPassword, setSelectedPassword] = useState("");
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedTehsil, setSelectedTehsil] = useState("");
    const [provinceId, setProvinceId] = useState("");
    const [districtId, setDistrictId] = useState("");
    const [tehsilId, setTehsilId] = useState("");
    const [errors, setErrors] = useState("");
    const [formDistricts, setformDistricts] = useState([]);
    const [formTehsils, setformTehsils] = useState([]);
    const [filterDistricts, setfilterDistricts] = useState([]);
    const [filterTehsils, setfilterTehsil] = useState([]);
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
        { title: "Province", dataIndex: ["province", "name"] },
        { title: "District", dataIndex: ["district", "name"] },
        { title: "Tehsil", dataIndex: ["tehsil", "name"] },
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
    // 3. fetch tehsils against district
    const fetchTehsilsByDistrict = async (districtId) => {
        if (!districtId) {
            setformTehsils([]);
            setTehsilId("");
            return;
        }
        try {
            const res = await axios.get(
                `http://localhost:8000/api/districts/${districtId}/tehsils`
            );
            setformTehsils(res.data);
            setTehsilId("");
        } catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        const fetchTehsils = async () => {
            if (!selectedDistrict) {
                setfilterTehsil([]);
                setSelectedTehsil("");
                return;
            }
            try {
                const res = await axios.get(
                    `http://localhost:8000/api/districts/${selectedDistrict}/tehsils`
                );
                setformTehsils(res.data);
                setSelectedTehsil("");
            } catch (err) {
                console.error(err);
            }
        };
        fetchTehsils();
    }, [selectedDistrict]);
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
                <Form onFinish={handleSubmit} className="div-form">
                    {/* Name */}
                    <Form.Item
                        label="Name"
                        validateStatus={errors.name ? "error" : ""}
                        help={errors.name?.[0] || ""}>
                        <Input type="text" value={name}
                            className="form-item-input"
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrors(prev => ({ ...prev, name: null }));
                            }} placeholder="Name" />
                    </Form.Item>
                    {/* Email */}
                    <Form.Item
                        label="Email"
                        validateStatus={errors.email ? "error" : ""}
                        help={errors.email?.[0] || ""}
                    >
                        <Input
                            type="text" value={email}
                            className="form-item-input"
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setErrors(prev => ({ ...prev, email: null }));
                            }} placeholder="abc@gmail.com" />
                    </Form.Item>
                    {/* Password */}
                    <Form.Item
                        label="Password"
                        validateStatus={errors.password ? "error" : ""}
                        help={errors.password?.[0] || ""}
                    >
                        <Input.Password
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors(prev => ({ ...prev, password: null }));
                            }}
                            iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>
                    {/* Province */}
                    <Form.Item
                        style={{ width: "25%" }}
                        label="Province"
                        validateStatus={errors.province_id ? "error" : ""}
                        help={errors.province_id?.[0] || ""}>
                        <Select value={provinceId || undefined}
                            placeholder="Select Province"
                            onChange={async (value) => {
                                setProvinceId(value);
                                setDistrictId("");
                                setTehsilId("");
                                setformTehsils([]);
                                await fetchDistrictsByProvince(value);
                                setErrors(prev => ({ ...prev, province_id: null }));
                            }}
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
                            onChange={async (value) => {
                                setDistrictId(value)
                                setTehsilId("");
                                await fetchTehsilsByDistrict(value);
                                setErrors(prev => ({ ...prev, district_id: null }));
                            }}>
                            {formDistricts.map((d) => (
                                <Option key={d.id} value={d.id}>{d.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* Tehsil */}
                    <Form.Item
                        label="Tehsil"
                        style={{ width: "25%" }}
                        validateStatus={errors.tehsil_id ? "error" : ""}
                        help={errors.tehsil_id?.[0] || ""}>
                        <Select value={tehsilId || undefined}
                            placeholder="Select Tehsil"
                            onChange={(value) => {
                                setTehsilId(value)
                                setErrors(prev => ({ ...prev, tehsil_id: null }));
                            }}>
                            {formTehsils.map((t) => (
                                <Option key={t.id} value={t.id}>{t.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* Action Buttons */}
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
                                {editId ? "Update User" : "Add User"}
                            </Button>

                            {editId && (
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => {
                                        setEditId(null);
                                        setName("");
                                        setEmail("");
                                        setPassword("");
                                        setProvinceId("");
                                        setDistrictId("");
                                        setTehsilId("");
                                        setErrors("");
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
                                        setName("");
                                        setEmail("");
                                        setPassword("");
                                        setProvinceId("");
                                        setDistrictId("");
                                        setTehsilId("");
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
            <div className="content-row">
                {/* Table Block */}
                <div className="table-wrapper">
                    <h3>Users List</h3>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            loading={loading}
                            pagination={{ pageSize: 5 }}
                            locale={{
                                emptyText: <Empty description="No Users Records Found" />,
                            }}
                        />
                    </div>
                </div>
                {/* Map Block */}
                <div className="map-wrapper map-custom">
                    <h3>Users Map</h3>
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

                        {users.map(
                            (u) =>
                                u.tehsil?.latitude &&
                                u.tehsil?.longitude && (
                                    <Marker
                                        key={u.id}
                                        position={[
                                            parseFloat(u.tehsil.latitude),
                                            parseFloat(u.tehsil.longitude),
                                        ]}
                                        icon={greenIcon}
                                    >
                                        <Popup>
                                            <strong>{u.name}</strong>
                                            <br />
                                            {u.province.name}, {u.district.name}, {u.tehsil.name}
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

export default Users;
