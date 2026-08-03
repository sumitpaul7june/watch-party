import { useRef } from "react";
import { useRoomSocket } from "../../../../hooks/useRoomSocket.js";

/**
 * useDirectSync Hook
 * 
 * Manages the synchronization logic for native HTML5 video elements (like direct .mp4 links).
 * Similar to the YouTube sync hook, it prevents infinite echo loops when the server
 * programmatically controls the video player.
 */
export const useDirectSync = (socket, roomId) => {

    // Accesses the native HTML `<video>` element directly to control playback and time
    const videoRef = useRef(null);

    // Acts as a multi-layered "shield" to prevent infinite loops. 
    // Since HTML5 videos emit separate events for play, pause, and seek, 
    // we need to track expected states for each action independently.
    const ignoredEvents = useRef({
        play: false,
        pause: false,
        seek: false
    });

    // Receiver: Handles incoming playback commands broadcasted by the server
    const onVideoCommand = (data) => {
        // Ignore commands meant for different media players (like YouTube)
        if (data.mediaType !== "direct") return;

        const video = videoRef.current;
        if (!video) return;

        const timeDifference = Math.abs(video.currentTime - data.currentTime);

        // If a remote user explicitly seeked, or if the local video naturally drifted 
        // out of sync by more than 2 seconds, force the local video time to match.
        if ((data.action === "seek" && timeDifference > 0.5) || timeDifference > 2) {
            // Raise the seek shield
            ignoredEvents.current.seek = true;
            video.currentTime = data.currentTime;
        }

        // Apply incoming play command
        if (data.action === "play" && video.paused) {
            // Raise the play shield
            ignoredEvents.current.play = true;

            // HTML5 play() returns a promise. If the browser blocks autoplay, 
            // the promise rejects, and we must drop the shield to prevent it from getting stuck.
            video.play().catch(() => {
                ignoredEvents.current.play = false;
            });
        }

        // Apply incoming pause command
        if (data.action === "pause" && !video.paused) {
            // Raise the pause shield
            ignoredEvents.current.pause = true;
            video.pause();
        }
    };

    // Helper hook to set up the socket listener and expose the broadcast function
    const { broadcastCommand } = useRoomSocket(
        socket,
        roomId,
        onVideoCommand
    );

    // Sender: Triggers when the local video naturally plays or a user clicks play
    const handlePlay = () => {
        // If the server forced this play event (shield is up), ignore it and drop the shield
        if (ignoredEvents.current.play) {
            ignoredEvents.current.play = false;
            return;
        }

        // Otherwise, it was a human interaction, so broadcast it to the room
        broadcastCommand({
            mediaType: "direct",
            action: "play",
            currentTime: videoRef.current.currentTime
        });
    };

    // Sender: Triggers when the local video pauses
    const handlePause = () => {
        // If the server forced this pause event (shield is up), ignore it and drop the shield
        if (ignoredEvents.current.pause) {
            ignoredEvents.current.pause = false;
            return;
        }

        broadcastCommand({
            mediaType: "direct",
            action: "pause",
            currentTime: videoRef.current.currentTime
        });
    };

    // Sender: Triggers when the user scrubs/clicks on the video timeline
    const handleSeeked = () => {
        // If the server forced this seek event (shield is up), ignore it and drop the shield
        if (ignoredEvents.current.seek) {
            ignoredEvents.current.seek = false;
            return;
        }

        broadcastCommand({
            mediaType: "direct",
            action: "seek",
            currentTime: videoRef.current.currentTime
        });
    };

    // Expose the necessary refs and handlers to attach to the `<video>` element
    return {
        videoRef,
        handlePlay,
        handlePause,
        handleSeeked
    };
};
