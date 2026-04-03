import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [employe, setEmploye] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    const token = localStorage.getItem('employe_token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/api/employe/profile/' + token);
      if (response.ok) {
        const data = await response.json();
        setEmploye(data);
        localStorage.setItem('employe_data', JSON.stringify(data));
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
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
    <div className="page-container">
      <h2 className="page-title">Mon Profil</h2>
      
      <div className="row">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <div className="mb-4">
                {employe?.photo ? (
                  <img 
                    src={employe.photo}
                    alt="Photo de profil"
                    className="rounded-circle"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '120px', height: '120px' }}>
                    <span className="text-white" style={{ fontSize: '3rem' }}>
                      {employe?.prenom?.[0]}{employe?.nom?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <h4>{employe?.prenom} {employe?.nom}</h4>
              <p className="text-muted">{employe?.poste}</p>
              {employe?.is_admin && (
                <span className="badge bg-danger"><i className="fa fa-shield-alt me-1"></i>Administrateur</span>
              )}
              <hr />
              <p className="mb-1"><strong>Badge:</strong> {employe?.badge_id}</p>
              <p className="mb-1"><strong>Categorie:</strong> {employe?.categorie || 'Non definie'}</p>
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
                    <td>{employe?.email || 'Non renseigne'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Telephone</td>
                    <td>{employe?.telephone || 'Non renseigne'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Adresse</td>
                    <td>{employe?.adresse || 'Non renseignee'}</td>
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
                    <td>{employe?.poste || 'Non defini'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Equipe ou departement</td>
                    <td>{employe?.equipe || 'Non defini'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Date d'embauche</td>
                    <td>{employe?.date_embauche || 'Non renseignee'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Categorie</td>
                    <td>{employe?.categorie || 'Non definie'}</td>
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
                    <td>{employe?.cin || 'Non renseigne'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Numero CNAPS</td>
                    <td>{employe?.num_cnaps || 'Non renseigne'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Date de naissance</td>
                    <td>{employe?.date_naissance || 'Non renseignee'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
