import logo from "/src/lancement.png";

export default function Navbar()
{
    return (
        <div className="titre">
          <img className="logo" src={logo}/>
          <span className="titre-logo"> Gestion des missions </span>
        </div>
    );
}