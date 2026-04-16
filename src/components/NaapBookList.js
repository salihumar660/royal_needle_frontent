import { useEffect, useState } from 'react';
import api from '../services/api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { icon } from "leaflet";
import axios from "axios";
import { Row, Table, Empty, Modal, Form, Input, Select, Button, Space, Popconfirm, Result, Col, message, DatePicker, Tooltip } from "antd";
import dayjs from "dayjs";
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
    FilePdfOutlined,
    InfoCircleOutlined
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
        arm_hole: "",
        back_width: "",
        coat_length: "",
        collar_type: "",
        quantity: "",
        measurement_date: null,
        delivery_date: null,
        province: "",
        district: "",
        tehsil: "",
        address: "",
        notes: "",
    });
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [naapCode, setNaapCode] = useState("");
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
    const [selectedNaap, setSelectedNaap] = useState(null);
    const { confirm } = Modal;
    // PDF Generation Logic
    const handleDownloadPDF = (naap) => {
        const doc = new jsPDF();

        const img = new Image();
        img.src = "/images/logo.png";

        img.onload = () => {
            const pageWidth = doc.internal.pageSize.getWidth();
            // ================= HEADER =================
            doc.setFillColor(25, 135, 84);
            doc.rect(0, 0, pageWidth, 45, "F");

            doc.addImage(img, "PNG", 10, 5, 35, 35);
            doc.setTextColor(255);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("ROYAL NEEDLE", pageWidth / 2, 20, { align: "center" });
            doc.setFontSize(12);
            doc.text(`Naap Details Of ${naap.name || "Customer"}`, pageWidth / 2, 30, { align: "center" });
            // ================= CUSTOMER INFO BOX =================
            let y = 55;
            doc.setTextColor(0);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`Name: ${naap.name || "-"}`, 14, y);
            doc.text(`Phone: ${naap.phone || "-"}`, 120, y);
            y += 8;
            doc.text(`Email: ${naap.email || "-"}`, 14, y);
            doc.text(
                `Naap Date: ${naap.measurement_date ? dayjs(naap.measurement_date).format("DD-MM-YYYY") : "-"}`,
                120,
                y
            );
            y += 8;
            doc.text('Delivery Date: ' + (naap.delivery_date ? dayjs(naap.delivery_date).format("DD-MM-YYYY") : "-"), 14, y);
            y += 10;
            doc.line(10, y, pageWidth - 10, y); // divider line
            y += 10;
            // ================= 2-COLUMN MEASUREMENTS =================
            const leftCol = [
                ["Chest", naap.chest],
                ["Waist", naap.waist],
                ["Hips", naap.hips],
                ["Shoulder", naap.shoulder],
                ["Neck", naap.neck],
                ["Sleeve", naap.sleeveLength],
                ["Wrist", naap.wrist],
            ];
            const rightCol = [
                ["Thigh", naap.thigh],
                ["Shirt Length", naap.shirt_length],
                ["Trouser Length", naap.trouser_length],
                ["Arm Hole", naap.arm_hole],
                ["Back Width", naap.back_width],
                ["Coat Length", naap.coat_length],
                ["Collar", naap.collar_type],
            ];
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            let startY = y;
            leftCol.forEach((item, i) => {
                doc.text(`${item[0]}:`, 14, startY + i * 8);
                doc.text(`${item[1] || "-"}`, 55, startY + i * 8);
            });
            rightCol.forEach((item, i) => {
                doc.text(`${item[0]}:`, 110, startY + i * 8);
                doc.text(`${item[1] || "-"}`, 155, startY + i * 8);
            });
            // ================= ADDRESS =================
            const provinceName = naap.province?.name || "-";
            const districtName = naap.district?.name || "-";
            const tehsilName = naap.tehsil?.name || "-";
            let bottomY = startY + 8 * Math.max(leftCol.length, rightCol.length) + 10;
            doc.line(10, bottomY, pageWidth - 10, bottomY);
            bottomY += 10;
            doc.setFont("helvetica", "bold");
            doc.text("ADDRESS DETAILS", 14, bottomY);
            doc.setFont("helvetica", "normal");
            bottomY += 8;
            doc.text(`Province: ${provinceName}`, 14, bottomY);
            doc.text(`District: ${districtName}`, 110, bottomY);

            bottomY += 8;

            doc.text(`Tehsil: ${tehsilName}`, 14, bottomY);
            bottomY += 15;
            // ================= NOTES =================
            doc.setFont("helvetica", "bold");
            doc.text("Notes:", 14, bottomY);
            doc.setFont("helvetica", "normal");
            doc.text(`${naap.notes || "-"}`, 30, bottomY);
            // ================= SIGNATURE =================
            let signY = 260;
            doc.line(20, signY, 80, signY);
            doc.text("Customer Signature", 25, signY + 6);
            doc.line(120, signY, 180, signY);
            doc.text("Tailor Signature", 130, signY + 6);
            // ================= SAVE =================
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
        { title: "Naap Code", dataIndex: "naap_code" },
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
    //show code in add form
    const showCode = async () => {
        resetForm();
        setEditId(null);
        try {
            const res = await api.get("/next-naap-code");
            setNaapCode(res.data.naap_code);
            antdForm.setFieldsValue({
                naap_code: res.data.naap_code
            });
            setEditModalVisible(true);
        } catch (error) {
            console.log(error);
            message.error("Failed to generate code");
        }
    }
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
            const payload = {
                ...values,

                measurement_date: values.measurement_date
                    ? dayjs(values.measurement_date).format("YYYY-MM-DD")
                    : null,

                delivery_date: values.delivery_date
                    ? dayjs(values.delivery_date).format("YYYY-MM-DD")
                    : null,
            };
            if (editId) {
                // UPDATE
                await api.put(`/naapBook/${editId}`, payload);
                message.success("Measurement updated successfully");
            } else {
                // CREATE
                await api.post("/naapBook", payload);
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
            naap_code: naap.naap_code,
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
            arm_hole: naap.arm_hole || "",
            back_width: naap.back_width || "",
            coat_length: naap.coat_length || "",
            collar_type: naap.collar_type || "",
            quantity: naap.quantity || "",
            measurement_date: naap.measurement_date ? dayjs(naap.measurement_date) : null,
            delivery_date: naap.delivery_date ? dayjs(naap.delivery_date) : null,
            province_id: naap.province_id || "",
            district_id: naap.district_id || "",
            tehsil_id: naap.tehsil_id || "",
            notes: naap.notes || "",
        });
    };
    const handleView = async (naap) => {
        setSelectedNaap(naap);
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
            arm_hole: naap.arm_hole || "",
            back_width: naap.back_width || "",
            coat_length: naap.coat_length || "",
            collar_type: naap.collar_type || "",
            quantity: naap.quantity || "",
            measurement_date: naap.measurement_date ? dayjs(naap.measurement_date).format("DD-MM-YYYY") : "-",
            delivery_date: naap.delivery_date ? dayjs(naap.delivery_date).format("DD-MM-YYYY") : "-",
            province: naap.province?.name || "-",
            district: naap.district?.name || "-",
            tehsil: naap.tehsil?.name || "-",
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
                <Form form={antdForm} onFinish={handleSubmit} layout="vertical" className="naap-form">
                    <h3>Personal Information</h3>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Naap Code" name="naap_code">
                                <Input disabled />
                            </Form.Item>
                        </Col>
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
                    <h3>Body Measurements</h3>
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
                            <Form.Item label="Sleeve" name="sleeveLength">
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
                            <Form.Item label="Shirt" name="shirt_length">
                                <Input type="number" placeholder="Shirt Length" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Trouser" name="trouser_length">
                                <Input type="number" placeholder="Trouser Length" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label={
                                    <span>
                                        Arm Hole{" "}
                                        <Tooltip title="Gola Bazu">
                                            <InfoCircleOutlined style={{ marginLeft: 5 }} />
                                        </Tooltip>
                                    </span>
                                }
                                name="arm_hole"
                            >
                                <Input type="number" placeholder="Arm Hole" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Back Width" name="back_width">
                                <Input type="number" placeholder="Back Width" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Coat Length" name="coat_length">
                                <Input type="number" placeholder="Coat Length" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Collar Type" name="collar_type">
                                <Select placeholder="Select Collar Type">
                                    <Option value="regular">Regular</Option>
                                    <Option value="band">Band</Option>
                                    <Option value="mandarin">Mandarin</Option>
                                    <Option value="coat">Coat Collar</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Shalwar Pancha" name="shalwar_pancha">
                                <Input type="number" placeholder="Shalwar Pancha" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Measurement Date" name="measurement_date" initialValue={dayjs()}>
                                <DatePicker format="YYYY-MM-DD" type="Date" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Delivery Date" name="delivery_date" rules={[{ required: true, message: "Delivery Date is required" }]}>
                                <DatePicker format="YYYY-MM-DD" type="Date" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <h3>Address</h3>
                    {/* Province */}
                    <Row gutter={16}>
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
                    </Row>
                    {/* Notes */}
                    <h3>Additional Notes</h3>
                    <Row gutter={16}>
                        <Col span={8}>
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
                            onClick={showCode}
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
                    <h3>Personal Information</h3>
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
                    <h3>Body Measurements</h3>
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
                            <Form.Item label="Arm Hole (Gola Bazu)" name="arm_hole">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Back Width" name="back_width">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Coat Length" name="coat_length">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Color Type" name="collar_type">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Quantity" name="quantity">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Naap Date" name="measurement_date">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                        <Col span={8}>
                            <Form.Item label="Delivery Date" name="delivery_date">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                    </Row>
                    <h3>Address</h3>
                    <Row gutter={16}>
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
                        <Col span={8}>
                            <Form.Item label="Tehsil" name="tehsil">
                                <Input readOnly />
                            </Form.Item>
                        </Col >
                    </Row>
                    <Row gutter={16}>
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
                                        onClick={() => handleDownloadPDF(selectedNaap)}
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