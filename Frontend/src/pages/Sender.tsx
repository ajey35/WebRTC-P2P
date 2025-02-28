import { useEffect, useState } from "react";

function Sender() {
    const [socket, SetSocket] = useState<WebSocket | null>(null);
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "sender" }));
            SetSocket(ws);
        };

        ws.onerror = (error) => console.error("WebSocket Error:", error);

        return () => {
            ws.close();
        };
    }, []);

    async function StartSendVideo() {
        if (!socket) return;

        const pc = new RTCPeerConnection();

        pc.onnegotiationneeded = async () => {
            console.log("Negotiation Needed!!");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: "createOffer", sdp: pc.localDescription }));
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }));
            }
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "createAnswer") {
                console.log("Received Answer:", message.sdp);
                await pc.setRemoteDescription(message.sdp);
            } 
            else if (message.type === "iceCandidate") {
                await pc.addIceCandidate(message.candidate);
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        pc.addTrack(stream.getVideoTracks()[0], stream);
        pc.addTrack(stream.getAudioTracks()[0], stream);
        
        const video = document.createElement("video");
        document.body.appendChild(video);
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true; // Avoid local echo
        video.play();
        console.log("Track added and sending!");
        
    }

    return (
        <div>
            <button onClick={StartSendVideo}>Send Video</button>
        </div>
    );
}

export default Sender;
