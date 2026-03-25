import { Link } from 'react-router-dom';
import Bg from '../components/Bg';
import './Auth.css';

function ChooseLogin() {
  return (
    <Bg>
      <div className="choose-login-wrapper">
        <div className="text-center mb-4">
          <img src="/logo.png" alt="ARIS" width="80" height="80" />
          <h2 className="mt-3 ">Bienvenue sur ArisManager</h2>
          <p className="">Choisissez votre espace de connexion</p>
        </div>
        
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <Link to="/employe-login" className="choose-card employee-card">
              <div className="choose-card-icon">
                <i className="fa fa-user"></i>
              </div>
              <h4>Espace Employé</h4>
              <p>Connectez-vous avec votre matricule</p>
              <span className="choose-btn employee-btn">
                <i className="fa fa-arrow-right me-2"></i>Accéder
              </span>
            </Link>
          </div>
          
          <div className="col-12 col-md-6">
            <Link to="/login" className="choose-card admin-card">
              <div className="choose-card-icon">
                <i className="fa fa-shield-alt"></i>
              </div>
              <h4>Espace Administrateur</h4>
              <p>Réservé aux responsables</p>
              <span className="choose-btn admin-btn">
                <i className="fa fa-arrow-right me-2"></i>Accéder
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Bg>
  );
}

export default ChooseLogin;
