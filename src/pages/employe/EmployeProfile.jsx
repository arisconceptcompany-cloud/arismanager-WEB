import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeLayout from '../../components/EmployeLayout';
import { uploadEmployeePhoto, changeEmployePassword } from '../../services/api';

function EmployeProfile() {
  const [employe, setEmploye] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('employe_token');
    const empData = localStorage.getItem('employe_data');
    
    if (!token || !empData) {
      navigate('/employe-login');
      return;
    }

    try {
      const response = await fetch(`/api/employe/profile/${token}`);
      if (response.ok) {
        const data = await response.json();
        setEmploye(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Tous les champs sont requis');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('employe_token');
      await changeEmployePassword(token, passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !employe) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'danger', text: 'Veuillez sélectionner une image' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'danger', text: 'L\'image ne doit pas dépasser 5 Mo' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const result = await uploadEmployeePhoto(employe.id, file);
      if (result.success) {
        setEmploye({ ...employe, photo: result.photo + '?' + Date.now() });
        setMessage({ type: 'success', text: 'Photo mise à jour avec succès' });
      } else {
        setMessage({ type: 'danger', text: result.error || 'Erreur lors de l\'upload' });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'danger', text: 'Erreur lors de la mise à jour de la photo' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  return (
    <EmployeLayout>
      <div className="page-container">
        <h2 className="page-title">Mon Profil</h2>
        
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}
        
        <div className="row">
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <div className="mb-4 position-relative">
                  {employe?.photo ? (
                    <div className="position-relative d-inline-block">
                      <img 
                        src={employe.photo}
                        alt="Photo de profil"
                        className="rounded-circle"
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center" 
                         style={{ width: '120px', height: '120px' }}>
                      <span className="text-white" style={{ fontSize: '3rem' }}>
                        {employe?.prenom?.[0]}{employe?.nom?.[0]}
                      </span>
                    </div>
                  )}
                  <button 
                    className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"
                    onClick={handlePhotoClick}
                    disabled={uploading}
                    style={{ width: '36px', height: '36px', padding: '0', lineHeight: '36px' }}
                    title="Modifier la photo"
                  >
                    {uploading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="fa fa-camera"></i>
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
                <h4>{employe?.prenom} {employe?.nom}</h4>
                <p className="text-muted">{employe?.poste}</p>
                <hr />
                <p className="mb-1"><strong>Badge:</strong> {employe?.badge_id}</p>
                <p className="mb-1"><strong>Catégorie:</strong> {employe?.categorie || 'Non définie'}</p>
              </div>
            </div>
          </div>
          
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0"><i className="fa fa-user me-2"></i>Informations Personnelles</h5>
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold" style={{ width: '200px' }}>Nom complet</td>
                      <td>{employe?.prenom} {employe?.nom}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Email</td>
                      <td>{employe?.email || 'Non renseigné'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Téléphone</td>
                      <td>{employe?.telephone || 'Non renseigné'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Adresse</td>
                      <td>{employe?.adresse || 'Non renseignée'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0"><i className="fa fa-briefcase me-2"></i>Informations Professionnelles</h5>
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold" style={{ width: '200px' }}>Poste</td>
                      <td>{employe?.poste || 'Non défini'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Équipe/Département</td>
                      <td>{employe?.equipe || 'Non défini'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Date d'embauche</td>
                      <td>{employe?.date_embauche || 'Non renseignée'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Catégorie</td>
                      <td>{employe?.categorie || 'Non définie'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0"><i className="fa fa-id-card me-2"></i>Documents</h5>
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold" style={{ width: '200px' }}>CIN</td>
                      <td>{employe?.cin || 'Non renseigné'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Numéro CNAPS</td>
                      <td>{employe?.num_cnaps || 'Non renseigné'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Date de naissance</td>
                      <td>{employe?.date_naissance || 'Non renseignée'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card mt-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><i className="fa fa-lock me-2"></i>Sécurité</h5>
                <button className="btn btn-sm btn-primary" onClick={() => setShowPasswordModal(true)}>
                  <i className="fa fa-key me-1"></i> Changer le mot de passe
                </button>
              </div>
            </div>
          </div>
        </div>

        {showPasswordModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Changer le mot de passe</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }}></button>
                </div>
                <form onSubmit={handlePasswordChange}>
                  <div className="modal-body">
                    {passwordError && <div className="alert alert-danger">{passwordError}</div>}
                    {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
                    <div className="mb-3">
                      <label className="form-label">Mot de passe actuel</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Nouveau mot de passe</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirmer le nouveau mot de passe</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); }}>
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                      {changingPassword ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa fa-save me-2"></i>}
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeLayout>
  );
}

export default EmployeProfile;
