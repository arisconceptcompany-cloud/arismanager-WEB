import { useState, useEffect } from 'react';
import { getConges, getCongesPending, approveConge, rejectConge, createConge, deleteConge, getCongeTypes } from '../services/api';
import { getAllEmployes } from '../services/api';
import './Pages.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

function Conge() {
  const [conges, setConges] = useState([]);
  const [filteredConges, setFilteredConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedConge, setSelectedConge] = useState(null);
  const [filter, setFilter] = useState('all');
  const [newConge, setNewConge] = useState({
    employee_id: '',
    type_conge: 'Congé annuel',
    date_debut: '',
    date_fin: '',
    motif: ''
  });
  const [employees, setEmployees] = useState([]);
  const [congeTypes, setCongeTypes] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadCongesOnly, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterConges();
  }, [conges, filter]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [congesData, employeesData, typesData] = await Promise.all([
        getConges(),
        getAllEmployes(),
        getCongeTypes()
      ]);
      setConges(congesData);
      setEmployees(employeesData);
      const defaultTypes = ['Congé annuel', 'Congé maladie', 'Congé sans solde', 'Congé maternite', 'Congé paternite'];
      setCongeTypes(typesData && typesData.length > 0 ? typesData : defaultTypes);
    } catch (error) {
      console.error('Error loading data:', error);
      setCongeTypes(['Congé annuel', 'Congé maladie', 'Congé sans solde', 'Congé maternite', 'Congé paternite']);
    } finally {
      setLoading(false);
    }
  };

  const loadCongesOnly = async () => {
    try {
      const data = await getConges();
      const prevCount = conges.filter(c => c.statut === 'en_attente').length;
      setConges(data);
      const newCount = data.filter(c => c.statut === 'en_attente').length;
      if (newCount > prevCount) {
        showToast('Nouvelle demande de congé reçue!', 'info');
      }
    } catch (error) {
      console.error('Error loading conges:', error);
    }
  };

  const filterConges = () => {
    if (filter === 'all') {
      setFilteredConges(conges);
    } else {
      setFilteredConges(conges.filter(c => c.statut === filter));
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveConge(id);
      await loadCongesOnly();
      showToast('Congé approuvé avec succès!');
    } catch (error) {
      console.error('Error approving conge:', error);
      showToast('Erreur lors de l\'approbation', 'danger');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await rejectConge(id);
      await loadCongesOnly();
      showToast('Congé rejeté', 'warning');
    } catch (error) {
      console.error('Error rejecting conge:', error);
      showToast('Erreur lors du rejet', 'danger');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande de congé?')) return;
    try {
      await deleteConge(id);
      await loadCongesOnly();
      showToast('Congé supprimé', 'warning');
    } catch (error) {
      console.error('Error deleting conge:', error);
      showToast('Erreur lors de la suppression', 'danger');
    }
  };

  const handleNewConge = async (e) => {
    e.preventDefault();
    try {
      await createConge(newConge);
      setShowNewModal(false);
      setNewConge({
        employee_id: '',
        type_conge: 'Congé annuel',
        date_debut: '',
        date_fin: '',
        motif: ''
      });
      await loadCongesOnly();
      showToast('Demande de congé créée');
    } catch (error) {
      console.error('Error creating conge:', error);
      showToast('Erreur lors de la création', 'danger');
    }
  };

  const openDetail = (conge) => {
    setSelectedConge(conge);
    setShowDetailModal(true);
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'approuve':
        return <span className="badge bg-success">Approuvé</span>;
      case 'rejete':
        return <span className="badge bg-danger">Rejeté</span>;
      case 'en_attente':
      default:
        return <span className="badge bg-warning">En attente</span>;
    }
  };

  const pendingCount = conges.filter(c => c.statut === 'en_attente').length;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <ToastContainer position="top-end" className="p-3">
        <Toast 
          show={toast.show} 
          onClose={() => setToast({ ...toast, show: false })}
          bg={toast.type}
          delay={4000}
          autohide
        >
          <Toast.Body className="text-white">
            <i className={`fa fa-${toast.type === 'success' ? 'check-circle' : toast.type === 'danger' ? 'exclamation-circle' : toast.type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title">Gestion des Congés</h2>
          {pendingCount > 0 && (
            <span className="badge bg-warning ms-2">
              <i className="fa fa-bell me-1"></i>
              {pendingCount} en attente
            </span>
          )}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={loadData}>
            <i className="fa fa-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <i className="fa fa-plus"></i> Nouvelle demande
          </button>
        </div>
      </div>
      
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex gap-3 flex-wrap">
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              Tous ({conges.length})
            </button>
            <button 
              className={`btn ${filter === 'en_attente' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setFilter('en_attente')}
            >
              <i className="fa fa-clock me-1"></i>
              En attente ({conges.filter(c => c.statut === 'en_attente').length})
            </button>
            <button 
              className={`btn ${filter === 'approuve' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('approuve')}
            >
              <i className="fa fa-check me-1"></i>
              Approuvés ({conges.filter(c => c.statut === 'approuve').length})
            </button>
            <button 
              className={`btn ${filter === 'rejete' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFilter('rejete')}
            >
              <i className="fa fa-times me-1"></i>
              Rejetés ({conges.filter(c => c.statut === 'rejete').length})
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Type de congé</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Jours</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConges.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      <i className="fa fa-calendar-times-o" style={{ fontSize: '2rem' }}></i>
                      <p className="mt-2 mb-0">Aucune demande de congé trouvée</p>
                    </td>
                  </tr>
                ) : (
                  filteredConges.map((conge) => (
                    <tr key={conge.id} className={conge.statut === 'en_attente' ? 'table-warning' : ''}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-circle me-2">
                            {conge.nom?.[0]}{conge.prenom?.[0]}
                          </div>
                          <div>
                            <strong>{conge.nom} {conge.prenom}</strong>
                            <br />
                            <small className="text-muted">{conge.badge_id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold">{conge.type_conge}</span>
                      </td>
                      <td>{new Date(conge.date_debut).toLocaleDateString('fr-FR')}</td>
                      <td>{new Date(conge.date_fin).toLocaleDateString('fr-FR')}</td>
                      <td><strong>{conge.jours_calcules}</strong> jours</td>
                      <td>
                        {getStatutBadge(conge.statut)}
                      </td>
                      <td className="text-nowrap">
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary" 
                            onClick={() => openDetail(conge)}
                            title="Voir détails"
                          >
                            <i className="fa fa-eye me-1"></i>Voir
                          </button>
                          {conge.statut === 'en_attente' && (
                            <>
                              <button 
                                className="btn btn-success" 
                                onClick={() => handleApprove(conge.id)}
                                disabled={actionLoading === conge.id}
                                title="Approuver"
                              >
                                {actionLoading === conge.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <>
                                    <i className="fa fa-check me-1"></i>Approuver
                                  </>
                                )}
                              </button>
                              <button 
                                className="btn btn-danger" 
                                onClick={() => handleReject(conge.id)}
                                disabled={actionLoading === conge.id}
                                title="Rejeter"
                              >
                                <i className="fa fa-ban me-1"></i>Rejeter
                              </button>
                            </>
                          )}
                          <button 
                            className="btn btn-outline-dark" 
                            onClick={() => handleDelete(conge.id)}
                            title="Supprimer"
                          >
                            <i className="fa fa-trash me-1"></i>Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Détails de la demande</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedConge && (
            <div>
              <div className="text-center mb-4">
                <div className="avatar-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                  {selectedConge.nom?.[0]}{selectedConge.prenom?.[0]}
                </div>
                <h4 className="mt-2 mb-0">{selectedConge.nom} {selectedConge.prenom}</h4>
                <p className="text-muted mb-0">{selectedConge.badge_id} - {selectedConge.poste}</p>
              </div>
              
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <td className="fw-bold" style={{ width: '40%' }}>Type de congé</td>
                    <td>{selectedConge.type_conge}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Date de début</td>
                    <td>{new Date(selectedConge.date_debut).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Date de fin</td>
                    <td>{new Date(selectedConge.date_fin).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Nombre de jours</td>
                    <td><strong>{selectedConge.jours_calcules}</strong> jours</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Statut</td>
                    <td>{getStatutBadge(selectedConge.statut)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Motif</td>
                    <td>{selectedConge.motif || <em className="text-muted">Aucun motif fourni</em>}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Date de demande</td>
                    <td>{new Date(selectedConge.created_at).toLocaleDateString('fr-FR')} à {new Date(selectedConge.created_at).toLocaleTimeString('fr-FR')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
          {selectedConge?.statut === 'en_attente' && (
            <>
              <Button variant="danger" onClick={() => {
                handleReject(selectedConge.id);
                setShowDetailModal(false);
              }}>
                <i className="fa fa-times me-2"></i>Rejeter
              </Button>
              <Button variant="success" onClick={() => {
                handleApprove(selectedConge.id);
                setShowDetailModal(false);
              }}>
                <i className="fa fa-check me-2"></i>Approuver
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={showNewModal} onHide={() => setShowNewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle demande de congé</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleNewConge}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Employé</Form.Label>
              <Form.Select 
                value={newConge.employee_id} 
                onChange={(e) => setNewConge({...newConge, employee_id: e.target.value})}
                required
              >
                <option value="">Sélectionner un employé</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom} {emp.prenom} ({emp.badge_id})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type de congé</Form.Label>
              <Form.Select 
                value={newConge.type_conge} 
                onChange={(e) => setNewConge({...newConge, type_conge: e.target.value})}
                required
              >
                {congeTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date de début</Form.Label>
              <Form.Control 
                type="date" 
                value={newConge.date_debut}
                onChange={(e) => setNewConge({...newConge, date_debut: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date de fin</Form.Label>
              <Form.Control 
                type="date" 
                value={newConge.date_fin}
                onChange={(e) => setNewConge({...newConge, date_fin: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Motif (optionnel)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={newConge.motif}
                onChange={(e) => setNewConge({...newConge, motif: e.target.value})}
                placeholder="Raison du congé..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Créer la demande
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Conge;
