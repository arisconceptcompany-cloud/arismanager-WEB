import { useState, useEffect } from 'react';
import { getProjets, createProjet, updateProjet, deleteProjet, getAllEmployes, uploadProjetFile, getProjetFiles, downloadProjetFile, deleteProjetFile } from '../services/api';
import './Pages.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { FaPlus, FaEye, FaEdit, FaTrash, FaSearch, FaFilter, FaChartLine, FaClock, FaCheckCircle, FaHourglass, FaUsers, FaUser, FaFileUpload, FaFileDownload, FaFileAlt, FaTimes } from 'react-icons/fa';

function Projets() {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingProjet, setEditingProjet] = useState(null);
  const [selectedProjet, setSelectedProjet] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [projetFiles, setProjetFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    client: '',
    date_debut: '',
    date_fin_prevue: '',
    statut: 'en_cours',
    employes: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [projetsData, employeesData] = await Promise.all([
        getProjets(),
        getAllEmployes()
      ]);
      setProjets(projetsData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erreur lors du chargement des données', 'danger');
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
        statut: projet.statut || 'en_cours',
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
        statut: 'en_cours',
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
    try {
      const projetData = {
        ...formData,
        employes: formData.employes.join(',')
      };

      if (editingProjet) {
        await updateProjet(editingProjet.id, projetData);
        showToast('Projet mis à jour avec succès');
      } else {
        await createProjet(projetData);
        showToast('Projet créé avec succès');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving projet:', error);
      showToast('Erreur lors de l\'enregistrement', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      try {
        await deleteProjet(id);
        showToast('Projet supprimé avec succès');
        loadData();
      } catch (error) {
        console.error('Error deleting projet:', error);
        showToast('Erreur lors de la suppression', 'danger');
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

  const loadProjetFiles = async (projetId) => {
    try {
      const files = await getProjetFiles(projetId);
      setProjetFiles(files || []);
    } catch (error) {
      console.error('Error loading projet files:', error);
      setProjetFiles([]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedProjet) return;
    
    setUploading(true);
    try {
      await uploadProjetFile(selectedProjet.id, file);
      showToast('Fichier uploadé avec succès');
      await loadProjetFiles(selectedProjet.id);
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Erreur lors de l\'upload du fichier', 'danger');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFileDownload = async (file) => {
    try {
      await downloadProjetFile(selectedProjet.id, file.id, file.nom_fichier);
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast('Erreur lors du téléchargement', 'danger');
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;
    
    try {
      await deleteProjetFile(selectedProjet.id, fileId);
      showToast('Fichier supprimé avec succès');
      await loadProjetFiles(selectedProjet.id);
    } catch (error) {
      console.error('Error deleting file:', error);
      showToast('Erreur lors de la suppression', 'danger');
    }
  };

  const handleOpenDetailModal = (projet) => {
    setSelectedProjet(projet);
    setShowDetailModal(true);
    loadProjetFiles(projet.id);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProjet(null);
    setProjetFiles([]);
  };

  const filteredProjets = projets.filter(projet => {
    const matchesFilter = filter === 'all' || projet.statut === filter;
    const matchesSearch = projet.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          projet.client?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  const getStatutOptions = () => [
    { value: 'en_attente', label: 'En attente', icon: <FaHourglass className="me-2" /> },
    { value: 'en_cours', label: 'En cours', icon: <FaClock className="me-2" /> },
    { value: 'termine', label: 'Terminé', icon: <FaCheckCircle className="me-2" /> },
    { value: 'annule', label: 'Annulé', icon: <FaTrash className="me-2" /> }
  ];

  const stats = {
    total: projets.length,
    enCours: projets.filter(p => p.statut === 'en_cours').length,
    termines: projets.filter(p => p.statut === 'termine').length,
    enAttente: projets.filter(p => p.statut === 'en_attente').length,
    annules: projets.filter(p => p.statut === 'annule').length
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
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
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaChartLine className="me-2" />
            Gestion des Projets
          </h1>
          <p className="text-muted mb-0">Gérez vos projets et suivez leur avancement</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
          <FaPlus /> Nouveau Projet
        </Button>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '50px', height: '50px' }}>
                <FaChartLine className="text-primary fs-5" />
              </div>
              <h3 className="mb-1">{stats.total}</h3>
              <p className="text-muted mb-0 small">Total Projets</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
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
        <div className="col-md-3 col-6 mb-3">
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
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '50px', height: '50px' }}>
                <FaHourglass className="text-secondary fs-5" />
              </div>
              <h3 className="mb-1">{stats.enAttente}</h3>
              <p className="text-muted mb-0 small">En Attente</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Rechercher un projet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaFilter className="text-muted" />
                </span>
                <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)} className="border-start-0">
                  <option value="all">Tous les statuts</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                  <option value="en_attente">En attente</option>
                  <option value="annule">Annulé</option>
                </Form.Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Liste des Projets ({filteredProjets.length})</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 px-4">Projet</th>
                  <th className="border-0 py-3">Client</th>
                  <th className="border-0 py-3">Créé par</th>
                  <th className="border-0 py-3">Date début</th>
                  <th className="border-0 py-3">Statut</th>
                  <th className="border-0 py-3 text-center">Employés</th>
                  <th className="border-0 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-5">
                      <FaChartLine className="fs-1 mb-3 opacity-25" />
                      <p className="mb-0">Aucun projet trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredProjets.map((projet) => (
                    <tr key={projet.id} className="align-middle">
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center">
                          <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px' }}>
                            <FaChartLine className="text-primary" />
                          </div>
                          <div>
                            <strong className="d-block">{projet.nom}</strong>
                            {projet.description && (
                              <small className="text-muted">{projet.description.substring(0, 40)}{projet.description.length > 40 ? '...' : ''}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {projet.client || '-'}
                        </span>
                      </td>
                      <td>
                        {projet.created_by_name ? (
                          <span className="badge bg-primary bg-opacity-10 text-primary border">
                            <FaUser className="me-1" />
                            {projet.created_by_name}
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="text-muted small">{formatDate(projet.date_debut)}</td>
                      <td>{getStatutBadge(projet.statut)}</td>
                      <td className="text-center">
                        <span className="badge bg-secondary">
                          {projet.employes ? projet.employes.split(',').length : 0}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-1">
                          <button
                            className="btn btn-sm btn-outline-info rounded-circle p-2"
                            onClick={() => handleOpenDetailModal(projet)}
                            title="Voir détails"
                            style={{ width: '36px', height: '36px' }}
                          >
                            <FaEye />
                          </button>
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

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaChartLine className="text-primary" />
            {editingProjet ? 'Modifier le Projet' : 'Nouveau Projet'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-2">
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Nom du projet *</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Site web ARIS"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le projet en détail..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Client</Form.Label>
              <Form.Control
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="Nom du client"
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Date de début</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Date de fin prévue</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date_fin_prevue}
                    onChange={(e) => setFormData({ ...formData, date_fin_prevue: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Statut</Form.Label>
              <Form.Select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              >
                {getStatutOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Employés assignés</Form.Label>
              <div className="border rounded p-3 bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {employees.length === 0 ? (
                  <p className="text-muted mb-0">Aucun employé disponible</p>
                ) : (
                  <div className="row">
                    {employees.map(emp => (
                      <div key={emp.id} className="col-md-6">
                        <Form.Check
                          type="checkbox"
                          id={`emp-${emp.id}`}
                          label={`${emp.prenom} ${emp.nom}`}
                          checked={formData.employes.includes(String(emp.id))}
                          onChange={() => handleEmployeeToggle(String(emp.id))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="outline-secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" className="px-4">
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
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDetailModal} onHide={handleCloseDetailModal} size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaEye className="text-info" />
            Détails du Projet
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {selectedProjet && (
            <>
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
                      {selectedProjet.created_by_name ? (
                        <p className="mb-0 fw-medium">
                          <FaUser className="me-1 text-primary" />
                          {selectedProjet.created_by_name}
                          {selectedProjet.created_by_badge && <span className="text-muted ms-1">({selectedProjet.created_by_badge})</span>}
                        </p>
                      ) : (
                        <p className="mb-0 fw-medium text-secondary">Admin</p>
                      )}
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
                      <h6 className="text-muted mb-2">Date de fin prévue</h6>
                      <p className="mb-0 fw-medium"><FaClock className="me-1 text-danger" />{formatDate(selectedProjet.date_fin_prevue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-light border-0">
                <div className="card-body">
                  <h6 className="text-muted mb-3">
                    <FaUsers className="me-1" /> Employés assignés ({selectedProjet.employes ? selectedProjet.employes.split(',').length : 0})
                  </h6>
                  {selectedProjet.employes ? (
                    <div className="d-flex flex-wrap gap-2">
                      {selectedProjet.employes.split(',').map((empId, idx) => {
                        const emp = employees.find(e => String(e.id) === empId.trim());
                        return (
                          <span key={idx} className="badge bg-primary bg-opacity-10 text-primary border px-3 py-2">
                            {emp ? `${emp.prenom} ${emp.nom}` : `Employé #${empId}`}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Aucun employé assigné</p>
                  )}
                </div>
              </div>

              <div className="card bg-light border-0 mt-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-muted mb-0">
                      <FaFileAlt className="me-1" /> Fichiers ({projetFiles.length})
                    </h6>
                    <label className="btn btn-sm btn-outline-primary mb-0">
                      <FaFileUpload className="me-1" />
                      {uploading ? 'Upload...' : 'Ajouter un fichier'}
                      <input
                        type="file"
                        className="d-none"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  
                  {projetFiles.length === 0 ? (
                    <p className="text-muted mb-0">Aucun fichier</p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {projetFiles.map((file) => (
                        <div key={file.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-0">
                          <div className="d-flex align-items-center">
                            <FaFileAlt className="me-2 text-secondary" />
                            <div>
                              <div className="fw-medium" style={{ fontSize: '0.875rem' }}>{file.originalName}</div>
                              <small className="text-muted">
                                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} 
                                {file.uploadedAt ? ` • ${new Date(file.uploadedAt).toLocaleDateString('fr-FR')}` : ''}
                              </small>
                            </div>
                          </div>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleFileDownload(file)}
                              title="Télécharger"
                            >
                              <FaFileDownload />
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleFileDelete(file.id)}
                              title="Supprimer"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={handleCloseDetailModal}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
          delay={4000}
          autohide
          bg={toast.type === 'success' ? 'success' : toast.type === 'danger' ? 'danger' : 'info'}
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}

export default Projets;
