"use client"

import { useEffect, useRef, useState } from "react"
import { Loader, Maximize, Minimize, Volume2, VolumeX, Wifi, WifiOff, Settings } from "lucide-react"

function Receiver() {
  const [connectionStatus, setConnectionStatus] = useState("disconnected") // disconnected, connecting, connected
  const [isReceiving, setIsReceiving] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setConnectionStatus("connecting")

    const socket = new WebSocket("wss://mrajey.duckdns.org/ws/")
    socketRef.current = socket

    socket.onopen = () => {
      console.log("WebSocket Connected: Receiver")
      socket.send(JSON.stringify({ type: "receiver" }))
      setConnectionStatus("connected")
    }

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error)
      setErrorMessage("Failed to connect to server")
      setConnectionStatus("disconnected")
    }

    socket.onclose = () => {
      setConnectionStatus("disconnected")
      setIsReceiving(false)
    }

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data)

      if (message.type === "createOffer") {
        console.log("Received offer, setting up peer connection...")
        setIsReceiving(true)

        try {
          const pc = new RTCPeerConnection()
          pcRef.current = pc

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              console.log("Sending ICE candidate from receiver.")
              socket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }))
            }
          }

          const stream = new MediaStream()
          pc.ontrack = (event) => {
            console.log("Receiving track!", event)
            stream.addTrack(event.track)

            if (videoRef.current) {
              videoRef.current.srcObject = stream
            }
          }

          await pc.setRemoteDescription(message.sdp)

          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          socket.send(JSON.stringify({ type: "createAnswer", sdp: pc.localDescription }))
        } catch (error) {
          console.error("Error setting up peer connection:", error)
          setErrorMessage("Failed to establish connection")
          setIsReceiving(false)
        }
      } else if (message.type === "iceCandidate") {
        console.log("Received ICE candidate on receiver side.")
        if (pcRef.current) {
          await pcRef.current.addIceCandidate(message.candidate)
        }
      }
    }

    return () => {
      socket.close()
      if (pcRef.current) {
        pcRef.current.close()
      }
    }
  }, [])

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-black/30 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-black/40 p-3 sm:p-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-white">Live Stream</h1>

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

        {/* Video Container */}
        <div ref={containerRef} className="relative aspect-video bg-black w-full">
          {errorMessage && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-red-900/20">
              <div className="bg-red-900/80 p-3 sm:p-4 rounded-lg">
                <span className="text-sm sm:text-base">{errorMessage}</span>
              </div>
            </div>
          )}

          {!isReceiving && !errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Loader className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 animate-spin opacity-50" />
              <p className="text-lg sm:text-xl font-medium">Waiting for broadcaster to connect...</p>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-contain ${!isReceiving ? "hidden" : ""}`}
          />

          {/* Video Controls */}
          {isReceiving && (
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={toggleMute}
                  className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Stream Information</h2>
            {isReceiving && (
              <span className="px-2 sm:px-3 py-1 bg-red-600 rounded-full text-xs sm:text-sm font-medium">LIVE</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-white/70 mb-1">Status</p>
              <p className="text-sm sm:text-base font-medium">
                {isReceiving ? "Receiving Stream" : "Waiting for Broadcaster"}
              </p>
            </div>
            <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-white/70 mb-1">Server</p>
              <p className="text-sm sm:text-base font-medium truncate">
                ec2-18-234-134-82.compute-1.amazonaws.com:8080
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-base sm:text-lg font-medium">Thank You for Connecting!</p>
            <p className="text-xs sm:text-sm text-white/70 mt-2">
              This stream is secure and encrypted using WebRTC peer-to-peer technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Receiver

