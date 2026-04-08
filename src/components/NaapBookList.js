import { useEffect, useState } from 'react';
import api from '../services/api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
    EyeInvisibleOutlined,
    FilePdfOutlined
} from "@ant-design/icons";
import { FaFileDownload } from 'react-icons/fa';
import { BsDownload } from 'react-icons/bs';
const { Option } = Select;
function NaapBook() {
    //all NaapBooks
    const [naapBooks, setNaapBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [naapForm, setNaapForm] = useState({
        name: "",
        phone: "",
        email: "",
        chest: "",
        waist: "",
        hips: "",
        shoulder: "",
        neck: "",
        sleeveLength: "",
        wrist: "",
        thigh: "",
        shirt_length: "",
        trouser_length: "",
        province: "",
        district: "",
        tehsil: "",
        address: "",
        notes: "",
    });
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [antdForm] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const [provinces, setProvinces] = useState([]);
    const [districtId, setDistrictId] = useState("");
    const [tehsilId, setTehsilId] = useState("");
    const [errors, setErrors] = useState("");
    const [formDistricts, setformDistricts] = useState([]);
    const [formTehsils, setformTehsils] = useState([]);
    const [filterDistricts, setfilterDistricts] = useState([]);
    const [filterTehsils, setfilterTehsil] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedTehsil, setSelectedTehsil] = useState("");
    const { confirm } = Modal;
    // PDF Generation Logic
    const handleDownloadPDF = (naap) => {
        const doc = new jsPDF();
        const img = new Image();
        img.src = "/images/logo.png";
        img.onload = () => {
            const pageWidth = doc.internal.pageSize.getWidth();
            // Header bar
            doc.setFillColor(25, 135, 84);
            doc.rect(0, 0, pageWidth, 40, "F");
            // Logos
            doc.addImage(img, "PNG", 5, 3, 40, 34); // top-left
            // Brand name next to left logo
            doc.setFontSize(12);
            doc.setFont("italic", "bold");
            doc.setTextColor(255);
            doc.text("Royal Needle", 38, 19);

            // Title & user name centered
            doc.setFontSize(20);
            doc.setFont("italic", "bold");
            doc.text("Naap Details Of", pageWidth / 2, 18, { align: "center" });

            doc.setFontSize(14);
            doc.setFont("italic", "bold");
            doc.text(naap.name || "Name Not Available", pageWidth / 2, 26, { align: "center" });

            // Table data
            const tableData = Object.entries(naap)
                .filter(([k]) => !["id", "created_at", "updated_at"].includes(k))
                .map(([k, v]) => [k.replace(/_/g, " ").toUpperCase(), v || "-"]);

            autoTable(doc, {
                startY: 45,
                head: [["Field", "Value"]],
                body: tableData,
                theme: "grid",
                headStyles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [240, 240, 240] },
                styles: { fontSize: 12 }
            });

            doc.save(`${naap.name || "naap"}_naap.pdf`);
        };

        img.onerror = () => console.error("Logo failed to load");
    };
    //delete logic
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
    const handleDelete = (id) => {
        api.delete(`/naapBook/${id}`).then(() => {
            setNaapBooks(naapBooks.filter(nb => nb.id !== id));
        });
    };
    //List of NaapBooks
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
                        className="view-btn"
                        shape="circle"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
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
    const dataSource = naapBooks.map((nb, index) => ({
        key: nb.id,
        index: index + 1,
        ...nb,
    }));
    //1. fetch all naaps
    const fetchMeasurement = async () => {
        try {
            const res = await api.get("http://localhost:8000/api/naapBook");
            setNaapBooks(res.data);
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        fetchMeasurement();
    }, []);
    // Location data for dropdowns
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
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNaapForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };
    const resetForm = () => {
        setEditId(null);
        antdForm.resetFields();
    };
    const handleSubmit = async (values) => {
        try {
            if (editId) {
                // UPDATE
                await api.put(`/naapBook/${editId}`, values);
                message.success("Measurement updated successfully");
            } else {
                // CREATE
                await api.post("/naapBook", values);
                message.success("Measurement added successfully");
            }
            setEditModalVisible(false);
            antdForm.resetFields();
            resetForm();
            fetchMeasurement();
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
                message.error("Validation Failed. Please check the form fields.");
            } else {
                message.error("Something went wrong");
            }
        }
    };
    const handleEdit = async (naap) => {
        setEditId(naap.id);
        setEditModalVisible(true);
        await fetchDistrictsByProvince(naap.province_id);
        await fetchTehsilsByDistrict(naap.district_id);
        antdForm.setFieldsValue({
            name: naap.name,
            phone: naap.phone || "",
            email: naap.email || "",
            chest: naap.chest || "",
            waist: naap.waist || "",
            hips: naap.hips || "",
            shoulder: naap.shoulder || "",
            neck: naap.neck || "",
            sleeveLength: naap.sleeveLength || "",
            wrist: naap.wrist || "",
            thigh: naap.thigh || "",
            shirt_length: naap.shirt_length || "",
            trouser_length: naap.trouser_length || "",
            province_id: naap.province_id || "",
            district_id: naap.district_id || "",
            tehsil_id: naap.tehsil_id || "",
            notes: naap.notes || "",
        });
    };
    const handleView = async (naap) => {
        await fetchDistrictsByProvince(naap.province_id);
        await fetchTehsilsByDistrict(naap.district_id);
        antdForm.setFieldsValue({
            name: naap.name,
            phone: naap.phone || "",
            email: naap.email || "",
            chest: naap.chest || "",
            waist: naap.waist || "",
            hips: naap.hips || "",
            shoulder: naap.shoulder || "",
            neck: naap.neck || "",
            sleeveLength: naap.sleeveLength || "",
            wrist: naap.wrist || "",
            thigh: naap.thigh || "",
            shirt_length: naap.shirt_length || "",
            trouser_length: naap.trouser_length || "",
            province: naap.province_id || "",
            district: naap.district_id || "",
            tehsil: naap.tehsil_id || "",
            notes: naap.notes || "",
        });
        setViewModalVisible(true);
    };
    const isFormNotEmpty = () => {
        return Object.values(antdForm.getFieldsValue()).some(value => value);
    };
    return (
        <div>
            {/* <div className="div-card"> */}
            {/* <h2 className="card-title">
                    {editId ? "Edit Member" : "Add Member"}
                </h2> */}
            <Modal
                title={editId ? "Edit Naap Details" : "Add Naap Details"}
                open={editModalVisible}
                footer={null}
                onCancel={() => setEditModalVisible(false)}
                width={800}
            >
                <Form form={antdForm} onFinish={handleSubmit} className="naap-form">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Name"
                                name="name"
                                rules={[{ required: true, message: "Name is required" }]}>
                                <Input
                                    placeholder="Name" />
                            </Form.Item>
                        </Col>
                        {/* Email */}
                        <Col span={8}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ required: true, message: "Email is required" }]}>

                                <Input
                                    placeholder="abc@gmail.com" />
                            </Form.Item>
                        </Col>
                        {/* Phone */}
                        <Col span={8}>
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

                                    placeholder="03xxxxxxxxx"
                                    maxLength={11}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            {/* Body Measurements */}
                            <Form.Item label="Chest" name="chest">
                                <Input type="number" placeholder="Chest" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Waist" name="waist">
                                <Input type="number" placeholder="Waist" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Hips" name="hips">
                                <Input type="number" placeholder="Hips" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Shoulder" name="shoulder">
                                <Input type="number" placeholder="Shoulder" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Neck" name="neck">
                                <Input type="number" placeholder="Neck" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Sleeve Length" name="sleeveLength">
                                <Input type="number" placeholder="Sleeve Length" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Wrist" name="wrist">
                                <Input type="number" placeholder="Wrist" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Thigh" name="thigh">
                                <Input type="number" placeholder="Thigh" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Shirt Length" name="shirt_length">
                                <Input type="number" placeholder="Shirt Length" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Trouser Length" name="trouser_length">
                                <Input type="number" placeholder="Trouser Length" />
                            </Form.Item>
                        </Col>
                        {/* Province */}
                        <Col span={8}>
                            <Form.Item
                                name="province_id"
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
                        </Col>
                        <Col span={8}>
                            {/* District */}
                            <Form.Item
                                name="district_id"
                                label="District"
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
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            {/* Tehsil */}
                            <Form.Item
                                name="tehsil_id"
                                label="Tehsil"
                                rules={[{ required: true, message: "Tehsil is required" }]}>
                                <Select placeholder="Select Tehsil">
                                    {formTehsils.map((t) => (
                                        <Option key={t.id} value={t.id}>{t.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            {/* Notes */}
                            <Form.Item label="Notes" name="notes">
                                <Input.TextArea placeholder="Additional notes or comments" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Form.Item style={{ marginBottom: 0 }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    <Button
                                        style={{ backgroundColor: "#198754" }}
                                        type="primary"
                                        htmlType="submit"
                                        icon={editId ? <EditOutlined /> : <PlusOutlined />}
                                    >
                                        {editId ? "Update Naap" : "Add Naap"}
                                    </Button>

                                    <Button
                                        danger
                                        icon={<CloseOutlined />}
                                        onClick={() => setEditModalVisible(false)}
                                    >
                                        Close
                                    </Button>

                                    {!editId && isFormNotEmpty() && (
                                        <Button
                                            className="reset-btn"
                                            icon={<ReloadOutlined />}
                                            onClick={resetForm}
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
            {/* </div> */}
            <div className="content-row">
                {/* Table Block */}
                <div className="table-wrapper">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3>Naap List</h3>
                        <Button
                            style={{ backgroundColor: "#198754" }}
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                resetForm();
                                setEditModalVisible(true);
                            }}
                        >
                            Add Naap
                        </Button>
                    </div>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            loading={loading}
                            pagination={{ pageSize: 5 }}
                            locale={{
                                emptyText: <Empty description="No Naap Records Found" />,
                            }}
                        />
                    </div>
                </div>
            </div>
            <Modal
                title="View Naap Details"
                open={viewModalVisible}
                footer={null}
                onCancel={() => setViewModalVisible(false)}
                width={800}
            >
                <Form form={antdForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Name" name="name">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Phone" name="phone">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Email" name="email">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Chest" name="chest">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Waist" name="waist">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Hips" name="hips">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Shoulder" name="shoulder">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Neck" name="neck">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Sleeve Length" name="sleeveLength">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Wrist" name="wrist">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Thigh" name="thigh">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Shirt Length" name="shirt_length">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Trouser Length" name="trouser_length">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Province" name="province">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="District" name="district">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Tehsil" name="tehsil">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Address" name="address">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Notes" name="notes">
                                <Input.TextArea readOnly />
                            </Form.Item>
                        </Col >
                    </Row >
                    <Row>
                        <Col span={24}>
                            <Form.Item style={{ marginBottom: 0 }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    <Button
                                        style={{ backgroundColor: "#198754" }}
                                        type="primary"
                                        htmlType="submit"
                                        icon={<BsDownload />}
                                        onClick={() => handleDownloadPDF(antdForm.getFieldsValue())}
                                    >
                                        Download PDF
                                    </Button>

                                    <Button
                                        danger
                                        icon={<CloseOutlined />}
                                        onClick={() => setViewModalVisible(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form >
            </Modal >
        </div >
    );
}
export default NaapBook;