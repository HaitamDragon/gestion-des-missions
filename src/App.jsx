import Navbar from "./navbar.jsx";
import Menu from "./menu.jsx";
import Contents from "./contents.jsx";
import { useState, useEffect } from "react";
import { StateManager } from "./stateManager";
import './App.css';

export default function App() {
    const [currentContent, setCurrentContent] = useState(null);
    const [activeButton, setActiveButton] = useState("Mission");

    const handleContentChange = (contentComponent) => {
        setCurrentContent(contentComponent);
    };

    const handleButtonClick = (buttonText) => {
        setActiveButton(buttonText);
    };

    useEffect(() => {
        const loadInitialContent = async () => {
            const initialContentsComponent = (
                <Contents
                    h1={"Nom"}
                    h2={"Prenom"}
                    h3={"Objet"}
                    h4={"Destination"}
                    h5={"Date aller"}
                    h6={"Date retour"}
                    h7={"Actions"}
                    data={[]}
                    type={"Mission"}
                    onDataChange={() => {
                        const missionButton = document.querySelector('.menu-button[data-text="Mission"]');
                        if (missionButton) {
                            missionButton.click();
                        } else {
                            console.warn("Mission button not found for initial data refresh.");
                            const tempContents = (
                                <Contents
                                    h1={"Nom"}
                                    h2={"Prenom"}
                                    h3={"Objet"}
                                    h4={"Destination"}
                                    h5={"Date aller"}
                                    h6={"Date retour"}
                                    h7={"Actions"}
                                    data={[]}
                                    type={"Mission"}
                                    onDataChange={() => {}}
                                />
                            );
                            handleContentChange(tempContents);
                        }
                    }}
                />
            );
            setCurrentContent(initialContentsComponent);
            setActiveButton("Mission");
        };

        loadInitialContent();
    }, []);

    return (
        <StateManager>
            <>
                <Navbar />

                {/* The main content area now contains both the Menu and the dynamic content */}
                <div className="main-content-area">
                    <Menu
                        onContentChange={handleContentChange}
                        onButtonClick={handleButtonClick}
                        activeButton={activeButton}
                    />
                    {currentContent}
                </div>
            </>
        </StateManager>
    );
}
