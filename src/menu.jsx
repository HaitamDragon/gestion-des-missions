import Button from "./button.jsx";

export default function Menu(props)
{
    return (
        <div className="menu">
            <Button text={"Mission"} onContentChange={props.onContentChange}/>
            <Button text={"Employés"} onContentChange={props.onContentChange}/>
            <Button text={"Chauffeur"} onContentChange={props.onContentChange}/>
            <Button text={"Vehicule"} onContentChange={props.onContentChange}/>
        </div>
    )
}