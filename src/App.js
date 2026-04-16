import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import ProvinceList from "./components/ProvinceList";
import DistrictList from "./components/DistrictList";
import TehsilList from "./components/TehsilList";
import UserList from "./components/UserList";
import NaapBook from "./components/NaapBookList";
import Orders from "./components/OrderList";
import Dashboard from "./components/Dashboard";


import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Column } from '@ant-design/charts';

import { Layout, Menu, Result } from "antd";
import { AppstoreOutlined, EnvironmentOutlined, BankOutlined, UserOutlined, DashboardOutlined, WindowsOutlined, FormOutlined, OrderedListOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = location.pathname === "/" ? "" : location.pathname.replace("/", "");
  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider collapsible
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          background: "#198754",
          zIndex: 1000,
        }}>
        <div style={{ height: "40px", margin: "10px", color: "#fff", fontWeight: "bold", textAlign: "center" }}>
          <img
            src="/images/logo.png"
            alt="Logo"
            style={{ height: "34px" }}
          />
          Royal Needle
        </div>

        <Menu
          style={{ backgroundColor: "#198754", color: "#fff", marginTop: "25px" }}
          mode="inline"
          defaultOpenKeys={[""]}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(`/${key}`)}
          items={[
            { key: "dashboard", label: "Dashboard" },
            {

              key: "location",
              icon: <EnvironmentOutlined style={{ color: "#fff" }} />,
              label: "Location Management",
              children: [
                { key: "provinces", label: "Provinces" },
                { key: "districts", label: "Districts" },
                { key: "tehsils", label: "Tehsils" },
              ],
            },
            {
              key: "user",
              icon: <UserOutlined style={{ color: "#fff" }} />,
              label: "Membership Management",
              children: [
                { key: "user", label: "Members List" },
              ],
            },
            {
              key: "NaapBook",
              icon: <FormOutlined style={{ color: "#fff" }} />,
              label: "NaapBook Management",
              children: [
                { key: "NaapBook", label: "NaapBook List" },
              ],
            },
            {
              key: "Orders",
              icon: <OrderedListOutlined style={{ color: "#fff" }} />,
              label: "Orders Management",
              children: [
                { key: "Orders", label: "Orders List" },
              ],
            },
          ]}
        />
      </Sider>

      {/* Main Content */}
      <Layout style={{ marginLeft: 200, marginTop: 0 }}>
        <Header
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            left: 200, // 👈 IMPORTANT (same width as Sider)
            zIndex: 1001,
            background: "#fff",
            padding: "0 20px",
            fontSize: "18px",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        >
          Dashboard
        </Header>

        <Content
          style={{
            margin: "20px", marginTop: 80, background: "#fff", padding: "20px", minHeight: "calc(100vh - 80px)"
          }}>
          <Routes>
            <Route
              path="/"
              element={
                <Navigate to="/dashboard" replace />
              }
            />
            {/* Dashboard Module */}
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Location Module */}
            <Route path="/provinces" element={<ProvinceList />} />
            <Route path="/districts" element={<DistrictList />} />
            <Route path="/tehsils" element={<TehsilList />} />
            {/* Users Module */}
            <Route path="/user" element={<UserList />} />
            {/* NaapBook Module */}
            <Route path="/naapBook" element={<NaapBook />} />
            <Route path="/Orders" element={<Orders />} />
          </Routes>
        </Content>
      </Layout>
    </Layout >

  );
}
export default function App() {
  const [refresh, setRefresh] = useState(false);
  const refreshList = () => setRefresh(!refresh);
  return (
    <>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </>
  );
}


