import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/signup', {
        email,
        password,
      });
      // אחרי הרשמה מוצלחת - עוברים אוטומטית להתחברות
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div>
      <h2>הרשמה</h2>
      <form onSubmit={handleSignup}>
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
        <button type="submit">sign up</button>
      </form>
      <p> כבר רשום? <Link to="/login">התחבר כאן</Link></p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div> // לשנות צבע ועיצוב
  );
};

export default Signup;
