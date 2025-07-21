export default function Contents(props)
{
    return (
        <>
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
                        
                        let rows = [];
                        let rowKeys = Object.keys(props.data)
                        console.log(rowKeys);

                        for(let i = 0; i < rowKeys.length; i++)
                        {
                            let columnVals = [];
                            let currentRow = Object.values(props.data[rowKeys[i]])
                            console.log(currentRow);

                            for(let j = 0; j < currentRow.length; j++)
                            {
                                columnVals.push(<td key={j}>{currentRow[j]}</td>)
                            }

                            console.log(columnVals);

                            rows.push(<tr key={i}>{columnVals}</tr>);
                        }

                        return rows;
                })()}

             </tbody>

            </table>
        </>
    )
}