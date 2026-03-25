import { useState } from "react";

function HomePage()
{
    const [inputValue, setInputValue] = useState('');
    
    const handleChange = (e) => {
        setInputValue(e.target.value);
    }
    // Extract video ID from youtube url
    const videoId = inputValue.split("v=")[1];
    
    return(
        <div>
            <input type="text" placeholder="Paste the url link" value={inputValue} onChange={handleChange}/>
            <div>
                <iframe src= {`https://www.youtube.com/embed/${videoId}`} height="500px" width="800px" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                ></iframe>
            </div>
        </div>
    );
} 

export default HomePage;

