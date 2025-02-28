import { useEffect, useRef } from "react";

function Receiver() {
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket Connected: Receiver");
            socket.send(JSON.stringify({ type: "receiver" }));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "createOffer") {
                console.log("Received offer, setting up peer connection...");

                const pc = new RTCPeerConnection();
                pcRef.current = pc;

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log("Sending ICE candidate from receiver.");
                        socket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }));
                    }
                };

                const stream = new MediaStream();
                pc.ontrack = (event) => {
                    console.log("Receiving track!", event);
                    stream.addTrack(event.track);
                
                    // Handle video
                    let videoElement = document.getElementById("remoteVideo") as HTMLVideoElement;
                    if (!videoElement) {
                        videoElement = document.createElement("video");
                        videoElement.id = "remoteVideo";
                        videoElement.autoplay = true;
                        videoElement.controls = true;
                        document.body.appendChild(videoElement);
                    }
                    videoElement.srcObject = stream;
                
                    // Handle audio
                    let audioElement = document.getElementById("remoteAudio") as HTMLAudioElement;
                    if (!audioElement) {
                        audioElement = document.createElement("audio");
                        audioElement.id = "remoteAudio";
                        audioElement.autoplay = true;
                        document.body.appendChild(audioElement);
                    }
                    audioElement.srcObject = stream;
                };

                await pc.setRemoteDescription(message.sdp);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.send(JSON.stringify({ type: "createAnswer", sdp: pc.localDescription }));
            } 

            else if (message.type === "iceCandidate") {
                console.log("Received ICE candidate on receiver side.");
                if (pcRef.current) {
                    await pcRef.current.addIceCandidate(message.candidate   );
                }
            }
        };

        return () => {
            socket.close();
            if (pcRef.current) {
                pcRef.current.close();
            }
        };
    }, []);

    return <div>I'm Receiver!</div>;
}

export default Receiver;
