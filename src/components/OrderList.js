import { useEffect, useState } from 'react';
import api from '../services/api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { icon } from "leaflet";
import axios from "axios";
import { Row, Table, Empty, Modal, Form, Input, Select, Button, Space, Popconfirm, Result, Col, message, DatePicker, Tooltip, Tag, Switch, Upload } from "antd";
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
    InfoCircleOutlined,
    FileImageOutlined
} from "@ant-design/icons";
import { FaFileDownload } from 'react-icons/fa';
import { BsDownload } from 'react-icons/bs';
import NaapBook from './NaapBookList';
const { Option } = Select;
function Order() {
    //all Orders
    const [orders, setOrders] = useState([]);
    const [naapBooks, setNaapBooks] = useState([]);
    const [errors, setErrors] = useState("");
    const [search, setSearch] = useState("");
    const [showDiscountAmount, setShowDiscountAmount] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [antdForm] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const { confirm } = Modal;
    const [fileList, setFileList] = useState([]);
    const [deletedFiles, setDeletedFiles] = useState([]);
    //fetch Orders
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8000/api/orders?search=${search}`);
            setOrders(response.data.data || []);
        } catch (error) {
            message.error("Error fetching orders:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchOrders();
    }, [search]);
    //fetch naapbooks for names of customers
    const fetchNaapBooks = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/api/naapBook?search=${search}`);
            setNaapBooks(response.data);
        } catch (error) {
            message.error("Error fetching naapbooks:", error);
        }
    };
    useEffect(() => {
        fetchNaapBooks();
    }, [search]);
    const hasFilters = search;
    //Delete Order
    const handleDelete = (id) => {
        api.delete(`/orders/${id}`).then(() => {
            setOrders(orders.filter(order => order.id !== id));
        });
    };
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
    //Edit Order
    const handleEdit = (order) => {
        setEditId(order.id);
        setEditModalVisible(true);
        const attachments = Array.isArray(order.attachments)
            ? order.attachments
            : typeof order.attachments === "string"
                ? JSON.parse(order.attachments)
                : [];

        const fileList = attachments.map((file, index) => {
            const fileName =
                typeof file === "string"
                    ? file.split("/").pop()
                    : file?.name || `file-${index}`;

            const url =
                typeof file === "string"
                    ? `http://localhost:8000/storage/${file}`
                    : file?.url;

            return {
                uid: index,
                name: fileName,
                status: "done",
                url,
            };
        });
        setFileList(fileList);
        antdForm.setFieldsValue({
            naap_book_id: order.naap_book_id,
            status: order.status,
            order_date: order.order_date,
            original_amount: order.original_amount,
            paid_amount: order.paid_amount,
            discount_amount: order.discount_amount,
            payment_method: order.payment_method,
            attachments: fileList,
        });
    };
    //View Order
    const handleView = async (orders) => {
        setSelectedOrder(orders);
        const images = (orders.attachments || []).map((file) => ({
            url: `http://localhost:8000/storage/${file}`,
        }));
        antdForm.setFieldsValue({
            name: orders.naap_book_id?.name || "",
            status: orders.status,
            order_date: orders.order_date,
            original_amount: orders.original_amount,
            paid_amount: orders.paid_amount,
            discount_amount: orders.discount_amount,
            due: Math.max((Number(orders.original_amount) || 0) - (Number(orders.paid_amount) || 0) - (Number(orders.discount_amount) || 0), 0),
            payment_method: orders.payment_method,
            quantity: orders.naap_book_id?.quantity || "",
            attachments: images
        });
        setViewModalVisible(true);
    };
    //reset form
    const resetForm = () => {
        setEditId(null);
        setFileList([]);
        antdForm.resetFields();
    };
    //Listings
    const columns = [
        { title: "S.No", dataIndex: "index" },
        { title: "Customer Name", dataIndex: ["naap_book", "name"] },
        { title: "Phone no", dataIndex: ["naap_book", "phone"] },
        { title: "Naap Code", dataIndex: ["naap_book", "naap_code"] },
        {
            title: "Status", dataIndex: "status", render: (status) => {
                let color = "default";
                if (status === "pending") color = "orange";
                if (status === "in-progress") color = "blue";
                if (status === "completed") color = "green";
                if (status === "delayed") color = "red";
                if (status === "delivered") color = "purple";

                return (
                    <Tag color={color} style={{ textTransform: "capitalize" }}>
                        {status}
                    </Tag>
                );
            }
        },
        { title: "Order Date", dataIndex: "order_date" },
        { title: "Original Amount", dataIndex: "original_amount" },
        { title: "Paid Amount", dataIndex: "paid_amount" },
        { title: "Discount", dataIndex: "discount_amount" },
        {
            title: "Remaining Amount", render: (_, record) => {
                const due =
                    (Number(record.original_amount) || 0) - (Number(record.paid_amount) || 0) - (Number(record.discount_amount) || 0);
                return Math.max(due, 0);
            }
        },
        {
            title: "Image",
            dataIndex: "attachments",
            render: (text) => {
                if (!text) return "No Image";
                let images = [];
                // If already array
                if (Array.isArray(text)) {
                    images = text;
                }
                // If JSON string
                else if (text.startsWith("[")) {
                    images = JSON.parse(text);
                }
                // If comma separated
                else {
                    images = text.split(",");
                }
                // Get last (most recent) image
                const latestImage = images[images.length - 1];

                return (
                    <img
                        src={`http://127.0.0.1:8000/storage/${latestImage}`}
                        alt="order"
                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
                    />
                );
            },
        },
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
    const dataSource = (Array.isArray(orders) ? orders : []).map((order, index) => ({
        key: order.id,
        index: index + 1,
        ...order,
    }));
    const isFormNotEmpty = () => {
        return Object.values(antdForm.getFieldsValue()).some(value => value);
    };
    //calculate dues
    const original_amount = Form.useWatch("original_amount", antdForm) || 0;
    const paid_amount = Form.useWatch("paid_amount", antdForm) || 0;
    const discount_amount = Form.useWatch("discount_amount", antdForm) || 0;
    const due = Math.max(Number(original_amount) - Number(paid_amount) - Number(discount_amount), 0);

    //clear discount amount when discount is not applied
    useEffect(() => {
        if (!showDiscountAmount) {
            antdForm.setFieldsValue({ discount_amount: 0 });
        }
    }, [showDiscountAmount]);
    //upload file
    const { Dragger } = Upload;
    //Submit Form
    const handleSubmit = async (values) => {
        try {
            const formData = new FormData();
            formData.append("naap_book_id", values.naap_book_id);
            formData.append("status", values.status);
            formData.append("order_date", values.order_date ? dayjs(values.order_date).format("YYYY-MM-DD") : "");
            formData.append("original_amount", values.original_amount || 0);
            formData.append("paid_amount", values.paid_amount || 0);
            formData.append("discount_amount", values.discount_amount || 0);
            formData.append("payment_method", values.payment_method);
            // new files
            fileList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append("attachments[]", file.originFileObj);
                }
            });

            // deleted files
            deletedFiles.forEach((file) => {
                formData.append("deleted_attachments[]", file);
            });
            if (editId) {
                await api.post(`/orders/${editId}?_method=PUT`, formData);
                message.success("Order updated successfully");
            } else {
                await api.post("/orders", formData);
                message.success("Order added successfully");
            }

            setEditModalVisible(false);
            antdForm.resetFields();
            resetForm();
            fetchOrders();

        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors);
                message.error("Validation Failed. Please check fields.");
            } else {
                message.error("Something went wrong");
            }
        }
    };
    return (
        <div>
            <Modal
                title={editId ? "Edit Order" : "Add Order"}
                open={editModalVisible}
                footer={null}
                onCancel={() => setEditModalVisible(false)}
                width={800}
            >
                <Form form={antdForm} onFinish={handleSubmit} layout="vertical" className="naap-form">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Customer Name"
                                name="naap_book_id"
                                rules={[{ required: true, message: "Customer Name is required" }]}>
                                <Select placeholder="Customer Name">
                                    {naapBooks.map((naap) => (
                                        <Option key={naap.id} value={naap.id}>
                                            {naap.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Order Status"
                                name="status"
                                rules={[{ required: true, message: "Order Status is required" }]}>
                                <Select placeholder="Select Order Status">
                                    <Option value="pending">Pending</Option>
                                    <Option value="in-progress">In Progress</Option>
                                    <Option value="completed">Completed</Option>
                                    <Option value="delayed">Delayed</Option>
                                    <Option value="delivered">Delivered</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Payment Method"
                                name="payment_method"
                                rules={[{ required: true, message: "Payment Method is required" }]}>
                                <Select placeholder="Select Payment Method">
                                    <Option value="cod">Cash on Delivery</Option>
                                    <Option value="bank_transfer">Bank Transfer</Option>
                                    <Option value="easypaisa">Easypaisa</Option>
                                    <Option value="JazzCash">Jazz Cash</Option>
                                    <Option value="not_paid">Not Paid</Option>
                                    <Option value="others">Others</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Original Amount"
                                name="original_amount"
                                rules={[{ required: true, message: "Original Amount is required" }]}>
                                <Input type="number" placeholder="Original Amount" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Paid Amount" name="paid_amount">
                                <Input type="number" placeholder="Paid Amount" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Discount Amount"
                                name="discount_amount">
                                <Input type="number" placeholder="Discount Amount" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Remaining Amount" >
                                <Input value={due} disabled />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Order Date" name="order_date" rules={[{ required: true, message: "Order Date is required" }]}>
                                <DatePicker format="YYYY-MM-DD" type="Date" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="attachments"
                                label="Attachments"
                                valuePropName="fileList"
                                getValueFromEvent={(e) => e?.fileList}
                            >
                                <Dragger
                                    fileList={fileList}
                                    beforeUpload={() => false}
                                    onChange={({ fileList: newFileList }) => {
                                        setFileList(newFileList);
                                    }}
                                    onRemove={(file) => {
                                        setFileList((prev) =>
                                            prev.filter((item) => item.uid !== file.uid)
                                        );
                                        // if existing file (from DB)
                                        if (file.url) {
                                            const path = file.url.replace(
                                                "http://localhost:8000/storage/",
                                                ""
                                            );
                                            setDeletedFiles((prev) => [...prev, path]);
                                        }
                                    }}
                                >
                                    <p>Upload Images</p>
                                </Dragger>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item style={{ marginBottom: 0 }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    <Button
                                        style={{ backgroundColor: "#198754" }}
                                        type="primary"
                                        htmlType="submit"
                                        icon={editId ? <EditOutlined /> : <PlusOutlined />}
                                    >
                                        {editId ? "Update Order" : "Add Order"}
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
            <div style={{ marginBottom: "10px" }} className="search-form">
                <input
                    type="text"
                    placeholder="Search Order..."
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
                            Add Order
                        </Button>
                    </div>
                    <div className="table-container">
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            locale={{
                                emptyText: <Empty description="No Order Records Found" />,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
}
export default Order;