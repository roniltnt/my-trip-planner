import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', res.data.token);
      navigate('/planner'); // מעביר למסך אחר אחרי התחברות
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div>
      <h2>התחברות</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter your email:"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />
        <input
          type="password"
          placeholder="Enter your password:"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <button type="submit">login</button>
      </form>
      <p> עדיין לא רשום? <Link to="/signup">הרשם כאן</Link></p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div> // לשנות צבע ועיצוב
  );
};

export default Login;
