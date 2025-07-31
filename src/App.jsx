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
        const loadInitialContent = () => {
            // Set Mission as active button and trigger Mission button click after component mounts
            setActiveButton("Mission");
            
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                const missionButton = document.querySelector('.menu-button');
                if (missionButton && missionButton.textContent === "Mission") {
                    missionButton.click();
                }
            }, 100);
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
