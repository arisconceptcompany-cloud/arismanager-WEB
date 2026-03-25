import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Bg from '../../components/Bg';
import '../../pages/Auth.css';

function EmployeRegister() {
  const [formData, setFormData] = useState({
    badge_code: '',
    email: '',
    password: '',
    confirm_password: '',
    code: ''
  });
  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email domain
    if (!formData.email.toLowerCase().endsWith('@aris-cc.com')) {
      setError('L\'email doit être de la forme @aris-cc.com');
      setLoading(false);
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/employe/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badge_code: formData.badge_code,
          email: formData.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'envoi du code');
        return;
      }

      setEmployeeId(data.employeeId);
      setStep(2);
      setCodeSent(true);
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/employe/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          code: formData.code,
          badge_code: formData.badge_code,
          password: formData.password,
          confirm_password: formData.confirm_password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la vérification');
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

  const resendCode = async () => {
    if (countdown > 0) return;
    setFormData({ ...formData, code: '' });
    await handleSendCode({ preventDefault: () => {} });
  };

  return (
    <Bg>
      <div className="auth-wrapper">
        <div className="auth-card-custom">
          <div className="auth-header-custom text-center mb-4">
            <img src="/logoA.ico" alt="ARIS" width="60" height="60" />
            <h3 className="mt-3">Créer un compte</h3>
            <p className="text-muted">
              {step === 1 && 'Étape 1: Vérification de l\'email'}
              {step === 2 && 'Étape 2: Entrez le code de vérification'}
            </p>
          </div>

          <div className="progress mb-4" style={{ height: '10px' }}>
            <div 
              className={`progress-bar ${step === 1 ? 'bg-primary' : 'bg-success'}`} 
              role="progressbar" 
              style={{ width: step === 1 ? '33%' : '66%' }}
            ></div>
          </div>
          
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {step === 1 && (
            <form onSubmit={handleSendCode}>
              <div className="mb-3">
                <label className="form-label">Matricule</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa fa-id-badge"></i> ARIS-</span>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.badge_code}
                    onChange={(e) => setFormData({...formData, badge_code: e.target.value})}
                    placeholder="0001"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa fa-envelope"></i></span>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="prenom.nom@aris-cc.com"
                    required
                  />
                </div>
                <small className="text-muted">
                  Utilisez votre email d'entreprise (@aris-cc.com)
                </small>
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
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Confirmer le mot de passe</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa fa-lock"></i></span>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    placeholder="Confirmez votre mot de passe"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le code de vérification'}
              </button>
            </form>
          )}
          
          {step === 2 && (
            <form onSubmit={handleVerify}>
              <div className="alert alert-info mb-3">
                <i className="fa fa-info-circle me-2"></i>
                Un code de vérification a été envoyé à <strong>{formData.email}</strong>
                <br />
                <small>Vérifiez votre boîte email (y compris les spams)</small>
              </div>

              <div className="mb-3">
                <label className="form-label">Code de vérification</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa fa-key"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                    placeholder="Entrez le code à 6 chiffres"
                    maxLength={6}
                    required
                    style={{ fontSize: '1.5rem', letterSpacing: '5px', textAlign: 'center' }}
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
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Confirmer le mot de passe</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fa fa-lock"></i></span>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    placeholder="Confirmez votre mot de passe"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-success w-100" 
                disabled={loading || formData.code.length !== 6}
              >
                {loading ? 'Vérification...' : 'Créer mon compte'}
              </button>
              
              <div className="text-center mt-3">
                {countdown > 0 ? (
                  <small className="text-muted">
                    Renvoyer le code dans {countdown}s
                  </small>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-link btn-sm"
                    onClick={resendCode}
                  >
                    <i className="fa fa-refresh me-1"></i>Renvoyer le code
                  </button>
                )}
              </div>
              
              <button 
                type="button" 
                className="btn btn-link w-100 mt-2"
                onClick={() => {
                  setStep(1);
                  setEmployeeId(null);
                  setError('');
                  setFormData({ ...formData, code: '' });
                }}
              >
                <i className="fa fa-arrow-left"></i> Retour
              </button>
            </form>
          )}
          
          <div className="text-center mt-3">
            <p className="mb-0">
              Déjà un compte ? <Link to="/employe-login">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </Bg>
  );
}

export default EmployeRegister;
