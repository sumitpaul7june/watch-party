import { useState } from "react";
import { extractYouTubeVideoId } from "../../utils/youtube";

const MediaSelector = ({onMediaSelect}) => {

    const [mediaType, setMediaType] = useState("youtube");
    const [url, setUrl] = useState("");

    const handleSubmit = () => {
        if(!url.trim()) return;

        if(mediaType === "youtube")
        {
            const videoId = extractYouTubeVideoId(url);

            if(!videoId)
            {
                alert("Please enter a valid Youtube URL");
                return;
            }

            onMediaSelect({
                type: "youtube",
                url,
                videoId
            });
        }

        if(mediaType === "direct")
        {
            onMediaSelect({
                type: "direct",
                url
            });
        }


    }
    return(
        <div>
            <div>
                <button onClick={() => setMediaType("youtube")} >Youtube</button>
            </div>
            <div>
               <button onClick={() => setMediaType("direct")}>Custom Video Link</button>
            </div>

            <input type="text"
                placeholder= {
                    mediaType === "youtube" ? "Enter Youtube link" : "Enter direct video link"
                }
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />

            <button onClick={handleSubmit}>Load Media</button>
        </div>
    );
}

export default MediaSelector;
