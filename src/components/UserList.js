import { useEffect, useState } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { icon } from "leaflet";
import axios from "axios";
import { Row, Table, Empty, Modal, Form, Input, Select, Button, Space, Popconfirm, Result, Col, message } from "antd";
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
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
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
    const [selectedPhone, setSelectedPhone] = useState("");
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
    const handleSubmit = async (values) => {
        try {
            if (editId) {
                // UPDATE
                await api.put(`/users/${editId}`, values);
                message.success("Member updated successfully");
            } else {
                // CREATE
                await api.post("/users", values);
                message.success("Member added successfully");
            }
            resetForm();
            fetchUsers();
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
                message.error("Validation Failed. Please check the form fields.");
            } else {
                message.error("Something went wrong");
            }
        }
    };
    const handleEdit = async (user) => {
        setEditId(user.id);
        await fetchDistrictsByProvince(user.province.id);
        await fetchTehsilsByDistrict(user.district.id);
        antdForm.setFieldsValue({
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            province_id: user.province.id,
            district_id: user.district.id,
            tehsil_id: user.tehsil?.id || "",
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
    // Watch all form fields
    const formValues = Form.useWatch([], antdForm);
    // Check if any field has a value
    const isFormNotEmpty = () => {
        return Object.values(formValues || {}).some(
            value => value !== undefined && value !== ""
        );
    };
    const hasFilters = selectedProvince || selectedDistrict || users;
    const greenIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
    // Group users by tehsil
    const groupedUsers = users.reduce((acc, u) => {
        if (u.tehsil?.id) {
            acc[u.tehsil.id] = acc[u.tehsil.id] || [];
            acc[u.tehsil.id].push(u);
        }
        return acc;
    }, {});
    return (
        <div>
            <div className="div-card">
                <h2 className="card-title">
                    {editId ? "Edit Member" : "Add Member"}
                </h2>
                <Form form={antdForm} onFinish={handleSubmit} className="div-form">
                    {/* Name */}
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: "Name is required" }]}>
                        <Input className="form-item-input"
                            placeholder="Name" />
                    </Form.Item>
                    {/* Email */}
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, message: "Email is required" }]}>

                        <Input className="form-item-input"
                            placeholder="abc@gmail.com" />
                    </Form.Item>
                    {/* Phone */}
                    <Form.Item
                        label="Phone"
                        name="phone"
                        rules={[
                            { required: true, message: "Please enter phone number" },
                            {
                                pattern: /^03[0-9]{9}$/, // Pakistan mobile numbers
                                message: "Enter a valid Pakistan mobile number (e.g., 03001234567)"
                            },
                        ]}
                    >
                        <Input
                            className="form-item-input"
                            placeholder="03xxxxxxxxx"
                            maxLength={11}
                        />
                    </Form.Item>
                    {/* Province */}
                    <Form.Item
                        name="province_id"
                        style={{ width: "25%" }}
                        label="Province"
                        validateStatus={errors.province_id ? "error" : ""}
                        rules={[{ required: true, message: "Province is required" }]}>
                        <Select placeholder="Select Province"
                            onChange={async (value) => {
                                await fetchDistrictsByProvince(value);
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
                        name="district_id"
                        label="District"
                        style={{ width: "25%" }}
                        rules={[{ required: true, message: "District is required" }]}>
                        <Select placeholder="Select District"
                            onChange={async (value) => {
                                await fetchTehsilsByDistrict(value);
                            }}>
                            {formDistricts.map((d) => (
                                <Option key={d.id} value={d.id}>{d.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* Tehsil */}
                    <Form.Item
                        name="tehsil_id"
                        label="Tehsil"
                        style={{ width: "25%" }}
                        rules={[{ required: true, message: "Tehsil is required" }]}>
                        <Select placeholder="Select Tehsil">
                            {formTehsils.map((t) => (
                                <Option key={t.id} value={t.id}>{t.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* Action buttons */}
                    <Form.Item wrapperCol={{ offset: 6 }} >
                        <Space>
                            <Button
                                style={{ backgroundColor: "#198754" }}
                                type="primary"
                                htmlType="submit"
                                icon={editId ? <EditOutlined /> : <PlusOutlined />}
                            // loading={loading}
                            >
                                {editId ? "Update Member" : "Add Member"}
                            </Button>

                            {editId && (
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => {
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                            {!editId && isFormNotEmpty() && (
                                <Button
                                    className="reset-btn"
                                    icon={<ReloadOutlined />}
                                    onClick={resetForm}
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
                    <h3>Members List</h3>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            loading={loading}
                            pagination={{ pageSize: 5 }}
                            locale={{
                                emptyText: <Empty description="No Members Records Found" />,
                            }}
                        />
                    </div>
                </div>
                {/* Map Block */}
                <div className="map-wrapper map-custom">
                    <h3>Members Map</h3>
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

                        {Object.values(groupedUsers).map(group => {
                            const first = group[0];

                            // Add count to your existing icon
                            const iconWithCount = L.divIcon({
                                html: `<div style="position: relative;">
                                    <img src="${greenIcon.options.iconUrl}" width="32" height="32"/>
                                    <span style="position:absolute;top:0;right:0;background:#fff;color:#198754;border-radius:50%;padding:2px 6px;font-size:12px;font-weight:bold;">
                                    ${group.length}
                                    </span>
                                </div>`,
                                className: "",
                                iconSize: [32, 32],
                                iconAnchor: [16, 32],
                                popupAnchor: [0, -32],
                            });

                            return (
                                <Marker
                                    key={first.tehsil.id}
                                    position={[parseFloat(first.tehsil.latitude), parseFloat(first.tehsil.longitude)]}
                                    icon={iconWithCount}
                                >
                                    <Popup>
                                        <strong>{first.province.name}, {first.district.name}, {first.tehsil.name}</strong>
                                        <br />
                                        <strong>Total Members: {group.length}</strong>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>
        </div >
    );
}

export default Users;
