import Contents from "./contents";

export default function Button(props)
{

    function handleEvent(event)
    {
        event.stopPropagation();
        let contentToDisplay; 

        switch(props.text)
        {
            case "Mission":
                contentToDisplay = <Contents h1={"Objet"} h2={"Destination"} h3={"Date aller"} h4={"Date retour"} data={{  }} />;
                break;

            case "Employés":
                contentToDisplay = <Contents h1={"Nom"} h2={"Prenom"} h3={"Service/Direction"} h4={"Matricule"} data={{  }} />;
                break;

            case "Chauffeur":
                contentToDisplay = <Contents h1={"Nom"} h2={"Prenom"} h3={"Matricule"} data={{  }} />;
                break;

            case "Vehicule":
                contentToDisplay = <Contents h1={"Matricule"} h2={"Marque"} h3={"Modele"} h4={"Disponibilité"} data={{  }} />;
                break;
        };
        props.onContentChange(contentToDisplay);
    }

    return (
        <button className="menu-button" onClick={handleEvent}> {props.text} </button>
    )
}