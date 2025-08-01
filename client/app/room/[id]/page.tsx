'use client'

import Whiteboard from "@/components/WhiteBoard";
import { useParams } from "next/navigation";

const Room = () => {
  const {id} = useParams();
  return (
    <main className="h-screen w-screen overflow-hidden relative bg-white">
      {/* Room header - positioned absolutely to not affect whiteboard layout */}
      <div className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
        <h1 className="text-sm font-semibold text-gray-700">Room: {id}</h1>
      </div>
      
      {/* Full-screen whiteboard */}
      <Whiteboard className="w-full h-full" />
    </main>
  )
}

export default Room