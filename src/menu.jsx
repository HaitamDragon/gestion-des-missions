import Button from "./button.jsx";

export default function Menu(props) {
    return (
        <div className="menu">
            <Button
                text={"Mission"}
                onContentChange={props.onContentChange}
                onButtonClick={props.onButtonClick}
                activeButton={props.activeButton}
            />
            <Button
                text={"Employés"}
                onContentChange={props.onContentChange}
                onButtonClick={props.onButtonClick}
                activeButton={props.activeButton}
            />
            <Button
                text={"Vehicule"}
                onContentChange={props.onContentChange}
                onButtonClick={props.onButtonClick}
                activeButton={props.activeButton}
            />
        </div>
    );
}