import Contents from "./contents";
import { Link } from "react";

async function fetchData(url) {
    try {
        console.log("Fetching from:", url);
        const res = await fetch(url, {
            method: "GET",
            mode: "cors",
            headers: {"Content-Type": "application/json"}
        });
        
        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers.get('content-type'));
        
        if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const jsonData = await res.json();
                console.log("Received JSON:", jsonData);
                return Promise.resolve(jsonData);
            } else {
                const textData = await res.text();
                console.error("Expected JSON but got:", textData);
                return null;
            }
        } else {
            const errorText = await res.text();
            console.error(`Failed to fetch data. Status: ${res.status}`, errorText.substring(0, 200));
            return null;
        }
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}

export default function Button(props)
{
    async function handleEvent(event)
    {
        event.stopPropagation();
        let contentToDisplay; 
        let dataJson;

        switch(props.text)
        {
            case "Mission":
                dataJson = await fetchData("http://localhost:8080/Mission");
                contentToDisplay = <Contents h1={"Objet"} h2={"Destination"} h3={"Date aller"} h4={"Date retour"} 
                data={ dataJson } type={"Mission"}/>;
                break;

            case "Employés":
                dataJson = await fetchData("http://localhost:8080/Employer");
                contentToDisplay = <Contents h1={"Matricule"} h2={"Nom"} h3={"Prenom"} h4={"Service/Direction"} data={ dataJson } type={"Employés"}/>;
                break;

            case "Chauffeur":
                dataJson = await fetchData("http://localhost:8080/Chauffeur");
                contentToDisplay = <Contents h1={"Matricule"} h2={"Nom"} h3={"Prenom"} data={ dataJson } type={"Chauffeur"}/>;
                break;

            case "Vehicule":
                dataJson = await fetchData("http://localhost:8080/Vehicule");
                contentToDisplay = <Contents h1={"Matricule"} h2={"Marque"} h3={"Modele"} h4={"Disponibilité"} data={ dataJson } type={"Vehicule"}/>;
                break;
        };
        props.onContentChange(contentToDisplay);
    }

    return (
        <button className="menu-button" onClick={handleEvent}>
             
              {props.text} 
             
        </button>
    )
}