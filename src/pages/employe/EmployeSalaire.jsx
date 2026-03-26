import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeLayout from '../../components/EmployeLayout';

function EmployeSalaire() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    loadSalaries();
  }, []);

  const loadSalaries = async () => {
    const token = localStorage.getItem('employe_token');
    if (!token) {
      navigate('/employe-login');
      return;
    }

    try {
      const response = await fetch(`/api/employe/salaires/${token}`);
      if (response.ok) {
        const data = await response.json();
        setSalaries(data);
        if (data.length > 0) {
          setSelectedSalary(data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAr = (value) => (value || 0).toLocaleString('fr-FR') + ' Ar';

  const formatMonth = (mois, annee) => {
    return `${months.find(m => m.value === mois)?.label || ''} ${annee}`;
  };

  const exportSalary = (salary) => {
    const content = `
BULLETIN DE SALAIRE
====================

Période: ${formatMonth(salary.mois, salary.annee)}
Statut: ${salary.statut}

SALAIRE BRUT
-------------
Salaire de base: ${formatAr(salary.salaire_base)}
Primes: ${formatAr(salary.primes)}
Heures supplémentaires: ${formatAr(salary.heures_supplementaires)}
-------------------------
Total Brut: ${formatAr((salary.salaire_base || 0) + (salary.primes || 0) + (salary.heures_supplementaires || 0))}

COTISATIONS SOCIALES
--------------------
CNAPS (1%): ${formatAr(salary.cnaps)}
OSTIE (1%): ${formatAr(salary.ostie)}
IRSA: ${formatAr(salary.irsa)}
-------------------------
Total Cotisations: ${formatAr((salary.cnaps || 0) + (salary.ostie || 0) + (salary.irsa || 0))}

RETENUES
--------
Absences: ${formatAr(salary.retenue_absence)} (${salary.absences_non_justifiees} jours)
Congé annuel: ${formatAr(salary.conge_annuel * (salary.salaire_base / 22))} (${salary.conge_annuel} jours)
Congé maladie: ${formatAr(salary.conge_maladie * (salary.salaire_base / 22))} (${salary.conge_maladie} jours)
Autres retenues: ${formatAr(salary.autres_retenues)}

=========================
SALAIRE NET: ${formatAr(salary.salaire_net)}
=========================

ARIS Concept Company
Lot II T 104 A lavoloha, Antananarivo 102
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulletin_salaire_${salary.mois}_${salary.annee}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="page-title mb-0">Mon Salaire</h2>
          {selectedSalary && (
            <button className="btn btn-success" onClick={() => exportSalary(selectedSalary)}>
              <i className="fa fa-download"></i> Exporter
            </button>
          )}
        </div>

        {salaries.length === 0 ? (
          <div className="card text-center text-muted py-5">
            <i className="fa fa-file-invoice-dollar" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">Aucun bulletin de salaire disponible</p>
            <small>Veuillez contacter le service RH si vous pensez que c'est une erreur.</small>
          </div>
        ) : (
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Historique des salaires</h5>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {salaries.map(salary => (
                      <div 
                        key={salary.id}
                        className={`list-group-item ${selectedSalary?.id === salary.id ? 'active' : ''}`}
                        onClick={() => setSelectedSalary(salary)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{formatMonth(salary.mois, salary.annee)}</span>
                          <span className={`badge ${salary.statut === 'paye' ? 'bg-success' : salary.statut === 'valide' ? 'bg-primary' : 'bg-secondary'}`}>
                            {salary.statut}
                          </span>
                        </div>
                        <div className="fw-bold mt-1">{formatAr(salary.salaire_net)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              {selectedSalary && (
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{formatMonth(selectedSalary.mois, selectedSalary.annee)}</h5>
                    <span className={`badge ${selectedSalary.statut === 'paye' ? 'bg-success' : selectedSalary.statut === 'valide' ? 'bg-primary' : 'bg-secondary'}`}>
                      {selectedSalary.statut === 'paye' ? 'Payé' : selectedSalary.statut === 'valide' ? 'Validé' : 'Brouillon'}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="text-success mb-3"><i className="fa fa-plus-circle me-2"></i>Gains</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td>Salaire de base</td>
                              <td className="text-end">{formatAr(selectedSalary.salaire_base)}</td>
                            </tr>
                            <tr>
                              <td>Primes</td>
                              <td className="text-end text-success">+ {formatAr(selectedSalary.primes)}</td>
                            </tr>
                            <tr>
                              <td>Heures supplémentaires</td>
                              <td className="text-end text-success">+ {formatAr(selectedSalary.heures_supplementaires)}</td>
                            </tr>
                            <tr className="fw-bold border-top">
                              <td>Salaire Brut</td>
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
                        <h6 className="text-danger mb-3"><i className="fa fa-minus-circle me-2"></i>Retenues</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td>CNAPS (1%)</td>
                              <td className="text-end text-danger">- {formatAr(selectedSalary.cnaps)}</td>
                            </tr>
                            <tr>
                              <td>OSTIE (1%)</td>
                              <td className="text-end text-danger">- {formatAr(selectedSalary.ostie)}</td>
                            </tr>
                            <tr>
                              <td>IRSA</td>
                              <td className="text-end text-danger">- {formatAr(selectedSalary.irsa)}</td>
                            </tr>
                            <tr>
                              <td>Absences ({selectedSalary.absences_non_justifiees}j)</td>
                              <td className="text-end text-danger">- {formatAr(selectedSalary.retenue_absence)}</td>
                            </tr>
                            {selectedSalary.conge_annuel > 0 && (
                              <tr>
                                <td>Congé annuel</td>
                                <td className="text-end">- {formatAr(selectedSalary.conge_annuel * (selectedSalary.salaire_base / 22))}</td>
                              </tr>
                            )}
                            {selectedSalary.conge_maladie > 0 && (
                              <tr>
                                <td>Congé maladie</td>
                                <td className="text-end">- {formatAr(selectedSalary.conge_maladie * (selectedSalary.salaire_base / 22))}</td>
                              </tr>
                            )}
                            <tr>
                              <td>Autres retenues</td>
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
                            <h4 className="mb-0">
                              SALAIRE NET À PAYER: <span className="text-success">{formatAr(selectedSalary.salaire_net)}</span>
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </EmployeLayout>
  );
}

export default EmployeSalaire;
