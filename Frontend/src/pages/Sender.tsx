"use client"

import { useEffect, useState, useRef } from "react"
import { Camera, Mic, MicOff, Video, VideoOff, Wifi, WifiOff, X, Settings } from "lucide-react"

function Sender() {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("disconnected") // disconnected, connecting, connected
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  useEffect(() => {
    const ws = new WebSocket("ws://ec2-18-234-134-82.compute-1.amazonaws.com:8080")

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "sender" }))
      setSocket(ws)
      setConnectionStatus("connected")
    }

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error)
      setErrorMessage("Failed to connect to server")
      setConnectionStatus("disconnected")
    }

    ws.onclose = () => {
      setConnectionStatus("disconnected")
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }

      ws.close()
    }
  }, [])

  async function startSendVideo() {
    if (!socket) return

    setIsConnecting(true)
    setErrorMessage(null)

    try {
      const pc = new RTCPeerConnection()
      peerConnectionRef.current = pc

      pc.onnegotiationneeded = async () => {
        console.log("Negotiation Needed!!")
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.send(JSON.stringify({ type: "createOffer", sdp: pc.localDescription }))
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }))
        }
      }

      socket.onmessage = async (event) => {
        const message = JSON.parse(event.data)

        if (message.type === "createAnswer") {
          console.log("Received Answer:", message.sdp)
          await pc.setRemoteDescription(message.sdp)
          setIsConnecting(false)
          setIsStreaming(true)
        } else if (message.type === "iceCandidate") {
          await pc.addIceCandidate(message.candidate)
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      console.log("Track added and sending!")
    } catch (error) {
      console.error("Error starting video:", error)
      setErrorMessage("Failed to access camera or microphone")
      setIsConnecting(false)
    }
  }

  function stopStreaming() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
  }

  function toggleVideo() {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled
        setVideoEnabled(!videoEnabled)
      }
    }
  }

  function toggleAudio() {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled
        setAudioEnabled(!audioEnabled)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-black/30 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-black/40 p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-indigo-600 rounded-full p-1.5 sm:p-2 mr-2 sm:mr-3">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Broadcast Studio</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center ${connectionStatus === "connected" ? "text-green-400" : "text-red-400"}`}
            >
              {connectionStatus === "connected" ? (
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              ) : (
                <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              )}
              <span className="text-xs sm:text-sm">
                {connectionStatus === "connected" ? "Connected" : "Disconnected"}
              </span>
            </div>
            <button className="text-white hover:text-indigo-300 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative aspect-video bg-black/60 w-full">
          {errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-red-900/20">
              <div className="bg-red-900/80 p-3 sm:p-4 rounded-lg flex items-center">
                <X className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">{errorMessage}</span>
              </div>
            </div>
          )}

          {!isStreaming && !isConnecting && !errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Camera className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 opacity-50" />
              <p className="text-lg sm:text-xl font-medium mb-4 sm:mb-6">Start broadcasting to begin</p>
              <button
                onClick={startSendVideo}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Start Broadcasting
              </button>
            </div>
          )}

          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4"></div>
              <p className="text-lg sm:text-xl font-medium">Connecting to receiver...</p>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!isStreaming ? "hidden" : ""}`}
          />

          {/* Video Controls */}
          {isStreaming && (
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={toggleVideo}
                  className={`p-2 sm:p-3 rounded-full ${videoEnabled ? "bg-indigo-600 hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"} transition-colors`}
                >
                  {videoEnabled ? (
                    <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`p-2 sm:p-3 rounded-full ${audioEnabled ? "bg-indigo-600 hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"} transition-colors`}
                >
                  {audioEnabled ? (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={stopStreaming}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  End Broadcast
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="p-4 sm:p-6 text-white">
          <h2 className="text-base sm:text-lg font-semibold mb-2">Broadcast Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-white/70 mb-1">Status</p>
              <p className="text-sm sm:text-base font-medium">
                {isStreaming ? "Live" : isConnecting ? "Connecting" : "Ready to broadcast"}
              </p>
            </div>
            <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-white/70 mb-1">Server</p>
              <p className="text-sm sm:text-base font-medium truncate">
                ec2-18-234-134-82.compute-1.amazonaws.com:8080
              </p>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 bg-indigo-900/30 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm">
              Your stream is secure and encrypted using WebRTC peer-to-peer technology. No data is stored on our
              servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sender

