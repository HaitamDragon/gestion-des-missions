import { exportFunc } from "./contents";

export default function Modal(props)
{
    return (
    <div className="Background">
        <div className="Modal">
            {props.state == "ajout" && (
            <form>
                {
                    (() => {

                        let inputWithLabels = []
                        console.log(props.labels);

                        for(let i = 0; i < props.labels.length; i++)
                        {    
                            inputWithLabels.push(

                                <>
                                    <label key={i} htmlFor={props.labels[i].toLowerCase()}> {props.labels[i]} </label>
                                    <input key={i + 5} name={props.labels[i].toLowerCase()} type="text"></input>
                                </>
                            )
                        }

                        return inputWithLabels;
                    })()
                }

            </form>)}
            <div className="button-group">
                <button className="button-annuler" onClick={exportFunc}>Annuler</button>
                <button className="button-confirmer">Confirmer</button>
            </div>
        </div>
    </div>
    )
}