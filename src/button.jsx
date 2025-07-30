import Contents from "./contents";
import { useState } from "react";

async function fetchData(url) {
    try {
        console.log("Fetching from:", url);
        const res = await fetch(url, {
            method: "GET",
            mode: "cors",
            headers: { "Content-Type": "application/json" }
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

export default function Button(props) {
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshData = async () => {
        console.log("Refreshing data for:", props.text);
        let dataJson;
        let contentToDisplay;

        try {
            setRefreshKey(prev => prev + 1);
            switch (props.text) {
            case "Mission":
                dataJson = await fetchData("http://localhost:8080/Mission");
                contentToDisplay = <Contents
                    key={`mission-${refreshKey}`}
                    h1={"Nom"}
                    h2={"Prenom"}
                    h3={"Objet"}
                    h4={"Destination"}
                    h5={"Date aller"}
                    h6={"Date retour"}
                    h7={"Actions"}
                    data={dataJson || []}
                    type={"Mission"}
                    onDataChange={refreshData}
                />;
                break;

            case "Employés":
                dataJson = await fetchData("http://localhost:8080/Employer");
                contentToDisplay = <Contents
                    key={`employes-${refreshKey}`}
                    h1={"Matricule"}
                    h2={"Nom"}
                    h3={"Prenom"}
                    h4={"Service/Direction"}
                    h5={"Actions"}
                    data={dataJson || []}
                    type={"Employés"}
                    onDataChange={refreshData}
                />;
                break;

            case "Vehicule":
                dataJson = await fetchData("http://localhost:8080/Vehicule");
                console.log("Fetched vehicle data:", dataJson);
                contentToDisplay = <Contents
                    key={`vehicule-${refreshKey}`}
                    h1={"Matricule"}
                    h2={"Marque"}
                    h3={"Modele"}
                    h4={"Actions"}
                    data={dataJson || []}
                    type={"Vehicule"}
                    onDataChange={refreshData}
                />;
                break;
            default:
                console.warn("Unknown button type:", props.text);
                return;
            }

            if (contentToDisplay) {
                props.onContentChange(contentToDisplay);
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    };

    async function handleEvent(event) {
        event.stopPropagation();

        props.onButtonClick(props.text);

        await refreshData();
    }

    const isActive = props.activeButton === props.text;

    return (
        <button
            className={`menu-button ${isActive ? 'active' : ''}`}
            onClick={handleEvent}
        >
            {props.text}
        </button>
    );
}
