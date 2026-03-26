import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeLayout from '../../components/EmployeLayout';
import { FaPlus, FaEye, FaEdit, FaTrash, FaSearch, FaChartLine, FaClock, FaCheckCircle, FaHourglass, FaUsers } from 'react-icons/fa';

function EmployeProjets() {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingProjet, setEditingProjet] = useState(null);
  const [selectedProjet, setSelectedProjet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    client: '',
    date_debut: '',
    date_fin_prevue: '',
    statut: 'en_attente',
    employes: []
  });

  useEffect(() => {
    const token = localStorage.getItem('employe_token');
    if (!token) {
      navigate('/employe-login');
      return;
    }
    loadData();
  }, [navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 4000);
  };

  const loadData = async () => {
    const token = localStorage.getItem('employe_token');
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/employe/projets/${token}`);
      if (response.ok) {
        const data = await response.json();
        setProjets(data || []);
      } else {
        showToast('Erreur lors du chargement des projets', 'danger');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erreur de connexion', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (projet = null) => {
    if (projet) {
      setEditingProjet(projet);
      setFormData({
        nom: projet.nom || '',
        description: projet.description || '',
        client: projet.client || '',
        date_debut: projet.date_debut || '',
        date_fin_prevue: projet.date_fin_prevue || '',
        statut: projet.statut || 'en_attente',
        employes: projet.employes ? projet.employes.split(',').map(e => e.trim()) : []
      });
    } else {
      setEditingProjet(null);
      setFormData({
        nom: '',
        description: '',
        client: '',
        date_debut: '',
        date_fin_prevue: '',
        statut: 'en_attente',
        employes: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProjet(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('employe_token');
    if (!token) return;

    try {
      const projetData = {
        ...formData,
        employes: formData.employes.join(',')
      };

      const url = editingProjet
        ? `/api/employe/projets/${token}/${editingProjet.id}`
        : `/api/employe/projets/${token}`;
      
      const method = editingProjet ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projetData)
      });

      if (response.ok) {
        showToast(editingProjet ? 'Projet mis à jour avec succès' : 'Projet créé avec succès');
        handleCloseModal();
        loadData();
      } else {
        const data = await response.json();
        showToast(data.error || 'Erreur lors de l\'enregistrement', 'danger');
      }
    } catch (error) {
      console.error('Error saving projet:', error);
      showToast('Erreur de connexion', 'danger');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('employe_token');
    if (!token) return;

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      try {
        const response = await fetch(`/api/employe/projets/${token}/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showToast('Projet supprimé avec succès');
          loadData();
        } else {
          const data = await response.json();
          showToast(data.error || 'Erreur lors de la suppression', 'danger');
        }
      } catch (error) {
        console.error('Error deleting projet:', error);
        showToast('Erreur de connexion', 'danger');
      }
    }
  };

  const handleEmployeeToggle = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      employes: prev.employes.includes(employeeId)
        ? prev.employes.filter(id => id !== employeeId)
        : [...prev.employes, employeeId]
    }));
  };

  const filteredProjets = projets.filter(projet =>
    projet.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    projet.client?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatutBadge = (statut) => {
    const badges = {
      'en_cours': 'bg-primary',
      'termine': 'bg-success',
      'en_attente': 'bg-warning text-dark',
      'annule': 'bg-danger'
    };
    const icons = {
      'en_cours': <FaClock className="me-1" />,
      'termine': <FaCheckCircle className="me-1" />,
      'en_attente': <FaHourglass className="me-1" />,
      'annule': <FaTrash className="me-1" />
    };
    const labels = {
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'en_attente': 'En attente',
      'annule': 'Annulé'
    };
    return (
      <span className={`badge ${badges[statut] || 'bg-secondary'} d-inline-flex align-items-center`}>
        {icons[statut]}{labels[statut] || statut}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const stats = {
    total: projets.length,
    enCours: projets.filter(p => p.statut === 'en_cours').length,
    termines: projets.filter(p => p.statut === 'termine').length,
    enAttente: projets.filter(p => p.statut === 'en_attente').length
  };

  if (loading) {
    return (
      <EmployeLayout>
        <div className="page-container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      </EmployeLayout>
    );
  }

  return (
    <EmployeLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <FaChartLine className="me-2" />
              Mes Projets
            </h1>
            <p className="text-muted mb-0">Gérez vos projets et collaborez avec vos collègues</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
            <FaPlus /> Nouveau Projet
          </button>
        </div>

        <div className="row mb-4">
          <div className="col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '50px', height: '50px' }}>
                  <FaChartLine className="text-primary fs-5" />
                </div>
                <h3 className="mb-1">{stats.total}</h3>
                <p className="text-muted mb-0 small">Total</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className="rounded-circle bg-warning bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '50px', height: '50px' }}>
                  <FaClock className="text-warning fs-5" />
                </div>
                <h3 className="mb-1">{stats.enCours}</h3>
                <p className="text-muted mb-0 small">En Cours</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '50px', height: '50px' }}>
                  <FaCheckCircle className="text-success fs-5" />
                </div>
                <h3 className="mb-1">{stats.termines}</h3>
                <p className="text-muted mb-0 small">Terminés</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="position-relative">
              <FaSearch className="text-muted position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0">Mes Projets ({filteredProjets.length})</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 py-3 px-4">Projet</th>
                    <th className="border-0 py-3">Client</th>
                    <th className="border-0 py-3">Créé par</th>
                    <th className="border-0 py-3">Statut</th>
                    <th className="border-0 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-5">
                        <FaChartLine className="fs-1 mb-3 opacity-25" />
                        <p className="mb-0">Aucun projet trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProjets.map((projet) => (
                      <tr key={projet.id} className="align-middle">
                        <td className="py-3 px-4">
                          <strong className="d-block">{projet.nom}</strong>
                          {projet.description && (
                            <small className="text-muted">{projet.description.substring(0, 40)}{projet.description.length > 40 ? '...' : ''}</small>
                          )}
                        </td>
                        <td>{projet.client || '-'}</td>
                        <td>
                          <span className="badge bg-secondary">
                            <FaUsers className="me-1" />
                            {projet.created_by_name || 'Admin'}
                          </span>
                        </td>
                        <td>{getStatutBadge(projet.statut)}</td>
                        <td>
                          <div className="d-flex justify-content-center gap-1">
                            <button
                              className="btn btn-sm btn-outline-info rounded-circle p-2"
                              onClick={() => {
                                setSelectedProjet(projet);
                                setShowDetailModal(true);
                              }}
                              title="Voir détails"
                              style={{ width: '36px', height: '36px' }}
                            >
                              <FaEye />
                            </button>
                            {projet.created_by_name && (
                              <>
                                <button
                                  className="btn btn-sm btn-outline-warning rounded-circle p-2"
                                  onClick={() => handleOpenModal(projet)}
                                  title="Modifier"
                                  style={{ width: '36px', height: '36px' }}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger rounded-circle p-2"
                                  onClick={() => handleDelete(projet.id)}
                                  title="Supprimer"
                                  style={{ width: '36px', height: '36px' }}
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
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

        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title d-flex align-items-center gap-2">
                    <FaChartLine className="text-primary" />
                    {editingProjet ? 'Modifier le Projet' : 'Nouveau Projet'}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body pt-2">
                    <div className="mb-3">
                      <label className="form-label fw-medium">Nom du projet *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        placeholder="Ex: Site web ARIS"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Décrivez le projet..."
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">Client</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        placeholder="Nom du client"
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label fw-medium">Date de début</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.date_debut}
                            onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label fw-medium">Date de fin prévue</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.date_fin_prevue}
                            onChange={(e) => setFormData({ ...formData, date_fin_prevue: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">Statut</label>
                      <select
                        className="form-select"
                        value={formData.statut}
                        onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                        <option value="annule">Annulé</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">Employés à assigner (optionnel)</label>
                      <div className="border rounded p-3 bg-light" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        <small className="text-muted">IDs des employés (séparés par virgule)</small>
                        <input
                          type="text"
                          className="form-control mt-2"
                          value={formData.employes.join(',')}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            employes: e.target.value.split(',').map(e => e.trim()).filter(e => e) 
                          })}
                          placeholder="1, 2, 3"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-0">
                    <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-primary px-4">
                      {editingProjet ? (
                        <>
                          <FaEdit className="me-2" />
                          Enregistrer
                        </>
                      ) : (
                        <>
                          <FaPlus className="me-2" />
                          Créer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && selectedProjet && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title d-flex align-items-center gap-2">
                    <FaEye className="text-info" />
                    Détails du Projet
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
                </div>
                <div className="modal-body pt-2">
                  <div className="text-center mb-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                      <FaChartLine className="text-primary fs-2" />
                    </div>
                    <h3 className="mb-1">{selectedProjet.nom}</h3>
                    <p className="text-muted mb-0">{selectedProjet.description || 'Aucune description'}</p>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="card bg-light border-0 h-100">
                        <div className="card-body">
                          <h6 className="text-muted mb-2">Client</h6>
                          <p className="mb-0 fw-medium">{selectedProjet.client || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-light border-0 h-100">
                        <div className="card-body">
                          <h6 className="text-muted mb-2">Créé par</h6>
                          <p className="mb-0 fw-medium">
                            <FaUsers className="me-1 text-primary" />
                            {selectedProjet.created_by_name || 'Admin'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-light border-0 h-100">
                        <div className="card-body">
                          <h6 className="text-muted mb-2">Date de début</h6>
                          <p className="mb-0 fw-medium"><FaClock className="me-1 text-primary" />{formatDate(selectedProjet.date_debut)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-light border-0 h-100">
                        <div className="card-body">
                          <h6 className="text-muted mb-2">Statut</h6>
                          {getStatutBadge(selectedProjet.statut)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDetailModal(false)}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast.show && (
          <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3`} style={{ zIndex: 9999 }}>
            {toast.message}
          </div>
        )}
      </div>
    </EmployeLayout>
  );
}

export default EmployeProjets;
