import { Link } from "react-router";

function CreateRoom()
{


    return(
    <>
        <button>
            <Link to="/home">Create a new Room</Link>
        </button>
    </>
    );
}

export default CreateRoom;