import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import Bg from '../components/Bg';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      console.log('Login result:', result);
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Bg>
      <div className="auth-wrapper">
        <div className="auth-card-custom auth-admin">
          <div className="auth-type-banner admin-banner">
            <i className="fa fa-shield-alt me-2"></i>Espace Administrateur
          </div>
          <div className="auth-header-custom text-center mb-4">
            <img src="/logoA.ico" alt="ARIS" width="60" height="60" />
            <h3 className="mt-3">ARIS Manager</h3>
            <p className="text-muted">Connexion à votre compte</p>
          </div>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Email</label>
              <div className="input-group">
                <span className="input-group-text"><i className="fa fa-envelope"></i></span>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aris-cc.com"
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Mot de passe</label>
              <div className="input-group">
                <span className="input-group-text"><i className="fa fa-lock"></i></span>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="mb-0">Pas de compte ? <Link to="/register">S'inscrire</Link></p>
          </div>
          <hr />
          <div className="text-center">
            <Link to="/" className="btn btn-outline-secondary btn-sm w-100">
              <i className="fa fa-arrow-left"></i> Choisir un autre espace
            </Link>
          </div>
        </div>
      </div>
    </Bg>
  );
}

export default Login;
