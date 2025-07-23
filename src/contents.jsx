import Button from "./button";
import Modal from "./Modal";
import { useState } from "react";

export let exportFunc;

export default function Contents(props)
{
    const [modal, setModal] = useState(null);

    const closeModal = () => {
        setModal(null);
    }

    exportFunc = closeModal;

    let modalToDisplay;

    function handleClick()
    {   
        switch(props.type)
        {
            case "Mission":
                modalToDisplay = <Modal labels={["Objet", "Destination", "Date aller", "Date retour"]} state={"ajout"}/>
                break;

            case "Employés":
                modalToDisplay = <Modal labels={["Matricule", "Nom", "Prenom", "Service/Departement"]} state={"ajout"}/>
                break;

            case "Chauffeur":
                modalToDisplay = <Modal labels={["Matricule", "Nom", "Prenom"]} state={"ajout"}/>
                break;

            case "Vehicule":
                modalToDisplay = <Modal labels={["Matricule", "Marque", "Modele", "Disponibilite"]} state={"ajout"}/>
                break;
        }
        setModal(modalToDisplay);
    }

    return (
        <div className="table-container">
            <table className="table">
             <thead>
                <tr>
                {
                    (() => {
                        let headers = [];
                        let keys = Object.keys(props);

                        for(let i = 0; (i < keys.length) && (keys[i] != "data"); i++)
                        {
                            headers.push(<th key={i}>{props[keys[i]]}</th>);
                        }
                        return headers;
                    })()
                }
                </tr>
             </thead>

             <tbody>

                {
                    (() => { 
                        
                        let rowsData = [];
                        console.log(props.data);

                        for(let i = 0; i < props.data.length; i++)
                        {   
                            let columnData = [];
                            let currentKeysInARow = Object.values(props.data[i]);
                            currentKeysInARow = currentKeysInARow.slice(1, currentKeysInARow.length);

                            for(let j = 0; j < currentKeysInARow.length; j++)
                            {
                                columnData.push(<td key={j}> {currentKeysInARow[j]} </td>)
                            }

                            console.log(columnData);

                            rowsData.push(<tr key={i}>{columnData}</tr>);
                        }

                        return rowsData;
                })()}

             </tbody> 
            </table>
            <button id="plusButton" onClick={handleClick}>+</button>
            {modal && (
                <div className="ModalBackground" onClick={closeModal}>
                    <div onClick={(e) => e.stopPropagation()}>
                        {modal}
                    </div>
                </div>
            )}
        </div>
    )
}