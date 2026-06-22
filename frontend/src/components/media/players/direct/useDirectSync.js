import { useRef } from "react";
import { useRoomSocket } from "../../../../hooks/useRoomSocket.js";

export const useDirectSync = (socket, roomId) => {
    const videoRef = useRef(null);

    const ignoredEvents = useRef({
        play: false,
        pause: false,
        seek: false
    });

    const onVideoCommand = (data) => {
        if (data.mediaType !== "direct") return;

        const video = videoRef.current;
        if (!video) return;

        const timeDifference = Math.abs(
            video.currentTime - data.currentTime
        );

        if (data.action === "seek" && timeDifference > 0.5) {
            ignoredEvents.current.seek = true;
            video.currentTime = data.currentTime;
        }
        else if (timeDifference > 2) {
            ignoredEvents.current.seek = true;
            video.currentTime = data.currentTime;
        }

        if (data.action === "play" && video.paused) {
            ignoredEvents.current.play = true;

            video.play().catch(() => {
                ignoredEvents.current.play = false;
            });
        }

        if (data.action === "pause" && !video.paused) {
            ignoredEvents.current.pause = true;
            video.pause();
        }

    };

    const { broadcastCommand } = useRoomSocket(
        socket,
        roomId,
        onVideoCommand
    );

    const handlePlay = () => {
        if (ignoredEvents.current.play) {
            ignoredEvents.current.play = false;
            return;
        }

        broadcastCommand({
            mediaType: "direct",
            action: "play",
            currentTime: videoRef.current.currentTime
        });
    };

    const handlePause = () => {
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

    const handleSeeked = () => {
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

    return {
        videoRef,
        handlePlay,
        handlePause,
        handleSeeked
    };
};
