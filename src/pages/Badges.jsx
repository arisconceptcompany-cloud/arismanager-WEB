import { useState, useEffect } from 'react';
import { getAllEmployes, getBadgeQR, downloadBadgePdf } from '../services/api';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import './Pages.css';
import './Badges.css';

function Badges() {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCodes, setQrCodes] = useState({});
  const [loadingQR, setLoadingQR] = useState({});
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badgeQR, setBadgeQR] = useState(null);

  useEffect(() => {
    loadEmployes();
  }, []);

  const loadEmployes = async () => {
    try {
      const data = await getAllEmployes();
      setEmployes(data || []);
    } catch (error) {
      console.error('Error loading employes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employes.length > 0) {
      employes.forEach(emp => {
        if (!qrCodes[emp.badge_id] && !loadingQR[emp.badge_id]) {
          loadQRCode(emp.badge_id);
        }
      });
    }
  }, [employes]);

  const loadQRCode = async (badgeId) => {
    if (loadingQR[badgeId]) return;
    setLoadingQR(prev => ({ ...prev, [badgeId]: true }));
    try {
      const data = await getBadgeQR(badgeId);
      if (data && data.qr) {
        setQrCodes(prev => ({ ...prev, [badgeId]: data.qr }));
      }
    } catch (error) {
      console.error('Error loading QR:', error);
    } finally {
      setLoadingQR(prev => ({ ...prev, [badgeId]: false }));
    }
  };

  const handleViewBadge = async (emp) => {
    setSelectedBadge(emp);
    setBadgeQR(null);
    setShowBadgeModal(true);
    try {
      const data = await getBadgeQR(emp.badge_id);
      if (data && data.qr) {
        setBadgeQR(data.qr);
      }
    } catch (error) {
      console.error('Error loading badge QR:', error);
    }
  };

  const handleDownloadPdf = async (badgeId) => {
    const success = await downloadBadgePdf(badgeId);
    if (!success) {
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  const handleViewExemple = () => {
    window.open('/badge-exemple', '_blank');
  };

  const filteredEmployes = employes
    .slice()
    .sort((a, b) => (a.badge_id || '').localeCompare(b.badge_id || ''))
    .filter(emp => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        emp.nom?.toLowerCase().includes(term) ||
        emp.prenom?.toLowerCase().includes(term) ||
        emp.badge_id?.toLowerCase().includes(term) ||
        emp.poste?.toLowerCase().includes(term)
      );
    });

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Badges & QR Codes</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={handleViewExemple}>
            <i className="fa fa-id-card me-2"></i>Voir exemple de badge
          </Button>
        </div>
      </div>

      <div className="alert alert-info mb-4">
        <i className="fa fa-info-circle me-2"></i>
        Chaque employé possède un badge ID unique. Scannez le QR code pour enregistrer une entrée ou sortie.
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom, prénom, badge ou poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <span className="badge bg-primary fs-6">
                {filteredEmployes.length} badge(s)
              </span>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="badges-grid">
            {filteredEmployes.length === 0 ? (
              <div className="text-center py-5 w-100">
                <i className="fa fa-id-card fa-2x text-muted mb-2"></i>
                <p className="mb-0 text-muted">Aucun employé trouvé</p>
              </div>
            ) : (
              filteredEmployes.map((emp) => (
                <div key={emp.id} className="badge-card">
                  <div className="badge-qr-container">
                    {qrCodes[emp.badge_id] ? (
                      <img src={qrCodes[emp.badge_id]} alt={`QR ${emp.badge_id}`} className="qr-image" />
                    ) : (
                      <div className="qr-placeholder">
                        <i className="fa fa-spinner fa-spin"></i>
                      </div>
                    )}
                  </div>
                  <div className="badge-info">
                    <h6 className="mb-1">{emp.prenom} {emp.nom}</h6>
                    <code className="badge-id">{emp.badge_id}</code>
                    <p className="mb-1 text-muted small">{emp.poste || '-'}</p>
                  </div>
                  <div className="badge-actions">
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => handleViewBadge(emp)}
                      title="Voir la fiche badge"
                    >
                      <i className="fa fa-eye"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleDownloadPdf(emp.badge_id)}
                      title="Télécharger PDF"
                    >
                      <i className="fa fa-download"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {employes.length === 0 && (
        <div className="alert alert-warning text-center">
          <i className="fa fa-exclamation-triangle me-2"></i>
          Aucun employé pour l'instant. Ajoutez des employés pour créer leurs badges.
        </div>
      )}

      <Modal show={showBadgeModal} onHide={() => setShowBadgeModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Fiche Badge - {selectedBadge?.badge_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedBadge && (
            <>
              <div className="badge-print-container">
                <div className="badge-print">
                  <div className="badge-top">
                    <div className="badge-photo">
                      {selectedBadge.photo ? (
                        <img src={selectedBadge.photo} alt="" />
                      ) : (
                        <span>
                          {((selectedBadge.prenom || '')[0] || '')}{((selectedBadge.nom || '')[0] || '')}
                        </span>
                      )}
                    </div>
                    <div className="badge-info-wrap">
                      <p className="badge-id-text">
                        {selectedBadge.id_affichage != null 
                          ? `ID:${String(selectedBadge.id_affichage).padStart(4, '0')}`
                          : selectedBadge.badge_id
                        }
                      </p>
                      <p className="badge-nom">{(selectedBadge.nom || '').toUpperCase()}</p>
                      <p className="badge-prenom">{(selectedBadge.prenom || '').toUpperCase()}</p>
                      <p className="badge-fonction">{(selectedBadge.poste || '').toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="badge-sep"></div>
                  <div className="badge-bottom">
                    <img src="/logo.png" alt="ARIS" className="badge-logo" />
                    <div className="badge-adresse-wrap">
                      <svg className="badge-pin" viewBox="0 0 24 24">
                        <circle cx="12" cy="10" r="4" fill="#4da6ff"/>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#e74c3c" stroke="#c0392b" strokeWidth="0.5"/>
                      </svg>
                      <p className="badge-adresse">Lot II T 104 A lavoloha<br/>Antananarivo 102</p>
                    </div>
                    {badgeQR && (
                      <div className="badge-qr">
                        <img src={badgeQR} alt="QR" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-2 mt-4">
                <Button variant="primary" onClick={() => handleDownloadPdf(selectedBadge.badge_id)}>
                  <i className="fa fa-download me-2"></i>Télécharger PDF
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <i className="fa fa-print me-2"></i>Imprimer
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Badges;
