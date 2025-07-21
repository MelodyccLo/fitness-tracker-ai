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

  if (loading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!user) return <div className="p-4">No user data found.</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user.username}!</h1>
      <p>Email: {user.email}</p>
      {user.age && <p>Age: {user.age}</p>}
      {user.height && <p>Height: {user.height} cm</p>}
      {user.weight && <p>Weight: {user.weight} kg</p>}
      {user.fitnessLevel && <p>Fitness Level: {user.fitnessLevel}</p>}
      {/* Add more dashboard content here */}
    </div>
  );
};

export default Dashboard;