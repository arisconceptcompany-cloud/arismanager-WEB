import { useState, useEffect } from 'react';
import { getSalaries, calculateSalary, generateMonthlySalaries, updateSalary } from '../services/api';
import { getAllEmployes } from '../services/api';
import './Pages.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

function Salaire() {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [editData, setEditData] = useState({
    salaire_base: 0,
    primes: 0,
    heures_supplementaires: 0,
    autres_retenues: 0
  });
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSalaries();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      const employeesData = await getAllEmployes();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const data = await getSalaries(selectedMonth, selectedYear);
      setSalaries(data);
    } catch (error) {
      console.error('Error loading salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAll = async () => {
    setCalculating(true);
    try {
      for (const emp of employees) {
        await calculateSalary(emp.id, selectedMonth, selectedYear);
      }
      await loadSalaries();
      alert('Calcul des salaires terminé avec succès!');
    } catch (error) {
      console.error('Error calculating salaries:', error);
      alert('Erreur lors du calcul des salaires');
    } finally {
      setCalculating(false);
    }
  };

  const handleGenerateMonth = async () => {
    if (!window.confirm(`Générer les salaires pour ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}?`)) return;
    
    setGenerating(true);
    try {
      await generateMonthlySalaries(selectedMonth, selectedYear);
      await loadSalaries();
      alert('Salaires générés avec succès!');
    } catch (error) {
      console.error('Error generating salaries:', error);
      alert('Erreur lors de la génération des salaires');
    } finally {
      setGenerating(false);
    }
  };

  const handleCalculateSingle = async (employeeId) => {
    try {
      await calculateSalary(employeeId, selectedMonth, selectedYear);
      await loadSalaries();
    } catch (error) {
      console.error('Error calculating salary:', error);
    }
  };

  const handleOpenDetail = (salary) => {
    setSelectedSalary(salary);
    setShowDetailModal(true);
  };

  const handleOpenEdit = (salary) => {
    setSelectedSalary(salary);
    setEditData({
      salaire_base: 0,
      primes: 0,
      heures_supplementaires: 0,
      autres_retenues: 0
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateSalary(selectedSalary.id, editData);
      await calculateSalary(selectedSalary.employee_id, selectedMonth, selectedYear);
      setShowEditModal(false);
      await loadSalaries();
    } catch (error) {
      console.error('Error updating salary:', error);
    }
  };

  const formatAr = (value) => {
    return (value || 0).toLocaleString('fr-FR') + ' Ar';
  };

  const totalSalaireBrut = salaries.reduce((sum, s) => sum + (s.salaire_base || 0) + (s.primes || 0) + (s.heures_supplementaires || 0), 0);
  const totalSalaireNet = salaries.reduce((sum, s) => sum + (s.salaire_net || 0), 0);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Gestion des Salaires</h2>
        <button 
          className="btn btn-success" 
          onClick={handleCalculateAll}
          disabled={calculating || employees.length === 0}
        >
          {calculating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Calcul en cours...
            </>
          ) : (
            <>
              <i className="fa fa-calculator"></i> Calculer tous les salaires
            </>
          )}
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Période</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Mois</label>
              <select 
                className="form-select" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Année</label>
              <select 
                className="form-select" 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button 
                className="btn btn-outline-primary w-100"
                onClick={handleGenerateMonth}
                disabled={generating}
              >
                {generating ? 'Génération...' : 'Générer pour la période'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stat-card stat-card-primary">
            <div className="stat-icon"><i className="fa fa-coins"></i></div>
            <div className="stat-info">
              <span className="stat-label">Salaire Brut Total</span>
              <span className="stat-value">{formatAr(totalSalaireBrut)}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card stat-card-success">
            <div className="stat-icon"><i className="fa fa-wallet"></i></div>
            <div className="stat-info">
              <span className="stat-label">Salaire Net Total</span>
              <span className="stat-value">{formatAr(totalSalaireNet)}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card stat-card-info">
            <div className="stat-icon"><i className="fa fa-users"></i></div>
            <div className="stat-info">
              <span className="stat-label">Employés</span>
              <span className="stat-value">{salaries.length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card stat-card-warning">
            <div className="stat-icon"><i className="fa fa-hand-holding-dollar"></i></div>
            <div className="stat-info">
              <span className="stat-label">Moyenne Net</span>
              <span className="stat-value">{salaries.length > 0 ? formatAr(Math.round(totalSalaireNet / salaries.length)) : '0 Ar'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Employé</th>
                  <th>Poste</th>
                  <th>Base</th>
                  <th>Primes+HSup</th>
                  <th>Retenues</th>
                  <th>Net</th>
                  <th>Statut</th>
                  <th><i className="fa fa-cog"></i></th>
                </tr>
              </thead>
              <tbody>
                {salaries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      Aucun salaire calculé pour cette période.
                      <br />
                      <button className="btn btn-sm btn-primary mt-2" onClick={handleGenerateMonth}>
                        Générer les salaires
                      </button>
                    </td>
                  </tr>
                ) : (
                  salaries.slice().sort((a, b) => (a.badge_id || '').localeCompare(b.badge_id || '')).map((salary, index) => (
                    <tr key={salary.id}>
                      <td><span className="badge bg-secondary">{salary.badge_id?.replace('ARIS-', '')}</span></td>
                      <td>
                        <strong>{salary.nom} {salary.prenom}</strong>
                      </td>
                      <td>{salary.poste}</td>
                      <td>{formatAr(salary.salaire_base)}</td>
                      <td className="text-success">{formatAr((salary.primes || 0) + (salary.heures_supplementaires || 0))}</td>
                      <td className="text-danger">
                        {formatAr(
                          (salary.retenue_absence || 0) + 
                          (salary.cnaps || 0) + 
                          (salary.ostie || 0) + 
                          (salary.irsa || 0) + 
                          (salary.autres_retenues || 0)
                        )}
                      </td>
                      <td><strong className="text-success">{formatAr(salary.salaire_net)}</strong></td>
                      <td>
                        <span className={`badge ${
                          salary.statut === 'paye' ? 'bg-success' : 
                          salary.statut === 'valide' ? 'bg-primary' : 'bg-secondary'
                        }`}>
                          {salary.statut === 'paye' ? 'Payé' : 
                           salary.statut === 'valide' ? 'Validé' : 'Brouillon'}
                        </span>
                      </td>
                      <td>
                        <div className="action-icons">
                          <button 
                            className="action-btn action-btn-view" 
                            onClick={() => handleOpenDetail(salary)}
                            title="Voir détails"
                          >
                            <i className="fa fa-eye"></i>
                          </button>
                          <button 
                            className="action-btn action-btn-edit" 
                            onClick={() => handleOpenEdit(salary)}
                            title="Modifier"
                          >
                            <i className="fa fa-pen"></i>
                          </button>
                          <button 
                            className="action-btn action-btn-refresh" 
                            onClick={() => handleCalculateSingle(salary.employee_id)}
                            title="Recalculer"
                          >
                            <i className="fa fa-rotate"></i>
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

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails du salaire</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSalary && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>{selectedSalary.nom} {selectedSalary.prenom}</h5>
                  <p className="text-muted mb-1">{selectedSalary.badge_id}</p>
                  <p className="mb-0"><strong>Poste:</strong> {selectedSalary.poste}</p>
                  <p className="mb-0"><strong>Catégorie:</strong> {selectedSalary.categorie || 'Non définie'}</p>
                </div>
                <div className="col-md-6 text-end">
                  <p className="mb-1"><strong>Période:</strong> {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                  <span className={`badge ${
                    selectedSalary.statut === 'paye' ? 'bg-success' : 
                    selectedSalary.statut === 'valide' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {selectedSalary.statut === 'paye' ? 'Payé' : 
                     selectedSalary.statut === 'valide' ? 'Validé' : 'Brouillon'}
                  </span>
                </div>
              </div>
              
              <hr />
              
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-success">Gains</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td>Salaire de base:</td>
                        <td className="text-end">{formatAr(selectedSalary.salaire_base)}</td>
                      </tr>
                      <tr>
                        <td>Primes:</td>
                        <td className="text-end text-success">+ {formatAr(selectedSalary.primes)}</td>
                      </tr>
                      <tr>
                        <td>Heures supplémentaires:</td>
                        <td className="text-end text-success">+ {formatAr(selectedSalary.heures_supplementaires)}</td>
                      </tr>
                      <tr className="fw-bold">
                        <td>Salaire Brut:</td>
                        <td className="text-end">
                          {formatAr(
                            (selectedSalary.salaire_base || 0) + 
                            (selectedSalary.primes || 0) + 
                            (selectedSalary.heures_supplementaires || 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6 className="text-danger">Retenues</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td>CNAPS (1%):</td>
                        <td className="text-end text-danger">- {formatAr(selectedSalary.cnaps)}</td>
                      </tr>
                      <tr>
                        <td>OSTIE (1%):</td>
                        <td className="text-end text-danger">- {formatAr(selectedSalary.ostie)}</td>
                      </tr>
                      <tr>
                        <td>IRSA:</td>
                        <td className="text-end text-danger">- {formatAr(selectedSalary.irsa)}</td>
                      </tr>
                      <tr>
                        <td>Absences ({selectedSalary.absences_non_justifiees} jours):</td>
                        <td className="text-end text-danger">- {formatAr(selectedSalary.retenue_absence)}</td>
                      </tr>
                      <tr>
                        <td>Congé annuel ({selectedSalary.conge_annuel} jours):</td>
                        <td className="text-end text-warning">- {formatAr(selectedSalary.conge_annuel * (selectedSalary.salaire_base / 22))}</td>
                      </tr>
                      <tr>
                        <td>Congé maladie ({selectedSalary.conge_maladie} jours):</td>
                        <td className="text-end text-warning">- {formatAr(selectedSalary.conge_maladie * (selectedSalary.salaire_base / 22))}</td>
                      </tr>
                      <tr>
                        <td>Autres retenues:</td>
                        <td className="text-end text-danger">- {formatAr(selectedSalary.autres_retenues)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="row mt-3">
                <div className="col-12">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="mb-0">
                        Salaire Net: <span className="text-success fw-bold">{formatAr(selectedSalary.salaire_net)}</span>
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier le salaire</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSalary && (
            <div>
              <p className="text-muted mb-3">
                {selectedSalary.nom} {selectedSalary.prenom} - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Salaire de base (Ar)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={editData.salaire_base}
                  onChange={(e) => setEditData({...editData, salaire_base: parseFloat(e.target.value) || 0})}
                  min="0"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Primes (Ar)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={editData.primes}
                  onChange={(e) => setEditData({...editData, primes: parseFloat(e.target.value) || 0})}
                  min="0"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Heures supplémentaires (Ar)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={editData.heures_supplementaires}
                  onChange={(e) => setEditData({...editData, heures_supplementaires: parseFloat(e.target.value) || 0})}
                  min="0"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Autres retenues (Ar)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={editData.autres_retenues}
                  onChange={(e) => setEditData({...editData, autres_retenues: parseFloat(e.target.value) || 0})}
                  min="0"
                />
              </Form.Group>
              <div className="alert alert-info mt-3 mb-0">
                <strong>Aperçu du calcul :</strong>
                <div className="mt-2">
                  <div className="d-flex justify-content-between">
                    <span>Salaire base :</span>
                    <span>{formatAr(editData.salaire_base)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-success">
                    <span>Primes + HSup :</span>
                    <span>+ {formatAr(editData.primes + editData.heures_supplementaires)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-danger">
                    <span>Autres retenues :</span>
                    <span>- {formatAr(editData.autres_retenues)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Brut estimé :</span>
                    <span>{formatAr(editData.salaire_base + editData.primes + editData.heures_supplementaires)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            <i className="fa fa-calculator me-2"></i> Calculer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Salaire;
