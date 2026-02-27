import { useState } from "react";
import api from "../services/api";

function UserForm({ onUserAdded }) {
    const [form, setForm] = useState({ name: "", email: "", password: "" });

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = e => {
        e.preventDefault();
        api.post("/users", form)
            .then(res => {
                alert(res.data.message);
                onUserAdded(); // refresh user list
                setForm({ name: "", email: "", password: "" });
            })
            .catch(err => {
                console.log(err.response.data.errors);
            });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <input name="password" placeholder="Password" value={form.password} onChange={handleChange} />
            <button type="submit">Add User</button>
        </form>
    );
}

export default UserForm;
