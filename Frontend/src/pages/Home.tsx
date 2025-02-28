import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Users, ArrowRight, Video } from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex flex-col items-center justify-center overflow-hidden">
      {/* Floating Decorations */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-32 h-32 sm:w-64 sm:h-64 rounded-xl border-2 border-white animate-pulse"></div>
        <div className="absolute top-[40%] right-[10%] w-36 h-36 sm:w-72 sm:h-72 rounded-xl border-2 border-white animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[30%] w-28 h-28 sm:w-60 sm:h-60 rounded-xl border-2 border-white animate-pulse"></div>
      </div>

      {/* Content Box - Centered */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-[90%] sm:w-[80%] md:w-[60%] lg:w-[50%] xl:w-[40%] p-6 sm:p-12 flex flex-col items-center text-center">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white/20 p-4 rounded-full animate-bounce">
            <Video className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3">StreamConnect</h1>
          <p className="text-indigo-200 text-sm sm:text-lg mt-2">Seamless WebRTC video streaming</p>
        </div>

        {/* Description */}
        <div className="bg-white/10 backdrop-blur-lg p-3 sm:p-4 rounded-lg text-white text-sm sm:text-lg mb-6 shadow-md max-w-md">
          Experience high-quality, real-time video streaming with minimal latency using WebRTC technology.
        </div>

        {/* Buttons */}
        <div className="space-y-4 w-full">
          <button
            onClick={() => navigate("/sender")}
            onMouseEnter={() => setHoveredButton("start")}
            onMouseLeave={() => setHoveredButton(null)}
            className="group w-full flex items-center justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl px-6 py-4 sm:py-5 transition-all duration-300 shadow-lg hover:shadow-indigo-500/40"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-full p-2 sm:p-3 mr-3 sm:mr-4">
                <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-semibold">Start Streaming</span>
            </div>
            <ArrowRight
              className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 ${hoveredButton === "start" ? "translate-x-1" : ""}`}
            />
          </button>

          <button
            onClick={() => navigate("/receiver")}
            onMouseEnter={() => setHoveredButton("receive")}
            onMouseLeave={() => setHoveredButton(null)}
            className="group w-full flex items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl px-6 py-4 sm:py-5 transition-all duration-300 shadow-lg hover:shadow-purple-500/40"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-full p-2 sm:p-3 mr-3 sm:mr-4">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-semibold">Join Stream</span>
            </div>
            <ArrowRight
              className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 ${hoveredButton === "receive" ? "translate-x-1" : ""}`}
            />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-indigo-200 text-sm sm:text-lg">
          Secure & Encrypted Peer-to-Peer Connection
        </div>
      </div>
    </div>
  );
}

export default Home;
