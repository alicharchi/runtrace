import React, { useState, useEffect } from "react";
import { fetchUsers } from "../api";
import UserType from "./UserType";

export default function Users({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const response = await fetchUsers(token);
        setData(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (!token) {
    return <p>Please login to see user data.</p>;
  }

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div>
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Superuser</th>          
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td>{item.first_name} {item.last_name}</td>
            <td>{item.email}</td>
            <td><UserType type={item.is_superuser} /></td>            
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
