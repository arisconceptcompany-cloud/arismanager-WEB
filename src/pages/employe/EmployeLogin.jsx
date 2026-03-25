import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Bg from '../../components/Bg';
import '../../pages/Auth.css';

function EmployeLogin() {
  const [formData, setFormData] = useState({
    badge_code: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/employe/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }

      localStorage.setItem('employe_token', data.token);
      localStorage.setItem('employe_data', JSON.stringify(data.employee));
      navigate('/employe/dashboard');
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Bg>
      <div className="auth-wrapper">
        <div className="auth-card-custom auth-employee">
          <div className="auth-type-banner employee-banner">
            <i className="fa fa-user-tie me-2"></i>Espace Employé
          </div>
          <div className="auth-header-custom text-center mb-4">
            <img src="/logo.png" alt="ARIS" width="60" height="60" />
            <h3 className="mt-3">Espace Employé</h3>
            <p className="text-muted">Connectez-vous à votre compte</p>
          </div>
          
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Matricule</label>
              <div className="input-group">
                <span className="input-group-text"><i className="fa fa-id-badge"></i></span>
                <input
                  type="text"
                  className="form-control"
                  value={formData.badge_code}
                  onChange={(e) => setFormData({...formData, badge_code: e.target.value})}
                  placeholder="Ex: ARIS-0001 ou 1"
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
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Votre mot de passe"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-100" 
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <p className="mb-2">
              Pas encore de compte ? <Link to="/employe-register">Créer un compte</Link>
            </p>
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

export default EmployeLogin;
