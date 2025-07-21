import Navbar from "./navbar.jsx";
import Menu from "./menu.jsx";
import StateManager from "./stateManager.jsx";
import Contents from "./contents.jsx";
import { useState } from "react";
import './App.css';

export default function App() {

  const defContent = <Contents h1={"Objet"} h2={"Destination"} h3={"Date aller"} h4={"Date retour"} data={{  }} />;
  const [currentContent, setCurrentContent] = useState(defContent);

  const handleContentChange = (contentComponent) => {
    setCurrentContent(contentComponent);
  };

  return (
    <>
       <Navbar/>
       <Menu onContentChange={handleContentChange}/>
       <StateManager currentState={currentContent} />
    </>
  );
  
}