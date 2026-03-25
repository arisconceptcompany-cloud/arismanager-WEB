import './Bg.css';

function Bg({ children }) {
  return (
    <div className="bg-container">
      {children}
    </div>
  );
}

export default Bg;
