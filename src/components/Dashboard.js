import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Typography } from "antd";
import { Column } from "@ant-design/charts";
import "leaflet/dist/leaflet.css";
import {
    UserOutlined,
    ShoppingCartOutlined,
    BookOutlined,
    DollarOutlined
} from "@ant-design/icons";
import api from "../services/api";
import dayjs from "dayjs";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { icon } from "leaflet";
const { Title, Text } = Typography;
function Dashboard() {
    const [users, setUsers] = useState([]);
    const [books, setBooks] = useState([]);
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [members, setMembers] = useState(0);
    const [naapBooks, setNaapBooks] = useState(0);
    const [orders, setOrders] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        const usersRes = await api.get("/users");
        const naapRes = await api.get("/naapBook");
        const orderRes = await api.get("/orders");
        const ordersData = Array.isArray(orderRes.data)
            ? orderRes.data
            : orderRes.data?.data || orderRes.data?.orders || [];
        setUsers(usersRes.data);
        setBooks(naapRes.data);
        setOrders(ordersData);
        processRevenue(ordersData, selectedYear);
        processStatus(ordersData, selectedYear);
    };
    const availableYears = React.useMemo(() => {
        return [...new Set([
            ...orders.map(o => dayjs(o.order_date).year()),
            ...books.map(b => dayjs(b.measurement_date).year()),
            ...users.map(u => dayjs(u.created_at).year())
        ])].sort((a, b) => b - a);
    }, [orders, books, users]);
    //filtered orders
    const filteredOrders = selectedYear
        ? orders.filter(order =>
            dayjs(order.order_date).year() === selectedYear
        )
        : orders;
    //filtered users
    const filteredUsers = selectedYear
        ? users.filter(user =>
            dayjs(user.created_at).year() === selectedYear
        ) : users;
    //filtered books
    const filteredBooks = selectedYear
        ? books.filter(book =>
            book => dayjs(book.measurement_date).year() === selectedYear
        ) : books;
    useEffect(() => {
        if (orders.length > 0) {
            processRevenue(orders, selectedYear);
            processStatus(orders, selectedYear);
        }
    }, [selectedYear]);
    const processRevenue = (data = [], year) => {
        const monthly = {};
        const filteredData = year
            ? data.filter(order =>
                dayjs(order.order_date).year() === year
            )
            : data;
        filteredData.forEach(order => {
            const month = dayjs(order.order_date).format("YYYY-MM");
            const paid = parseFloat(order.paid_amount || 0);
            monthly[month] = (monthly[month] || 0) + paid;
        });
        const formatted = Object.keys(monthly)
            .sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf())
            .map(month => ({
                month,
                revenue: monthly[month]
            }));
        setRevenueData(formatted);
    };
    const processStatus = (data = [], year) => {
        const grouped = {};
        const filteredData = year
            ? data.filter(order =>
                dayjs(order.order_date).year() === year
            )
            : data;
        filteredData.forEach(order => {
            const month = dayjs(order.order_date).format("YYYY-MM");
            if (!grouped[month]) {
                grouped[month] = {};
            }
            grouped[month][order.status] =
                (grouped[month][order.status] || 0) + 1;
        });

        const formatted = [];

        Object.keys(grouped)
            .sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf())
            .forEach(month => {
                Object.keys(grouped[month]).forEach(type => {
                    formatted.push({
                        month,
                        type,
                        value: grouped[month][type]
                    });
                });
            });

        setStatusData(formatted);
    };
    //ADMIN COLOR SYSTEM
    const COLORS = {
        primary: "#1677ff",
        success: "#52c41a",
        warning: "#faad14",
        danger: "#ff4d4f",
        dark: "#1f1f1f"
    };
    const greenIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
    const groupedUsers = filteredUsers.reduce((acc, u) => {
        if (u.tehsil?.id && u.tehsil?.latitude && u.tehsil?.longitude) {
            acc[u.tehsil.id] = acc[u.tehsil.id] || [];
            acc[u.tehsil.id].push(u);
        }
        return acc;
    }, {});
    const pakistanBounds = [
        [23.5, 60.5],
        [37.5, 77.8]
    ];
    const kpiData = [
        {
            title: "Members",
            value: filteredUsers.length,
            icon: <UserOutlined />,
            color: COLORS.primary
        },
        {
            title: "NaapBooks",
            value: filteredBooks.length,
            icon: <BookOutlined />,
            color: COLORS.success
        },
        {
            title: "Orders",
            value: filteredOrders.length,
            icon: <ShoppingCartOutlined />,
            color: COLORS.warning
        },
        {
            title: "Revenue",
            value: filteredOrders.reduce(
                (total, order) => total + parseFloat(order.paid_amount || 0),
                0
            ), //filtered
            icon: <DollarOutlined />,
            color: COLORS.danger
        }
    ];
    const revenueConfig = {
        data: revenueData,
        xField: "month",
        yField: "revenue",
        color: COLORS.success,
        columnStyle: { radius: [6, 6, 0, 0] },
        tooltip: { showMarkers: false }
    };
    const statusConfig = {
        data: statusData,
        isStack: true,
        xField: "month",
        yField: "value",
        seriesField: "type",
        color: ({ type }) => ({
            completed: COLORS.success,
            delivered: "#13c2c2",
            delayed: COLORS.danger,
            pending: COLORS.warning
        }[type] || COLORS.primary),
        legend: { position: "top" },
        columnStyle: { radius: [6, 6, 0, 0] }
    };
    return (
        <div style={{ padding: 24, background: "#f5f7fb", minHeight: "100vh" }}>
            {/* HEADER */}
            <div style={{ marginBottom: 24 }}>
                {/* <Title level={3} style={{ margin: 0 }}>Dashboard</Title> */}
                <Text type="secondary">Overview Royal Needle</Text>
                <Row justify="end" style={{ marginBottom: 16 }}>
                    <Col>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "1px solid #ddd"
                            }}
                        >
                            <option value="">All Years</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </Col>
                </Row>
            </div>
            {/* KPI CARDS */}
            <Row gutter={[16, 16]}>
                {kpiData.map((item, i) => (
                    <Col xs={24} sm={12} md={6} key={i}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 12,
                                border: "none",
                                background: `linear-gradient(135deg, ${item.color}15, #fff)`
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <div>
                                    <Text type="secondary">{item.title}</Text>
                                    <Statistic value={item.value} />
                                </div>
                                <div style={{ fontSize: 28, color: item.color }}>
                                    {item.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
            {/* CHARTS */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>

                {/* Revenue */}
                <Col xs={24} lg={12}>
                    <Card
                        title="Monthly Revenue"
                        bordered={false}
                        style={{ borderRadius: 12 }}
                    >
                        <Column {...revenueConfig} />
                    </Card>
                </Col>
                {/* Status */}
                <Col xs={24} lg={12}>
                    <Card
                        title="Monthly Order Status"
                        bordered={false}
                        style={{ borderRadius: 12 }}
                    >
                        <Column {...statusConfig} />
                    </Card>
                </Col>
            </Row>
            {/* Map Block */}
            {/* Map Block */}
            <Row style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card
                        title="Members Map"
                        bordered={false}
                        style={{ borderRadius: 12 }}
                    >
                        <div style={{ height: 500 }}>
                            <MapContainer
                                key={selectedYear}
                                center={[30.3753, 69.3451]}
                                zoom={6}
                                minZoom={6}
                                maxZoom={10}
                                maxBounds={pakistanBounds}
                                maxBoundsViscosity={1.0}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {Object.values(groupedUsers).map(group => {
                                    const first = group[0];

                                    if (
                                        !first?.tehsil?.latitude ||
                                        !first?.tehsil?.longitude
                                    ) return null;

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
                                            position={[
                                                parseFloat(first.tehsil.latitude),
                                                parseFloat(first.tehsil.longitude)
                                            ]}
                                            icon={iconWithCount}
                                        >
                                            <Popup>
                                                <strong>
                                                    {first.province?.name}, {first.district?.name}, {first.tehsil?.name}
                                                </strong>
                                                <br />
                                                <strong>Total Members: {group.length}</strong>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
export default Dashboard;