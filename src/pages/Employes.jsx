import { useState, useEffect } from 'react';
import { getAllEmployes, updateEmploye, deleteEmploye, createEmploye } from '../services/api';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import './Employes.css';
import './Pages.css';

function Employes() {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addError, setAddError] = useState('');
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [editData, setEditData] = useState({
    nom: '',
    prenom: '',
    poste: '',
    departement: '',
    email: '',
    telephone: ''
  });
  const [addData, setAddData] = useState({
    badge_id: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    poste: '',
    equipe: '',
    date_embauche: '',
    categorie: '',
    cin: '',
    num_cnaps: '',
    date_naissance: ''
  });

  useEffect(() => {
    loadEmployes();
    // Refresh every 30 seconds
    const interval = setInterval(loadEmployes, 30000);
    return () => clearInterval(interval);
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

  const handleView = (emp) => {
    setSelectedEmploye(emp);
    setShowViewModal(true);
  };

  const handleEdit = (emp) => {
    setSelectedEmploye(emp);
    setEditData({
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      poste: emp.poste || '',
      departement: emp.departement || '',
      email: emp.email || '',
      telephone: emp.telephone || '',
      adresse: emp.adresse || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateEmploye(selectedEmploye.id, editData);
      setShowEditModal(false);
      loadEmployes();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteStep(1);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setDeleteStep(2);
  };

  const handleFinalDelete = async () => {
    try {
      await deleteEmploye(employeeToDelete.id);
      loadEmployes();
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Erreur lors de la suppression');
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
    setDeleteStep(1);
  };

  const handleOpenAdd = () => {
    setAddData({
      badge_id: '',
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      poste: '',
      equipe: '',
      date_embauche: '',
      categorie: '',
      cin: '',
      num_cnaps: '',
      date_naissance: ''
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = async () => {
    setAddError('');
    
    if (!addData.badge_id) {
      setAddError('Le matricule est obligatoire');
      return;
    }
    
    if (!addData.nom || !addData.prenom) {
      setAddError('Le nom et le prénom sont obligatoires');
      return;
    }
    
    try {
      await createEmploye(addData);
      setShowAddModal(false);
      loadEmployes();
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de la création';
      setAddError(errorMsg);
    }
  };

  const filteredEmployes = employes
    .slice()
    .sort((a, b) => (a.badge_id || '').localeCompare(b.badge_id || ''))
    .filter(emp => {
      const matchesSearch = !searchTerm || 
        emp.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.badge_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.poste?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filter === 'all' || emp.status === filter;
      
      return matchesSearch && matchesFilter;
    });

  const formatBadgeNumber = (badgeId) => {
    if (!badgeId) return '-';
    return badgeId.toString().replace(/id$/i, '');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <span className="badge bg-success">Présent</span>;
      case 'sortie':
        return <span className="badge bg-warning text-dark">Sorti</span>;
      case 'absent':
      default:
        return <span className="badge bg-secondary">Absent</span>;
    }
  };

  const getPcStatusIndicator = (emp) => {
    return (
      <span className={`pc-status-indicator ${emp.pcOnline ? 'pc-online' : 'pc-offline'}`}></span>
    );
  };

  const getRowStyle = (emp) => {
    if (emp.pcOnline) {
      return { backgroundColor: 'rgba(25, 135, 84, 0.08)' };
    } else {
      return { backgroundColor: 'rgba(220, 53, 69, 0.08)' };
    }
  };

  // Stats
  const stats = {
    total: employes.length,
    present: employes.filter(e => e.status === 'present').length,
    sortie: employes.filter(e => e.status === 'sortie').length,
    absent: employes.filter(e => e.status === 'absent').length,
    pcOn: employes.filter(e => e.pcOnline).length,
    pcOff: employes.filter(e => !e.pcOnline).length
  };

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
        <h2 className="page-title">Liste des Employés</h2>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <i className="fa fa-plus"></i> Nouvel employé
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-2 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-3">
              <h4 className="mb-1 text-primary">{stats.total}</h4>
              <p className="mb-0 small text-muted">Total</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-3">
              <h4 className="mb-1 text-success">{stats.present}</h4>
              <p className="mb-0 small text-muted">Présents</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-3">
              <h4 className="mb-1 text-warning">{stats.sortie}</h4>
              <p className="mb-0 small text-muted">Sortis</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-3">
              <h4 className="mb-1 text-secondary">{stats.absent}</h4>
              <p className="mb-0 small text-muted">Absents</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100 bg-success bg-opacity-10">
            <div className="card-body text-center py-3">
              <h4 className="mb-1 text-success">{stats.pcOn}</h4>
              <p className="mb-0 small text-muted">Actif</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-3">
          <div className="card border-0 shadow-sm h-100 bg-danger bg-opacity-10">
            <div className="card-body text-center py-3">
              <h4 className="mb-1 text-danger">{stats.pcOff}</h4>
              <p className="mb-0 small text-muted">Inactif</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col-md-6 mb-2 mb-md-0">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Rechercher par nom, prénom, badge ou poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-2 mb-md-0">
              <select 
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="present">Présent</option>
                <option value="sortie">Sorti</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div className="col-md-3">
              <span className="badge bg-primary fs-6">
                {filteredEmployes.length} employé(s)
              </span>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Profil</th>
                  <th className="py-3">ID</th>
                  <th className="py-3">Nom</th>
                  <th className="py-3">Prénom</th>
                  <th className="py-3">Poste</th>
                  <th className="py-3">Statut</th>
                  <th className="py-3">A/I</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredEmployes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <i className="fa fa-users fa-2x text-muted mb-2"></i>
                      <p className="mb-0 text-muted">Aucun employé trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployes.map((emp, index) => (
                    <tr key={emp.id || index} style={getRowStyle(emp)}>
                      <td className="py-3 px-4">
                        {emp.photo ? (
                          <img 
                            src={emp.photo} 
                            alt={emp.nom}
                            style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #dee2e6' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                              e.target.nextSibling.style.width = '45px';
                              e.target.nextSibling.style.height = '45px';
                            }}
                          />
                        ) : null}
                        {!emp.photo && (
                          <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold"
                               style={{ width: '45px', height: '45px', fontSize: '14px' }}>
                            {((emp.prenom || '')[0] || '')}{((emp.nom || '')[0] || '')}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="badge bg-secondary">{formatBadgeNumber(emp.badge_id)}</span>
                      </td>
                      <td className="py-3"><strong>{emp.nom || '-'}</strong></td>
                      <td className="py-3">{emp.prenom || '-'}</td>
                      <td className="py-3">{emp.poste || '-'}</td>
                      <td className="py-3">{getStatusBadge(emp.status)}</td>
                      <td className="py-3">{getPcStatusIndicator(emp)}</td>
                      <td className="py-3 text-center">
                        <button className="btn btn-sm btn-outline-info me-1" title="Voir" onClick={() => handleView(emp)}>
                          <i className="fa fa-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-warning me-1" title="Modifier" onClick={() => handleEdit(emp)}>
                          <i className="fa fa-edit"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="Supprimer" onClick={() => handleDelete(emp)}>
                          <i className="fa fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails de l'employé</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmploye && (
            <div className="row">
              <div className="col-md-4 text-center border-end">
                <div className="avatar-circle mx-auto mb-3" style={{ width: '100px', height: '100px', fontSize: '36px' }}>
                  {((selectedEmploye.prenom || '')[0] || '')}{((selectedEmploye.nom || '')[0] || '')}
                </div>
                <h5>{selectedEmploye.nom} {selectedEmploye.prenom}</h5>
                <p className="text-muted">{selectedEmploye.poste || '-'}</p>
                <span className="badge bg-primary fs-6">{selectedEmploye.badge_id?.replace('ARIS-', '')}</span>
              </div>
              <div className="col-md-8">
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td className="text-muted"><strong>Département</strong></td>
                      <td>{selectedEmploye.departement || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Email</strong></td>
                      <td>{selectedEmploye.email || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Téléphone</strong></td>
                      <td>{selectedEmploye.telephone || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Adresse</strong></td>
                      <td>{selectedEmploye.adresse || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Équipe</strong></td>
                      <td>{selectedEmploye.equipe || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Date de naissance</strong></td>
                      <td>{selectedEmploye.date_naissance || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Date d'embauche</strong></td>
                      <td>{selectedEmploye.date_embauche || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Catégorie</strong></td>
                      <td><span className="badge bg-info">{selectedEmploye.categorie || '-'}</span></td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>CIN</strong></td>
                      <td>{selectedEmploye.cin || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Numéro CNAPS</strong></td>
                      <td>{selectedEmploye.num_cnaps || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>Fermer</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Modifier l'employé</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmploye && (
            <div>
              <div className="text-center mb-4">
                <div className="avatar-circle mx-auto mb-2" style={{ width: '70px', height: '70px', fontSize: '24px' }}>
                  {((selectedEmploye.prenom || '')[0] || '')}{((selectedEmploye.nom || '')[0] || '')}
                </div>
                <h5>{selectedEmploye.nom} {selectedEmploye.prenom}</h5>
                <span className="badge bg-secondary">{selectedEmploye.badge_id}</span>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control type="text" value={editData.nom} onChange={(e) => setEditData({...editData, nom: e.target.value})} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control type="text" value={editData.prenom} onChange={(e) => setEditData({...editData, prenom: e.target.value})} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Poste</Form.Label>
                    <Form.Control type="text" value={editData.poste} onChange={(e) => setEditData({...editData, poste: e.target.value})} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Département</Form.Label>
                    <Form.Control type="text" value={editData.departement} onChange={(e) => setEditData({...editData, departement: e.target.value})} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control type="text" value={editData.telephone} onChange={(e) => setEditData({...editData, telephone: e.target.value})} />
                  </Form.Group>
                </div>
                <div className="col-md-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Adresse</Form.Label>
                    <Form.Control type="text" as="textarea" rows={2} value={editData.adresse || ''} onChange={(e) => setEditData({...editData, adresse: e.target.value})} />
                  </Form.Group>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSaveEdit}><i className="fa fa-save me-2"></i>Enregistrer</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Employee Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><i className="fa fa-user-plus me-2"></i>Nouvel Employé</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveAdd(); }}>
            <div className="alert alert-info mb-3">
              <i className="fa fa-info-circle me-2"></i>
              Les champs marqués d'un astérisque (*) sont obligatoires.
            </div>
            
            {addError && (
              <div className="alert alert-danger mb-3">
                <i className="fa fa-exclamation-circle me-2"></i>
                {addError}
              </div>
            )}

            <h6 className="text-primary mb-3"><i className="fa fa-id-badge me-2"></i>Matricule</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Matricule *</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">ARIS-</span>
                    <Form.Control 
                      type="text" 
                      value={addData.badge_id} 
                      onChange={(e) => setAddData({...addData, badge_id: e.target.value})}
                      placeholder="0001"
                      required 
                    />
                  </div>
                  <small className="text-muted">Ce matricule sera utilisé par l'employé pour créer son compte</small>
                </Form.Group>
              </div>
            </div>

            <h6 className="text-primary mb-3"><i className="fa fa-user me-2"></i>Informations Personnelles</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nom *</Form.Label>
                  <Form.Control type="text" value={addData.nom} onChange={(e) => setAddData({...addData, nom: e.target.value})} required />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Prénom *</Form.Label>
                  <Form.Control type="text" value={addData.prenom} onChange={(e) => setAddData({...addData, prenom: e.target.value})} required />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={addData.email} onChange={(e) => setAddData({...addData, email: e.target.value})} placeholder="prenom.nom@exemple.com" />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control type="text" value={addData.telephone} onChange={(e) => setAddData({...addData, telephone: e.target.value})} placeholder="034 XX XXX XX" />
                </Form.Group>
              </div>
              <div className="col-md-12">
                <Form.Group className="mb-3">
                  <Form.Label>Adresse</Form.Label>
                  <Form.Control type="text" value={addData.adresse} onChange={(e) => setAddData({...addData, adresse: e.target.value})} placeholder="Lot, Ville, Commune" />
                </Form.Group>
              </div>
            </div>

            <hr className="my-4" />
            <h6 className="text-success mb-3"><i className="fa fa-briefcase me-2"></i>Informations Professionnelles</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Poste</Form.Label>
                  <Form.Control type="text" value={addData.poste} onChange={(e) => setAddData({...addData, poste: e.target.value})} placeholder="Ingénieur BTP" />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Équipe / Département</Form.Label>
                  <Form.Control type="text" value={addData.equipe} onChange={(e) => setAddData({...addData, equipe: e.target.value})} placeholder="Technique" />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date d'embauche</Form.Label>
                  <Form.Control type="date" value={addData.date_embauche} onChange={(e) => setAddData({...addData, date_embauche: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Catégorie</Form.Label>
                  <Form.Select value={addData.categorie} onChange={(e) => setAddData({...addData, categorie: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    <option value="HC">HC</option>
                    <option value="1">Catégorie 1</option>
                    <option value="2A">Catégorie 2A</option>
                    <option value="2B">Catégorie 2B</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <hr className="my-4" />
            <h6 className="text-warning mb-3"><i className="fa fa-id-card me-2"></i>Documents</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>CIN</Form.Label>
                  <Form.Control type="text" value={addData.cin} onChange={(e) => setAddData({...addData, cin: e.target.value})} placeholder="123.456.789.012" />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Numéro CNAPS</Form.Label>
                  <Form.Control type="text" value={addData.num_cnaps} onChange={(e) => setAddData({...addData, num_cnaps: e.target.value})} placeholder="123456789012" />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date de naissance</Form.Label>
                  <Form.Control type="date" value={addData.date_naissance} onChange={(e) => setAddData({...addData, date_naissance: e.target.value})} />
                </Form.Group>
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handleSaveAdd}><i className="fa fa-plus me-2"></i>Ajouter l'employé</Button>
        </Modal.Footer>
      </Modal>

      {/* CSS Styles */}
      <style>{`
        .pc-status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }
        .pc-online {
          background-color: #198754;
          box-shadow: 0 0 8px rgba(25, 135, 84, 0.6);
          animation: pulse-green 2s infinite;
        }
        .pc-offline {
          background-color: #dc3545;
          box-shadow: 0 0 4px rgba(220, 53, 69, 0.4);
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 4px rgba(25, 135, 84, 0.4); }
          50% { box-shadow: 0 0 12px rgba(25, 135, 84, 0.8); }
          100% { box-shadow: 0 0 4px rgba(25, 135, 84, 0.4); }
        }
      `}</style>

      <Modal show={showDeleteModal} onHide={handleCancelDelete} centered size="lg">
        <Modal.Header closeButton className={deleteStep === 1 ? 'bg-warning' : 'bg-danger text-white'}>
          <Modal.Title>
            <i className={`fa fa-exclamation-triangle me-2 ${deleteStep === 2 ? 'text-white' : ''}`}></i>
            {deleteStep === 1 ? 'Confirmation de suppression' : 'Dernière confirmation'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {deleteStep === 1 ? (
            <>
              <div className="delete-warning-icon mb-3">
                <i className="fa fa-user-times fa-4x text-warning"></i>
              </div>
              <h4 className="mb-3">Suppression définitive de l'employé</h4>
              <div className="alert alert-light border">
                <p className="mb-2"><strong>{employeeToDelete?.prenom} {employeeToDelete?.nom}</strong></p>
                <p className="mb-0 text-muted"><small>Badge: {employeeToDelete?.badge_id}</small></p>
              </div>
              <div className="alert alert-danger py-2">
                <p className="mb-0">
                  <i className="fa fa-exclamation-circle me-2"></i>
                  <strong>Cette action est IRRÉVERSIBLE !</strong>
                </p>
              </div>
              <ul className="list-unstyled text-start d-inline-block">
                <li><i className="fa fa-times-circle text-danger me-2"></i>L'employé sera supprimé de la base</li>
                <li><i className="fa fa-times-circle text-danger me-2"></i>Il n'aura plus accès au portail</li>
                <li><i className="fa fa-check-circle text-success me-2"></i>Ses présences seront conservées</li>
              </ul>
            </>
          ) : (
            <>
              <div className="delete-danger-icon mb-3">
                <i className="fa fa-trash fa-4x text-danger"></i>
              </div>
              <h4 className="mb-3 text-danger">Êtes-vous absolument sûr ?</h4>
              <p className="text-muted">
                L'employé <strong>{employeeToDelete?.prenom} {employeeToDelete?.nom}</strong> sera supprimé <strong>définitivement</strong>.
              </p>
              <p className="text-muted">Cliquez sur "Supprimer" pour confirmer.</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelDelete}>
            <i className="fa fa-times me-2"></i>Annuler
          </Button>
          {deleteStep === 1 ? (
            <Button variant="warning" onClick={handleConfirmDelete}>
              <i className="fa fa-exclamation-triangle me-2"></i>Continuer
            </Button>
          ) : (
            <Button variant="danger" onClick={handleFinalDelete}>
              <i className="fa fa-trash me-2"></i>Supprimer définitivement
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <style>{`
        .delete-warning-icon, .delete-danger-icon {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}

export default Employes;
