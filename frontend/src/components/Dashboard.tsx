import React, { useEffect, useState } from 'react';
import api from '../utils/api';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  age?: number;
  height?: number;
  weight?: number;
  fitnessLevel?: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data);
      } catch (err: any) {
        console.error('Failed to fetch user profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="container mt-5"><p>Loading dashboard...</p></div>;
  if (error) return <div className="container mt-5"><div className="alert alert-danger">Error: {error}</div></div>;
  if (!user) return <div className="container mt-5"><p>No user data found.</p></div>;

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h2>Dashboard</h2>
        </div>
        <div className="card-body">
          <h5 className="card-title">Welcome, {user.username}!</h5>
          <p className="card-text">Email: {user.email}</p>
          {user.age && <p className="card-text">Age: {user.age}</p>}
          {user.height && <p className="card-text">Height: {user.height} cm</p>}
          {user.weight && <p className="card-text">Weight: {user.weight} kg</p>}
          {user.fitnessLevel && <p className="card-text">Fitness Level: {user.fitnessLevel}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;