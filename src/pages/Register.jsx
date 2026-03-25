import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, verifyCode } from '../services/api';
import Bg from '../components/Bg';
import './Register.css';

function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState('');
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@aris-cc.com')) {
      setError('Utilisez une adresse email @aris-cc.com');
      return;
    }

    if (!nom.trim()) {
      setError('Le nom est requis');
      return;
    }

    if (!validatePassword(password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const result = await register({ nom: nom.trim(), email, password });
      setDebugCode(result.debug_code || '');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyCode(email, code);
      alert('Compte administrateur créé avec succès !');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Bg>
      <div className="register-container">
        <div className="register-card">
          <div className="register-header text-center">
            <img src="/logoA.ico" alt="ARIS" width="50" height="50" />
            <h4>ARIS Manager</h4>
            <p className="text-muted">{step === 1 ? 'Créer un compte Admin' : 'Vérification'}</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRegister}>
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="alert alert-info mb-3">
                <i className="fa fa-info-circle me-2"></i>
                <strong>Compte Administrateur</strong>
                <p className="mb-0 mt-1 small">Ce compte sera configuré comme administrateur ou responsable du système.</p>
              </div>

              <div className="mb-3">
                <label className="form-label">Nom complet *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nom} 
                  onChange={(e) => setNom(e.target.value)} 
                  placeholder="Votre nom complet"
                  required 
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="votre.email@aris-cc.com" 
                  required 
                />
                <small className="text-muted">Utilisez une adresse email @aris-cc.com</small>
              </div>

              <div className="mb-3">
                <label className="form-label">Mot de passe *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
                <small className="text-muted">
                  Minimum 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Confirmer le mot de passe *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <i className="fa fa-user-plus me-2"></i>
                    Créer le compte
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              {error && <div className="alert alert-danger">{error}</div>}
              
              {debugCode && (
                <div className="alert alert-warning">
                  <strong>Mode debug:</strong> Code: <span className="font-monospace fs-5">{debugCode}</span>
                  <hr className="my-2"/>
                  <small>Ce code apparaît car l'envoi d'email n'est pas configuré.</small>
                </div>
              )}

              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="fa fa-envelope-open-text fa-3x text-primary"></i>
                </div>
                <p className="text-muted">
                  Un code de vérification a été envoyé à:<br/>
                  <strong>{email}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="form-label text-center d-block">Code de vérification</label>
                <input 
                  type="text" 
                  className="form-control text-center" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="_ _ _ _ _ _" 
                  maxLength={6} 
                  style={{ letterSpacing: '10px', fontSize: '24px' }} 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-success w-100 mb-2" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Vérification...
                  </>
                ) : (
                  <>
                    <i className="fa fa-check me-2"></i>
                    Vérifier
                  </>
                )}
              </button>

              <button type="button" className="btn btn-outline-secondary w-100" onClick={() => setStep(1)}>
                <i className="fa fa-arrow-left me-2"></i>
                Retour
              </button>
            </form>
          )}

          <div className="text-center mt-3">
            <p className="mb-0">Déjà un compte ? <Link to="/login">Se connecter</Link></p>
          </div>
        </div>
      </div>
    </Bg>
  );
}

export default Register;
