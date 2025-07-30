import Modal from "./Modal";
import { useState } from "react";
import { useNotification } from "./stateManager";
import "./table.css";

export default function Contents(props) {
    const [modal, setModal] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);
    const { showNotification } = useNotification();
    const closeModal = () => {
        setModal(null);
        setConfirmModal(null);
    };

    const handleSuccess = async () => {
        try {
            if (props.onDataChange) {
                await props.onDataChange();
                showNotification('Opération réussie !', 'success');
            }
        } catch (error) {
            showNotification('Erreur lors de la mise à jour des données.', 'error');
            console.error('Error updating data:', error);
        }
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn("Invalid date string provided:", dateString);
            return dateString;
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const showConfirm = (message, onConfirmAction) => {
        console.log('Showing confirm modal with message:', message);
        setConfirmModal(
            <Modal
                state={"confirm"}
                message={message}
                onConfirm={() => {
                    console.log('Confirm button clicked, executing action');
                    onConfirmAction();
                    closeModal();
                }}
                onClose={() => {
                    console.log('Modal closed');
                    closeModal();
                }}
            />
        );
    };

    const handleViewMission = async (rowData) => {
        try {
            const response = await fetch(`http://localhost:8080/Mission/details/${rowData.id}`, {
                method: "GET",
                mode: "cors"
            });

            if (response.ok) {
                const detailedData = await response.json();
                setModal(
                    <Modal
                        state={"view"}
                        type={"Mission"}
                        viewData={detailedData}
                        onClose={closeModal}
                    />
                );
            } else {
                console.warn("Failed to fetch detailed mission data, using basic data.");
                setModal(
                    <Modal
                        state={"view"}
                        type={"Mission"}
                        viewData={rowData}
                        onClose={closeModal}
                    />
                );
            }
        } catch (error) {
            console.error("Error fetching mission details:", error);
            setModal(
                <Modal
                    state={"view"}
                    type={"Mission"}
                    viewData={rowData}
                    onClose={closeModal}
                />
            );
        }
    };

    const handleEdit = (rowData) => {
        let modalToDisplay;
        switch (props.type) {
            case "Employés":
                modalToDisplay = <Modal
                    labels={["Matricule", "Nom", "Prenom", "Service"]}
                    state={"edit"}
                    type={"Employés"}
                    editData={rowData}
                    onSuccess={handleSuccess}
                    onClose={closeModal}
                />;
                break;
            case "Vehicule":
                modalToDisplay = <Modal
                    labels={["Matricule", "Marque", "Modele"]}
                    state={"edit"}
                    type={"Vehicule"}
                    editData={rowData}
                    onSuccess={handleSuccess}
                    onClose={closeModal}
                />;
                break;
            default:
                console.warn("Edit not supported for type:", props.type);
                return;
        }
        setModal(modalToDisplay);
    };

    const handleDelete = (rowData) => {
        console.log('Delete handler triggered for:', rowData);
        const itemType = props.type === "Employés" ? "cet employé" : "ce véhicule";
        showConfirm(
            `Êtes-vous sûr de vouloir supprimer ${itemType} ?`,
            async () => {
                try {
                    const endpoint = props.type === "Employés" ? "Employer" : "Vehicule";
                    let idToDelete;
                    console.log('Row data received:', rowData);
                    
                    // Use matricule for vehicles, id for other types
                    if (props.type === "Vehicule") {
                        idToDelete = rowData.matricule;
                    } else {
                        idToDelete = rowData.id;
                    }

                    if (!idToDelete) {
                        console.error('Missing ID/matricule in row data:', rowData);
                        showNotification("Erreur: ID de l'élément à supprimer manquant.");
                        return;
                    }

                    console.log(`Attempting to delete ${endpoint} with ID:`, idToDelete);
                    
                    const response = await fetch(`http://localhost:8080/${endpoint}/supprimer`, {
                        method: "POST",
                        mode: "cors",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ id: Number(idToDelete) })
                    });

                    let result = await response.text();
                    console.log('Delete response:', response.status, result);

                    if (response.ok) {
                        showNotification(`${props.type === "Employés" ? "Employé" : "Véhicule"} supprimé avec succès !`, "success");
                        await handleSuccess(); // Ensure we wait for the data refresh
                        return;
                    }

                    // Handle error case
                    let errorMessage;
                    try {
                        const errorResult = JSON.parse(result);
                        errorMessage = errorResult.message || 'Erreur inconnue';
                    } catch (e) {
                        errorMessage = result || 'Erreur inconnue';
                    }
                    showNotification(`Erreur lors de la suppression: ${errorMessage}`);

                } catch (error) {
                    console.error("Error deleting:", error);
                    showNotification("Erreur lors de la suppression");
                }
            }
        );
    };

    function handleClick() {
        let modalToDisplay;
        switch (props.type) {
            case "Mission":
                modalToDisplay = <Modal
                    labels={["Matricule", "Objet", "Destination", "Date aller", "Date retour"]}
                    state={"ajout"}
                    type={"Mission"}
                    onSuccess={handleSuccess}
                    onClose={closeModal}
                />;
                break;

            case "Employés":
                modalToDisplay = <Modal
                    labels={["Matricule", "Nom", "Prenom", "Service"]}
                    state={"ajout"}
                    type={"Employés"}
                    onSuccess={handleSuccess}
                    onClose={closeModal}
                />;
                break;

            case "Vehicule":
                modalToDisplay = <Modal
                    labels={["Matricule", "Marque", "Modele"]}
                    state={"ajout"}
                    type={"Vehicule"}
                    onSuccess={handleSuccess}
                    onClose={closeModal}
                />;
                break;
            default:
                console.warn("Add not supported for type:", props.type);
                return;
        }
        setModal(modalToDisplay);
    }

    const headers = Object.keys(props)
        .filter(key => key.startsWith('h') && key !== 'data' && key !== 'type' && key !== 'onDataChange')
        .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)))
        .map(key => props[key]);

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {!props.data || props.data.length === 0 ? (
                        <tr>
                            <td colSpan={headers.length} className="no-data-message">
                                Aucune donnée disponible
                            </td>
                        </tr>
                    ) : (
                        props.data.map((rowData, i) => {
                            const rowDisplayData = Object.keys(rowData)
                                .filter(key => key !== 'id' && key !== 'id_veh' && key !== 'id_chauf')
                                .map(key => {
                                    let value = rowData[key];
                                    if (props.type === "Mission" && (key === 'date_aller' || key === 'date_retour')) {
                                        value = formatDateForDisplay(value);
                                    }
                                    return value;
                                });

                            return (
                                <tr key={i}>
                                    {rowDisplayData.map((value, j) => (
                                        <td key={j}> {value} </td>
                                    ))}
                                    {headers.includes("Actions") && (
                                        <td key="actions" className="action-buttons-cell">
                                            {props.type === "Mission" ? (
                                                <button
                                                    onClick={() => handleViewMission(rowData)}
                                                    className="view-button"
                                                    title="Voir détails"
                                                >
                                                    ...
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(rowData)}
                                                        className="edit-button"
                                                        title="Modifier"
                                                    >
                                                        ✏
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('Delete button clicked for:', rowData);
                                                            handleDelete(rowData);
                                                        }}
                                                        className="delete-button"
                                                        title="Supprimer"
                                                    >
                                                        🗑
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
            <button id="plusButton" onClick={handleClick}>+</button>

            {confirmModal ? (
                <div className="ModalBackground" onClick={closeModal}>
                    <div onClick={(e) => e.stopPropagation()}>
                        {confirmModal}
                    </div>
                </div>
            ) : (
                (modal && typeof modal.type === 'function') && (
                    <div className="ModalBackground" onClick={closeModal}>
                        <div onClick={(e) => e.stopPropagation()}>
                            {modal}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
