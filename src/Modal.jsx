import { useState, useEffect } from "react";
import { useNotification } from "./stateManager";

export default function Modal(props) {
    const { showNotification } = useNotification();
    const [selectedTransportType, setSelectedTransportType] = useState("");
    const [employerInfo, setEmployerInfo] = useState("");
    const [chauffeurs, setChauffeurs] = useState([]);
    const [vehicules, setVehicules] = useState([]);

    const [fileInputLabel, setFileInputLabel] = useState("Images");
    const [fileInputAccept, setFileInputAccept] = useState("image/*");
    const [isFileInputRequired, setIsFileInputRequired] = useState(false);

    // This useEffect handles initial setup in 'edit' mode
    useEffect(() => {
        console.log("Modal useEffect: props.state or props.editData changed. props.type:", props.type, "props.state:", props.state);
        if (props.state === "edit" && props.editData) {
            const form = document.querySelector('form');
            if (form) {
                props.labels.forEach(label => {
                    const inputName = label.toLowerCase().replace(/\s+/g, '_');
                    const input = form.querySelector(`[name="${inputName}"]`);
                    let valueToSet = props.editData[inputName] || props.editData[label.toLowerCase()];

                    if (input && input.type === "date" && valueToSet) {
                        if (valueToSet.includes('/')) {
                            const [day, month, year] = valueToSet.split('/');
                            valueToSet = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        } else {
                            const dateObj = new Date(valueToSet);
                            if (!isNaN(dateObj.getTime())) {
                                valueToSet = dateObj.toISOString().split('T')[0];
                            } else {
                                valueToSet = '';
                            }
                        }
                    }

                    if (input && valueToSet !== undefined) {
                        input.value = valueToSet;
                    }
                });

                if (props.type === "Mission") {
                    const initialTransportType = props.editData.id_veh || props.editData.id_chauf ? "2" : "1";
                    console.log("Mission type detected in useEffect. Setting initialTransportType to:", initialTransportType);
                    setSelectedTransportType(initialTransportType); // Set the transport type
                    // If it's a vehicle mission in edit mode, fetch data immediately
                    if (initialTransportType === "2") {
                        console.log("Initial transport type is 'Vehicule', calling getChauffeurs() and getVehicules().");
                        getChauffeurs();
                        getVehicules();
                    }
                }
            }
        }
        // Always set file input to Images regardless of transport type or state
        setFileInputLabel("Images");
        setFileInputAccept("image/*");
        setIsFileInputRequired(false); // Images are generally not strictly required for mission
    }, [props.state, props.editData, props.labels, props.type]);

    // This useEffect handles fetching when selectedTransportType changes dynamically (e.g., user changes dropdown)
    useEffect(() => {
        console.log("Modal useEffect: selectedTransportType changed to:", selectedTransportType);
        if (selectedTransportType === "2") {
            console.log("Calling getChauffeurs() and getVehicules() for transport type 2 (dynamic change).");
            getChauffeurs();
            getVehicules();
        } else {
            // Clear chauffeurs/vehicules if transport type is not 'Vehicule'
            console.log("Selected transport type is not 'Vehicule', clearing chauffeurs/vehicules.");
            setChauffeurs([]);
            setVehicules([]);
        }
    }, [selectedTransportType]);


    const handleTransportChange = (event) => {
        const transportValue = event.target.value;
        console.log("handleTransportChange: setting selectedTransportType to:", transportValue);
        setSelectedTransportType(transportValue);
        // The second useEffect will handle fetching based on this change
    };

    async function getChauffeurs() {
        console.log("Attempting to fetch chauffeurs...");
        try {
            const response = await fetch("http://localhost:8080/chauffeurs", {
                method: "GET",
                mode: "cors"
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Chauffeurs fetched:", data.length, "items. Data:", data);
            setChauffeurs(data);
        } catch (error) {
            console.error("Erreur lors du chargement des chauffeurs:", error);
            showNotification("Erreur lors du chargement des chauffeurs.", "error"); // Notify user
        }
    }

    async function getVehicules() {
        console.log("Attempting to fetch vehicules...");
        try {
            const response = await fetch("http://localhost:8080/vehicules", {
                method: "GET",
                mode: "cors"
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Vehicules fetched:", data.length, "items. Data:", data);
            setVehicules(data);
        } catch (error) {
            console.error("Erreur lors du chargement des véhicules:", error);
            showNotification("Erreur lors du chargement des véhicules.", "error"); // Notify user
        }
    }

    const handleMatriculeChange = (event) => {
        const matricule = event.target.value;
        if (!matricule.trim()) {
            setEmployerInfo("");
            return;
        }

        fetch(`http://localhost:8080/Employer/matricule/${matricule}`, {
            method: "GET",
            mode: "cors"
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data.length > 0) {
                setEmployerInfo(`${data[0].nom} ${data[0].prenom}`);
            } else {
                setEmployerInfo("Employé non trouvé");
            }
        })
        .catch(err => {
            console.error("Erreur employé:", err);
            setEmployerInfo("Erreur lors de la recherche");
            showNotification("Erreur lors de la recherche d'employé.", "error"); // Notify user
        });
    };

    const renderTransportDetails = () => {
        console.log("Rendering transport details. selectedTransportType:", selectedTransportType);
        console.log("Current chauffeurs state:", chauffeurs);
        console.log("Current vehicules state:", vehicules);

        if (selectedTransportType === "2") {
            return (
                <>
                    <label htmlFor="chauffeur">Chauffeur</label>
                    <select name="chauffeur" required>
                        <option value="">Choisir un chauffeur</option>
                        {chauffeurs.map((c, i) => (
                            <option
                                key={i}
                                value={`${c.nom} ${c.prenom}`}
                                { ...props.state === "edit" && props.editData && props.editData.chauffeur_nom && props.editData.chauffeur_prenom &&
                                    (props.editData.chauffeur_nom === c.nom && props.editData.chauffeur_prenom === c.prenom ? { selected: true } : {})
                                }
                            >
                                {c.nom} {c.prenom}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="vehicule">Véhicule</label>
                    <select name="vehicule" required>
                        <option value="">Choisir un véhicule</option>
                        {vehicules.map((v, i) => (
                            <option
                                key={i}
                                value={`${v.marque} ${v.modele}`}
                                { ...props.state === "edit" && props.editData && props.editData.vehicule_marque && props.editData.vehicule_modele &&
                                    (props.editData.vehicule_marque === v.marque && props.editData.vehicule_modele === v.modele ? { selected: true } : {})
                                }
                            >
                                {v.marque} {v.modele}
                            </option>
                        ))}
                    </select>
                </>
            );
        }
        return null;
    };

    // Add this function to handle form submission for add/edit
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        let endpoint = "";
        let method = "POST";
        let body;
        let isMission = props.type === "Mission";
        let isEdit = props.state === "edit";
        let isAdd = props.state === "ajout";

        // Build the payload
        let payload = {};
        for (let [key, value] of formData.entries()) {
            payload[key] = value;
        }

        // Defensive mapping for Employés: map service_departement to service
        if (props.type === "Employés") {
            if (payload.service_departement && !payload.service) {
                payload.service = payload.service_departement;
                delete payload.service_departement;
            }
        }

        // Special handling for Mission (file upload)
        if (isMission) {
            endpoint = isEdit ? "/Mission/modifier" : "/Mission/ajouter";
            
            // Create a fresh FormData to avoid conflicts
            const missionFormData = new FormData();
            
            // Add all non-file fields
            Object.entries(payload).forEach(([k, v]) => {
                if (k !== 'file_upload' && k !== 'coordonnees') {
                    missionFormData.append(k, v);
                }
            });
            
            // Handle coordonnees file (PDF)
            if (form.coordonnees && form.coordonnees.files.length > 0) {
                missionFormData.append("coordonnees", form.coordonnees.files[0]);
            }
            
            // Handle multiple image files
            if (form.file_upload && form.file_upload.files.length > 0) {
                console.log(`Frontend: Found ${form.file_upload.files.length} image files to upload`);
                for (let i = 0; i < form.file_upload.files.length; i++) {
                    console.log(`Frontend: Adding file ${i + 1}: ${form.file_upload.files[i].name}`);
                    missionFormData.append("file_upload", form.file_upload.files[i]);
                }
            }
            
            body = missionFormData;
        } else if (props.type === "Employés") {
            endpoint = isEdit ? "/Employer/modifier" : "/Employer/ajouter";
            body = JSON.stringify(payload);
        } else if (props.type === "Vehicule") {
            endpoint = isEdit ? "/Vehicule/modifier" : "/Vehicule/ajouter";
            body = JSON.stringify(payload);
        } else {
            showNotification("Type de modal inconnu.", "error");
            return;
        }

        try {
            console.log(`Frontend: Sending ${method} request to ${endpoint}`);
            console.log("Frontend: Request body type:", body.constructor.name);
            
            const response = await fetch(`http://localhost:8080${endpoint}`, {
                method,
                mode: "cors",
                headers: isMission ? undefined : { "Content-Type": "application/json" },
                body: body
            });
            
            console.log("Frontend: Response status:", response.status);
            console.log("Frontend: Response ok:", response.ok);
            
            if (response.ok) {
                const responseData = await response.json();
                console.log("Frontend: Success response data:", responseData);
                showNotification(`${isEdit ? "Modification" : "Ajout"} réussi!`, "success");
                if (props.onSuccess) await props.onSuccess();
                if (props.onClose) props.onClose();
            } else {
                let errorMsg = await response.text();
                console.log("Frontend: Error response:", errorMsg);
                showNotification(`Erreur: ${errorMsg}`, "error");
            }
        } catch (err) {
            showNotification(`Erreur lors de l'envoi: ${err.message}`, "error");
        }
    };

    // Defensive: Only render for known states
    const validStates = ["ajout", "edit", "confirm", "view"];
    if (!validStates.includes(props.state)) {
        return null;
    }

    // Add rendering for view state for Mission
    if (props.state === "view" && props.type === "Mission" && props.viewData) {
        const d = props.viewData;
        // Helper to get absolute URL
        const backendUrl = "http://localhost:8080";
        const getFullUrl = (url) => url.startsWith("http") ? url : backendUrl + url;
        return (
            <div className="Modal" style={{ maxWidth: '1000px', width: '60vw' }}>
                <h2 className="modal-title" style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center', color: '#333' }}>
                    Détails de la mission
                </h2>
                <div className="mission-details" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                    {/* Employee Information */}
                    <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '18px' }}>Employé</h3>
                        <p style={{ margin: '5px 0' }}><b>Nom:</b> {d.nom}</p>
                        <p style={{ margin: '5px 0' }}><b>Prénom:</b> {d.prenom}</p>
                    </div>

                    {/* Mission Information */}
                    <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f3e5f5', borderRadius: '6px' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2', fontSize: '18px' }}>Détails de la mission</h3>
                        <p style={{ margin: '5px 0' }}><b>Objet:</b> {d.objet}</p>
                        <p style={{ margin: '5px 0' }}><b>Destination:</b> {d.destination}</p>
                        <p style={{ margin: '5px 0' }}><b>Date aller:</b> {d.date_aller}</p>
                        <p style={{ margin: '5px 0' }}><b>Date retour:</b> {d.date_retour}</p>
                    </div>
                    
                    {/* Transport Information */}
                    <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#388e3c', fontSize: '18px' }}>Transport</h3>
                        <p style={{ margin: '5px 0' }}><b>Type de transport:</b> {d.transport_type || 'Transport commun'}</p>
                        
                        {d.transport_type === 'Vehicule' && (
                            <div style={{ marginTop: '10px', paddingLeft: '15px', borderLeft: '3px solid #4caf50' }}>
                                {d.vehicule_marque && d.vehicule_modele && (
                                    <p style={{ margin: '5px 0' }}>
                                        <b>Véhicule:</b> {d.vehicule_marque} {d.vehicule_modele}
                                    </p>
                                )}
                                {d.chauffeur_nom && d.chauffeur_prenom && (
                                    <p style={{ margin: '5px 0' }}>
                                        <b>Chauffeur:</b> {d.chauffeur_nom} {d.chauffeur_prenom}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Mission Files Section */}
                    <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '6px' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#f57c00', fontSize: '18px' }}>Fichiers joints</h3>
                        {d.missionFiles && d.missionFiles.length > 0 ? (
                            <div style={{ lineHeight: '1.6' }}>
                                {d.missionFiles.map((file, i) => (
                                    <div key={i} style={{ marginBottom: '6px' }}>
                                        <a 
                                            href={getFullUrl(file.url)} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            style={{ 
                                                color: '#1976d2', 
                                                textDecoration: 'underline',
                                                fontSize: '16px'
                                            }}
                                        >
                                            {file.label}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ margin: '5px 0', color: '#666', fontStyle: 'italic' }}>
                                Aucun fichier associé à cette mission
                            </p>
                        )}
                    </div>
                </div>
                <div className="button-group">
                    <button className="button-annuler" type="button" onClick={props.onClose}>Fermer</button>
                </div>
            </div>
        );
    }

    // Handle confirmation modal separately - no Modal wrapper needed since it's already in ModalBackground
    if (props.state === "confirm") {
        return (
            <div className="confirm-modal-content">
                <h2>Confirmation</h2>
                <p>{props.message}</p>
                <div className="button-group">
                    <button className="button-annuler" type="button" onClick={props.onClose}>Annuler</button>
                    <button className="button-confirmer" type="button" onClick={props.onConfirm}>Confirmer</button>
                </div>
            </div>
        );
    }

    return (
        <div className="Modal">
            {(props.state === "ajout" || props.state === "edit") && (
                <form method="post" onSubmit={handleFormSubmit} encType={props.type === "Mission" ? "multipart/form-data" : ""}>
                    <h2 className="modal-title">
                        {props.state === "edit" ? "Modifier" : "Ajouter"} {props.type}
                    </h2>

                    {/* Hidden input for id when editing an employer */}
                    {props.state === "edit" && props.type === "Employés" && props.editData && props.editData.id && (
                        <input type="hidden" name="id" value={props.editData.id} />
                    )}

                    {props.labels.map((label, i) => {
                        const inputName = label.toLowerCase().replace(/\s+/g, '_');
                        // Ensure 'Coordonnées' label is never rendered as an input
                        if (inputName === 'coordonnees') return null;

                        const inputType = inputName.includes("date") ? "date" : "text";
                        let defaultValue = '';
                        if (props.state === "edit" && props.editData) {
                            let rawValue = props.editData[inputName] || '';
                            if (inputType === 'date' && rawValue) {
                                // Convert DD/MM/YYYY or other formats to YYYY-MM-DD
                                if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
                                    const [day, month, year] = rawValue.split('/');
                                    defaultValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                } else {
                                    const dateObj = new Date(rawValue);
                                    if (!isNaN(dateObj.getTime())) {
                                        defaultValue = dateObj.toISOString().split('T')[0];
                                    } else {
                                        defaultValue = '';
                                    }
                                }
                            } else {
                                defaultValue = rawValue;
                            }
                        }
                        return (
                            <div key={i}>
                                <label htmlFor={inputName}>{label}</label>
                                <input
                                    name={inputName}
                                    type={inputType}
                                    defaultValue={defaultValue}
                                    required
                                    onChange={inputName === 'matricule' && props.type === 'Mission' ? handleMatriculeChange : undefined}
                                />
                                {inputName === 'matricule' && props.type === 'Mission' && employerInfo && (
                                    <p style={{
                                        color: employerInfo === "Employé non trouvé" || employerInfo === "Erreur lors de la recherche" ? '#d32f2f' : '#2e7d32',
                                        fontWeight: 'bold',
                                        margin: '5px 0',
                                        fontSize: '14px'
                                    }}>
                                        {employerInfo}
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    {props.type === "Mission" && (
                        <>
                            <label htmlFor="transport">Type de transport</label>
                            <select name="transport" onChange={handleTransportChange} value={selectedTransportType} required>
                                <option value="">Choisir le type de transport</option>
                                <option value="1">Transport commun</option>
                                <option value="2">Véhicule</option>
                            </select>

                            {renderTransportDetails()}

                            <label htmlFor="file_upload">{fileInputLabel}</label>
                            <input
                                name="file_upload"
                                type="file"
                                accept={fileInputAccept}
                                required={isFileInputRequired}
                                multiple
                            />
                        </>
                    )}

                    <div className="button-group">
                        <button className="button-annuler" type="button" onClick={props.onClose}>Annuler</button>
                        <button className="button-confirmer" type="submit">
                            {props.state === "edit" ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}