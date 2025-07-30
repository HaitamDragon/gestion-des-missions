import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import fs from "fs/promises"; // Use fs.promises for async file operations
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your existing UPLOADS_DIR
const UPLOADS_DIR = path.join(__dirname, 'imgs');

fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(err => console.error("Error creating uploads directory:", err));

const app = express();

const connection = await mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "db_mission"
});

async function fetchDatabase(sqlStmt, params = []) {
    try {
        const [rows] = await connection.execute(sqlStmt, params);
        return rows;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}

const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json());
// Your existing static file serving
app.use('/imgs', express.static(UPLOADS_DIR));

// Your existing employeeImageStorage (will be used for mission files too, as per original code)
const employeeImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        // Use fieldname in filename to distinguish between coordonnees and general images
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// Multer configuration to accept both file types ('coordonnees' and 'file_upload')
const uploadMissionFiles = multer({
    storage: employeeImageStorage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'coordonnees') {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type for coordonnees, only PDF is allowed!'), false);
            }
        } else if (file.fieldname === 'file_upload') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type for images, only image files are allowed!'), false);
            }
        } else {
            cb(new Error('Unexpected file field!'), false);
        }
    }
}).fields([
    { name: 'coordonnees', maxCount: 1 },
    { name: 'file_upload', maxCount: 5 } // Allow up to 5 images
]);


app.get("/Employer/matricule/:matricule", async (req, res) => {
    try {
        const matricule = req.params.matricule;
        const response = await fetchDatabase(
            "SELECT nom, prenom FROM Employer WHERE matricule = ? AND service <> ?",
            [matricule, "chauffeur"]
        );
        console.log(`Server: Fetched employer for matricule ${matricule}:`, response.length, "records.");
        res.json(response);
    } catch (err) {
        console.error("Error fetching employer by matricule:", err);
        res.status(500).json({ error: "Database error", message: err.message });
    }
});

app.get("/Mission", async (req, res) => {
    try {
        const response = await fetchDatabase(`
            SELECT 
                m.id,
                e.nom, 
                e.prenom, 
                m.objet, 
                m.destination, 
                DATE_FORMAT(m.date_aller, '%d/%m/%Y') as date_aller, 
                DATE_FORMAT(m.date_retour, '%d/%m/%Y') as date_retour,
                m.id_veh,
                m.id_chauf
            FROM Mission m 
            INNER JOIN Employer e ON m.id_employer = e.id
        `);
        console.log("Server: Fetched missions:", response.length, "records.");
        res.json(response);
    } catch (err) {
        console.error("Error fetching missions:", err);
        res.status(500).json({ error: "Database error", message: err.message });
    }
});

app.get("/Mission/details/:id", async (req, res) => {
    try {
        const missionId = req.params.id;
        console.log(`Server: Fetching details for Mission ID: ${missionId}`);
        const missionResponse = await fetchDatabase(`
            SELECT 
                m.id,
                e.nom, 
                e.prenom, 
                m.objet, 
                m.destination, 
                DATE_FORMAT(m.date_aller, '%d/%m/%Y') as date_aller, 
                DATE_FORMAT(m.date_retour, '%d/%m/%Y') as date_retour,
                m.id_veh,
                m.id_chauf,
                CASE WHEN m.id_veh IS NOT NULL THEN 'Vehicule' ELSE 'Transport commun' END AS transport_type
            FROM Mission m 
            INNER JOIN Employer e ON m.id_employer = e.id
            WHERE m.id = ?
        `, [missionId]);

        if (missionResponse.length === 0) {
            console.log(`Server: Mission with ID ${missionId} not found.`);
            return res.status(404).json({ error: "Mission not found" });
        }

        const mission = missionResponse[0];
        console.log("Server: Mission details fetched:", mission);

        // Get the employee's ID for this mission
        const employerResult = await fetchDatabase(
            "SELECT id_employer FROM Mission WHERE id = ?",
            [missionId]
        );

        if (employerResult.length > 0) {
            const employerId = employerResult[0].id_employer;
            console.log(`Server: Looking for files for employee ID: ${employerId}`);
            
            // Get all files for this specific mission
            const filesResult = await fetchDatabase(
                `SELECT i.image_url 
                 FROM images i 
                 WHERE i.mission_id = ?
                 ORDER BY i.image_url`,
                [missionId]
            );
            
            console.log(`Server: Found ${filesResult.length} files for employee ${employerId}:`, filesResult);
            
            // Separate files by type
            const pdfFiles = filesResult.filter(file => file.image_url.toLowerCase().includes('.pdf'));
            const imageFiles = filesResult.filter(file => !file.image_url.toLowerCase().includes('.pdf'));
            
            // Include all files in the mission files array
            mission.missionFiles = [];
            
            // Add PDF files (coordinates)
            pdfFiles.forEach((file, index) => {
                mission.missionFiles.push({
                    url: file.image_url,
                    label: `Coordonnées ${index + 1}`,
                    type: 'pdf'
                });
            });
            
            // Add image files
            imageFiles.forEach((file, index) => {
                mission.missionFiles.push({
                    url: file.image_url,
                    label: `Image ${index + 1}`,
                    type: 'image'
                });
            });
            
            // Keep backward compatibility
            mission.coordonnees = pdfFiles.length > 0 ? pdfFiles[0].image_url : null;
            mission.images = imageFiles.map(img => img.image_url);
            
            console.log(`Server: Mission files processed - ${pdfFiles.length} PDFs, ${imageFiles.length} images`);
        }

        if (mission.id_chauf) {
            const chauffeurResponse = await fetchDatabase(
                "SELECT nom, prenom FROM Employer WHERE id = ?",
                [mission.id_chauf]
            );
            if (chauffeurResponse.length > 0) {
                mission.chauffeur_nom = chauffeurResponse[0].nom;
                mission.chauffeur_prenom = chauffeurResponse[0].prenom;
                console.log("Server: Chauffeur details for mission:", chauffeurResponse[0]);
            }
        }

        if (mission.id_veh) {
            const vehiculeResponse = await fetchDatabase(
                "SELECT marque, modele FROM Vehicule WHERE matricule = ?",
                [mission.id_veh]
            );
            if (vehiculeResponse.length > 0) {
                mission.vehicule_marque = vehiculeResponse[0].marque;
                mission.vehicule_modele = vehiculeResponse[0].modele;
                console.log("Server: Vehicule details for mission:", vehiculeResponse[0]);
            }
        }

        res.json(mission);
    } catch (err) {
        console.error("Error fetching mission details:", err);
        res.status(500).json({ error: "Database error", message: err.message });
    }
});

app.get("/Employer", async (req, res) => {
    try {
        const response = await fetchDatabase("SELECT id, matricule, nom, prenom, Service FROM Employer");
        console.log("Server: Fetched employers:", response.length, "records.");
        res.json(response);
    } catch (err) {
        console.error("Error fetching employers:", err);
        res.status(500).json({ error: "Database error", message: err.message });
    }
});

app.get("/Vehicule", async (req, res) => {
    try {
        const response = await fetchDatabase("SELECT matricule, marque, modele FROM Vehicule");
        console.log("Server: Fetched vehicles:", response.length, "records.");
        res.json(response);
    } catch (err) {
        console.error("Error fetching vehicles:", err);
        res.status(500).json({ error: "Database error", message: err.message });
    }
});

app.get("/chauffeurs", async (req, res) => {
    console.log("Server: Attempting to fetch available chauffeurs...");
    try {
        const response = await fetchDatabase(`
            SELECT e.id, e.nom, e.prenom 
            FROM Employer e 
            WHERE e.service = 'chauffeur' 
            AND e.id NOT IN (
                SELECT m.id_chauf 
                FROM Mission m 
                WHERE m.id_chauf IS NOT NULL 
                AND (
                    CURDATE() BETWEEN m.date_aller AND m.date_retour
                    OR m.date_aller > CURDATE()
                )
            )
        `);
        console.log("Server: Fetched available chauffeurs:", response.length, "records. Data:", response);
        res.json(response);
    } catch (err) {
        console.error("Error fetching available chauffeurs:", err);
        res.status(500).json({ error: "Database error", message: err.message });
    }
});

app.get("/vehicules", async (req, res) => {
    console.log("Server: Attempting to fetch available vehicules...");
    try {
        const response = await fetchDatabase(`
            SELECT v.matricule, v.marque, v.modele 
            FROM Vehicule v 
            WHERE v.matricule NOT IN (
                SELECT m.id_veh 
                FROM Mission m where m.id_veh is not null and
                (
                    CURDATE() BETWEEN m.date_aller AND m.date_retour
                    OR m.date_aller > CURDATE()
                )
            )
        `);
        console.log("Server: Fetched available vehicules:", response.length, "records. Data:", response);
        res.json(response);
    } catch (err) {
        console.error("Error fetching available vehicles:", err);
        res.status(500).json({ error: "Database error", message: err.message });
    }
});

app.post("/Mission/ajouter", uploadMissionFiles, async (req, res) => {
    console.log("=== MISSION AJOUTER START ===");
    console.log("Request Body:", req.body);
    console.log("Uploaded Files:", req.files);
    
    // Detailed file logging
    if (req.files) {
        if (req.files.coordonnees) {
            console.log(`Server: Coordonnees files count: ${req.files.coordonnees.length}`);
        }
        if (req.files.file_upload) {
            console.log(`Server: Image files count: ${req.files.file_upload.length}`);
            console.log("Server: Image file details:", req.files.file_upload.map(f => ({
                filename: f.filename,
                originalname: f.originalname,
                size: f.size
            })));
        }
    }

        let coordonneesFile = null;
        let imageFiles = [];

        if (req.files) {
            if (req.files.coordonnees && req.files.coordonnees.length > 0) {
                coordonneesFile = req.files.coordonnees[0];
            }
            if (req.files.file_upload && req.files.file_upload.length > 0) {
                imageFiles = req.files.file_upload;
            }
        }
        
    try {
        const {
            matricule,
            objet,
            destination,
            vehicule,
            chauffeur,
            transport,
            date_aller: date_aller_raw,
            date_retour: date_retour_raw
        } = req.body;

        // Convert dates from DD/MM/YYYY to YYYY-MM-DD format
        const formatDateForSQL = (dateStr) => {
            if (!dateStr) return null;
            
            // If it's already in YYYY-MM-DD format, return as is
            if (dateStr.includes('-')) {
                return dateStr;
            }
            
            // Handle DD/MM/YYYY format
            try {
                const [day, month, year] = dateStr.split('/');
                if (!day || !month || !year) return null;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } catch (error) {
                console.error('Date format error:', error);
                return null;
            }
        };

        const date_aller = formatDateForSQL(date_aller_raw);
        const date_retour = formatDateForSQL(date_retour_raw);

        let vehiculeId = null;
        let chauffeurId = null;
        let idEmployer;

        try {
            const employerRows = await fetchDatabase(
                "SELECT id FROM Employer WHERE matricule = ?",
                [matricule]
            );
            if (employerRows.length === 0) {
                throw new Error("Employé non trouvé pour le matricule fourni.");
            }
            idEmployer = employerRows[0].id;
        } catch (error) {
            throw new Error(`Erreur lors de la recherche de l'employé: ${error.message}`);
        }

        if (transport === "2") {
            if (vehicule) {
                try {
                    const [vehiculeMarque, vehiculeModele] = vehicule.split(" ");
                    const vehiculeRows = await fetchDatabase(
                        "SELECT matricule FROM Vehicule WHERE modele = ? AND marque = ?",
                        [vehiculeModele, vehiculeMarque]
                    );
                    if (vehiculeRows.length > 0) {
                        vehiculeId = vehiculeRows[0].matricule;
                    } else {
                        vehiculeId = null;
                        console.warn(`Vehicule '${vehicule}' not found for mission. Setting vehiculeId to null.`);
                    }
                } catch (error) {
                    console.error(`Error during vehicule lookup for '${vehicule}': ${error.message}`);
                    vehiculeId = null;
                }
            } else {
                vehiculeId = null;
            }

            if (chauffeur) {
                try {
                    const [chauffeurNom, chauffeurPrenom] = chauffeur.split(" ");
                    const chauffeurRows = await fetchDatabase(
                        "SELECT id FROM Employer WHERE nom = ? AND prenom = ? AND service = 'chauffeur'",
                        [chauffeurNom, chauffeurPrenom]
                    );
                    if (chauffeurRows.length > 0) {
                        chauffeurId = chauffeurRows[0].id;
                    } else {
                        chauffeurId = null;
                        console.warn(`Chauffeur '${chauffeur}' not found for mission. Setting chauffeurId to null.`);
                    }
                } catch (error) {
                    console.error(`Error during chauffeur lookup for '${chauffeur}': ${error.message}`);
                    chauffeurId = null;
                }
            } else {
                chauffeurId = null;
            }
        }

        let missionId;
        try {
            const missionSql = `
                INSERT INTO Mission (objet, destination, date_aller, date_retour, id_veh, id_chauf, id_employer)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            // Ensure all values are either their value or null, never undefined
            const params = [
                objet || null,
                destination || null,
                date_aller || null,
                date_retour || null,
                vehiculeId || null,
                chauffeurId || null,
                idEmployer || null
            ];
            console.log('Server: Mission insert params:', params);
            const missionResult = await connection.execute(missionSql, params);
            missionId = missionResult[0].insertId;

            let insertedFileUrls = [];

            try {
                // Handle coordonnees file (PDF)
                if (coordonneesFile) {
                    console.log(`Server: Processing coordonnees file: ${coordonneesFile.filename}`);
                    const fileUrl = `/imgs/${coordonneesFile.filename}`;
                    insertedFileUrls.push(fileUrl);

                    await connection.execute(
                        `INSERT INTO images (idEmp, image_url, mission_id) VALUES (?, ?, ?)`,
                        [idEmployer, fileUrl, missionId]
                    );
                    console.log(`Server: Successfully inserted coordonnees file: ${fileUrl}`);
                }

                // Handle multiple image files
                if (req.files && req.files.file_upload) {
                    const imageFiles = Array.isArray(req.files.file_upload) ? 
                        req.files.file_upload : [req.files.file_upload];
                    
                    console.log(`Server: About to process ${imageFiles.length} image files`);
                    console.log("Server: Image files array:", imageFiles.map(f => f.filename));
                        
                    for (const file of imageFiles) {
                        console.log(`Server: Processing image file: ${file.filename}`);
                        const fileUrl = `/imgs/${file.filename}`;
                        insertedFileUrls.push(fileUrl);

                        try {
                            await connection.execute(
                                `INSERT INTO images (idEmp, image_url, mission_id) VALUES (?, ?, ?)`,
                                [idEmployer, fileUrl, missionId]
                            );
                            console.log(`Server: Successfully inserted image file: ${fileUrl}`);
                        } catch (insertError) {
                            console.error(`Server: Failed to insert image file ${fileUrl}:`, insertError);
                            throw insertError;
                        }
                    }
                }

                // Get all images for this mission
                const [existingImages] = await connection.execute(
                    `SELECT image_url FROM images WHERE mission_id = ?`,
                    [missionId]
                );

                const allImageUrls = existingImages.map(img => img.image_url);

                if (insertedFileUrls.length === 0) {
                    console.log("Server: No new files uploaded for mission.");
                }

            } catch (error) {
                console.error("Server: Error during file processing:", error);
                throw error;
            }

            console.log("Server: About to send success response");
            res.status(201).json({
                message: "Mission et fichiers ajoutés avec succès!",
                missionId: missionId,
                fileUrls: insertedFileUrls,
                coordonneesUrl: coordonneesFile ? `/imgs/${coordonneesFile.filename}` : null,
                imageUrls: req.files.file_upload ? req.files.file_upload.map(file => `/imgs/${file.filename}`) : []
            });
            console.log("Server: Success response sent");

        } catch (dbErr) {
            console.error("Database error during mission creation:", dbErr);
            throw dbErr;
        }

    } catch (err) {
        console.error("Error in Mission/ajouter:", err);

        if (coordonneesFile) {
            await fs.unlink(coordonneesFile.path).catch(deleteErr =>
                console.error(`Error deleting temp coordonnees file (${coordonneesFile.path}):`, deleteErr)
            );
        }
        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                await fs.unlink(file.path).catch(deleteErr =>
                    console.error(`Error deleting temp image file (${file.path}):`, deleteErr)
                );
            }
        }

        console.log("=== MISSION AJOUTER ERROR ===");
        console.error("Final error handler:", err);
        
        if (err instanceof multer.MulterError) {
            console.log("Multer error detected");
            return res.status(400).json({
                message: `Erreur de téléchargement de fichier: ${err.message}`,
                error: err.code
            });
        }
        console.log("Sending 500 error response");
        res.status(500).json({
            message: `Échec de l'ajout de la mission: ${err.message}`,
            error: err.message
        });
    }
});

app.post("/Mission/modifier", uploadMissionFiles, async (req, res) => {
    console.log("Request Body (Mission Modifier):", req.body);
    console.log("Uploaded Files (Mission Modifier):", req.files);

    let newCoordonneesFile = null;
    let newImageFile = null;

    if (req.files) {
        if (req.files.coordonnees && req.files.coordonnees.length > 0) {
            newCoordonneesFile = req.files.coordonnees[0];
        }
        if (req.files.file_upload && req.files.file_upload.length > 0) {
            newImageFile = req.files.file_upload[0];
        }
    }

    try {
        const {
            id, // Mission ID to modify
            matricule,
            objet,
            destination,
            vehicule,
            chauffeur,
            transport,
            date_aller: date_aller_raw,
            date_retour: date_retour_raw,
            current_coordonnees_url,
            current_image_url
        } = req.body;

        // Convert dates from DD/MM/YYYY to YYYY-MM-DD format
        const formatDateForSQL = (dateStr) => {
            if (!dateStr) return null;
            
            // If it's already in YYYY-MM-DD format, return as is
            if (dateStr.includes('-')) {
                return dateStr;
            }
            
            // Handle DD/MM/YYYY format
            try {
                const [day, month, year] = dateStr.split('/');
                if (!day || !month || !year) return null;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } catch (error) {
                console.error('Date format error:', error);
                return null;
            }
        };

        const date_aller = formatDateForSQL(date_aller_raw);
        const date_retour = formatDateForSQL(date_retour_raw);

        let vehiculeId = null;
        let chauffeurId = null;
        let idEmployer;

        try {
            const employerRows = await fetchDatabase(
                "SELECT id FROM Employer WHERE matricule = ?",
                [matricule]
            );
            if (employerRows.length === 0) {
                throw new Error("Employé non trouvé pour le matricule fourni.");
            }
            idEmployer = employerRows[0].id;
        } catch (error) {
            throw new Error(`Erreur lors de la recherche de l'employé: ${error.message}`);
        }

        if (transport === "2") {
            if (vehicule) {
                try {
                    const [vehiculeMarque, vehiculeModele] = vehicule.split(" ");
                    const vehiculeRows = await fetchDatabase(
                        "SELECT matricule FROM Vehicule WHERE modele = ? AND marque = ?",
                        [vehiculeModele, vehiculeMarque]
                    );
                    if (vehiculeRows.length > 0) {
                        vehiculeId = vehiculeRows[0].matricule;
                    } else {
                        vehiculeId = null;
                        console.warn(`Vehicule '${vehicule}' not found for mission modification. Setting vehiculeId to null.`);
                    }
                } catch (error) {
                    console.error(`Error during vehicule lookup for '${vehicule}': ${error.message}`);
                    vehiculeId = null;
                }
            } else {
                vehiculeId = null;
            }

            if (chauffeur) {
                try {
                    const [chauffeurNom, chauffeurPrenom] = chauffeur.split(" ");
                    const chauffeurRows = await fetchDatabase(
                        "SELECT id FROM Employer WHERE nom = ? AND prenom = ? AND service = 'chauffeur'",
                        [chauffeurNom, chauffeurPrenom]
                    );
                    if (chauffeurRows.length > 0) {
                        chauffeurId = chauffeurRows[0].id;
                    } else {
                        chauffeurId = null;
                        console.warn(`Chauffeur '${chauffeur}' not found for mission modification. Setting chauffeurId to null.`);
                    }
                } catch (error) {
                    console.error(`Error during chauffeur lookup for '${chauffeur}': ${error.message}`);
                    chauffeurId = null;
                }
            } else {
                chauffeurId = null;
            }
        }

        let finalCoordonneesUrl = newCoordonneesFile ? `/imgs/${newCoordonneesFile.filename}` : current_coordonnees_url;
        let finalImageUrl = newImageFile ? `/imgs/${newImageFile.filename}` : current_image_url;

        const missionUpdateSql = `
            UPDATE Mission 
            SET objet = ?, destination = ?, date_aller = ?, date_retour = ?, 
                id_veh = ?, id_chauf = ?, id_employer = ?
            WHERE id = ?
        `;
        const missionResult = await connection.execute(
            missionUpdateSql,
            [
                objet,
                destination,
                date_aller,
                date_retour,
                vehiculeId,
                chauffeurId,
                idEmployer,
                id
            ]
        );
        console.log("Server: Mission update result:", missionResult[0].affectedRows, "rows affected.");

        if (newCoordonneesFile) {
            if (current_coordonnees_url) {
                await connection.execute("DELETE FROM images WHERE image_url = ?", [current_coordonnees_url]);
                const oldPath = path.join(__dirname, 'imgs', path.basename(current_coordonnees_url));
                await fs.unlink(oldPath).catch(err => console.error("Error deleting old coordonnees file:", err));
                console.log(`Server: Deleted old coordonnees file: ${current_coordonnees_url}`);
            }
            await connection.execute(`INSERT INTO images (idEmp, image_url, mission_id) VALUES (?, ?, ?)`, [idEmployer, finalCoordonneesUrl, id]);
            console.log(`Server: Inserted new coordonnees file: ${finalCoordonneesUrl}`);
        }
        if (newImageFile) {
            if (current_image_url) {
                 await connection.execute("DELETE FROM images WHERE image_url = ?", [current_image_url]);
                 const oldPath = path.join(__dirname, 'imgs', path.basename(current_image_url));
                 await fs.unlink(oldPath).catch(err => console.error("Error deleting old image file:", err));
                 console.log(`Server: Deleted old image file: ${current_image_url}`);
            }
            await connection.execute(`INSERT INTO images (idEmp, image_url, mission_id) VALUES (?, ?, ?)`, [idEmployer, finalImageUrl, id]);
            console.log(`Server: Inserted new image file: ${finalImageUrl}`);
        }

        res.status(200).json({
            message: "Mission modifiée avec succès!",
            affectedRows: missionResult[0].affectedRows
        });

    } catch (err) {
        console.error("Error in Mission/modifier:", err);

        if (newCoordonneesFile) {
            await fs.unlink(newCoordonneesFile.path).catch(deleteErr =>
                console.error(`Error deleting temp coordonnees file (${newCoordonneesFile.path}):`, deleteErr)
            );
        }
        if (newImageFile) {
            await fs.unlink(newImageFile.path).catch(deleteErr =>
                console.error(`Error deleting temp image file (${newImageFile.path}):`, deleteErr)
            );
        }
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                message: `Erreur de téléchargement de fichier: ${err.message}`,
                error: err.code
            });
        }
        res.status(500).json({
            message: `Échec de la modification de la mission: ${err.message}`,
            error: err.message
        });
    }
});


app.post("/Employer/ajouter", async (req, res) => {
    console.log("Adding Employer:", req.body);
    try {
        const { matricule, nom, prenom, service } = req.body;

        // Defensive check for undefined values
        if ([matricule, nom, prenom, service].some(v => v === undefined)) {
            return res.status(400).json({ message: "All fields (matricule, nom, prenom, service) are required and must not be undefined." });
        }

        const result = await connection.execute(
            "INSERT INTO Employer (matricule, nom, prenom, service) VALUES (?, ?, ?, ?)",
            [matricule, nom, prenom, service]
        );
        console.log("Server: Employer added successfully, ID:", result[0].insertId);
        res.status(201).json({
            message: "Employé ajouté avec succès!",
            id: result[0].insertId
        });
    } catch (err) {
        console.error("Error adding employer:", err);
        res.status(500).json({ message: `Erreur lors de l'ajout: ${err.message}` });
    }
});

app.post("/Employer/modifier", async (req, res) => {
    console.log("Modifying Employer:", req.body);
    try {
        const { id, matricule, nom, prenom, service } = req.body;
        // Convert undefined to null for SQL safety
        const safe = v => v === undefined ? null : v;
        const params = [safe(matricule), safe(nom), safe(prenom), safe(service), safe(id)];
        const result = await connection.execute(
            "UPDATE Employer SET matricule = ?, nom = ?, prenom = ?, service = ? WHERE id = ?",
            params
        );
        console.log("Server: Employer modified successfully, affected rows:", result[0].affectedRows);
        res.status(200).json({
            message: "Employé modifié avec succès!",
            affectedRows: result[0].affectedRows
        });
    } catch (err) {
        console.error("Error modifying employer:", err);
        res.status(500).json({ message: `Erreur lors de la modification: ${err.message}` });
    }
});

app.post("/Employer/supprimer", async (req, res) => {
    console.log("Deleting Employer:", req.body);
    try {
        const { id } = req.body;

        const result = await connection.execute(
            "DELETE FROM Employer WHERE id = ?",
            [id]
        );

        if (result[0].affectedRows === 0) {
            console.log("Server: Employer not found for deletion, ID:", id);
            return res.status(404).json({ message: "Employé non trouvé." });
        }
        console.log("Server: Employer deleted successfully, affected rows:", result[0].affectedRows);
        res.status(200).json({
            message: "Employé supprimé avec succès!",
            affectedRows: result[0].affectedRows
        });
    } catch (err) {
        console.error("Error deleting employer:", err);
        res.status(500).json({ message: `Erreur lors de la suppression: ${err.message}` });
    }
});

app.post("/Vehicule/ajouter", async (req, res) => {
    console.log("Adding Vehicule:", req.body);
    try {
        const { matricule, marque, modele } = req.body;
        
        // Ensure matricule is a valid integer
        const matriculeInt = parseInt(matricule, 10);
        if (isNaN(matriculeInt)) {
            throw new Error("Le matricule doit être un nombre entier");
        }

        const result = await connection.execute(
            "INSERT INTO Vehicule (matricule, marque, modele) VALUES (?, ?, ?)",
            [matriculeInt, marque, modele]
        );
        console.log("Server: Vehicule added successfully, matricule:", matriculeInt);
        res.status(201).json({
            message: "Véhicule ajouté avec succès!",
            id: matricule
        });
    } catch (err) {
        console.error("Error adding vehicle:", err);
        res.status(500).json({ message: `Erreur lors de l'ajout: ${err.message}` });
    }
});

app.post("/Vehicule/modifier", async (req, res) => {
    console.log("Modifying Vehicule:", req.body);
    try {
        const { matricule, marque, modele } = req.body;
        
        // Convert matricule to number to ensure it's a valid integer
        const matriculeInt = parseInt(matricule, 10);
        if (isNaN(matriculeInt)) {
            throw new Error("Le matricule doit être un nombre entier");
        }

        const result = await connection.execute(
            "UPDATE Vehicule SET marque = ?, modele = ? WHERE matricule = ?",
            [marque, modele, matriculeInt]
        );
        console.log("Server: Vehicule modified successfully, affected rows:", result[0].affectedRows);
        res.status(200).json({
            message: "Véhicule modifié avec succès!",
            affectedRows: result[0].affectedRows
        });
    } catch (err) {
        console.error("Error modifying vehicle:", err);
        res.status(500).json({ message: `Erreur lors de la modification: ${err.message}` });
    }
});

app.post("/Vehicule/supprimer", async (req, res) => {
    console.log("Deleting Vehicule:", req.body);
    try {
        const { id } = req.body;

        const result = await connection.execute(
            "DELETE FROM Vehicule WHERE matricule = ?",
            [id]
        );

        if (result[0].affectedRows === 0) {
            console.log("Server: Vehicule not found for deletion, ID:", id);
            return res.status(404).json({ message: "Véhicule non trouvé." });
        }
        console.log("Server: Vehicule deleted successfully, affected rows:", result[0].affectedRows);
        res.status(200).json({
            message: "Véhicule supprimé avec succès!",
            affectedRows: result[0].affectedRows
        });
    } catch (err) {
        console.error("Error deleting vehicle:", err);
        res.status(500).json({ message: `Erreur lors de la suppression: ${err.message}` });
    }
});

app.listen(8080, () => {
    console.log("Server running on port 8080...");
});