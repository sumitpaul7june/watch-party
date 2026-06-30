import { useState } from "react";
import { extractYouTubeVideoId } from "../../utils/youtube";
import "./MediaSelector.css";

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
        <div className="media-selector-container">
            <div className="media-type-toggles">
                <button 
                    className={`toggle-btn ${mediaType === "youtube" ? "active" : ""}`}
                    onClick={() => setMediaType("youtube")} 
                >
                    YouTube
                </button>
                <button 
                    className={`toggle-btn ${mediaType === "direct" ? "active" : ""}`}
                    onClick={() => setMediaType("direct")}
                >
                    Direct Link
                </button>
            </div>

            <div className="media-input-wrapper">
                <input 
                    type="text"
                    placeholder={mediaType === "youtube" ? "Paste YouTube link here..." : "Paste direct video URL (.mp4, .webm)..."}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <button className="btn-load" onClick={handleSubmit}>Load Media</button>
            </div>
        </div>
    );
}

export default MediaSelector;
