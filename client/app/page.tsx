'use client';

import { useState } from "react";
import AuthNav from "@/components/auth/AuthNav";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const { user, loading } = useAuth();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    window.location.href = `/room/${newRoomId}`;
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      window.location.href = `/room/${roomId.trim()}`;
    }
  };

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      title: "Real-time Synchronization",
      description: "WebSocket-powered collaboration with conflict-free replicated data types (CRDTs) for seamless multi-user editing."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      title: "Vector Canvas Engine",
      description: "High-performance HTML5 Canvas with infinite zoom, layer management, and optimized rendering pipeline."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: "Developer Experience",
      description: "Built with TypeScript, Next.js, and Socket.io. Clean APIs, comprehensive docs, and extensible architecture."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Enterprise Ready",
      description: "Self-hostable, secure room management, session persistence, and scalable infrastructure for teams."
    }
  ];

  const useCases = [
    { 
      title: "System Architecture Design", 
      description: "Diagram microservices, map data flows, and design distributed systems with your team in real-time",
      tech: "Microservices • APIs • Database Design"
    },
    { 
      title: "Code Review & Planning", 
      description: "Sketch out algorithms, plan refactoring sessions, and visualize complex logic before implementation",
      tech: "Algorithms • Refactoring • Code Flow"
    },
    { 
      title: "Technical Documentation", 
      description: "Create interactive diagrams, flowcharts, and technical specs that evolve with your codebase",
      tech: "Documentation • Flowcharts • Specs"
    },
    { 
      title: "Sprint Planning & Retrospectives", 
      description: "Visualize user stories, map dependencies, and conduct agile ceremonies with distributed teams",
      tech: "Agile • User Stories • Dependencies"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 font-mono">CoSketch</span>
            </div>
            <div className="flex items-center space-x-4">
              <AuthNav user={user} />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">

            {/* Main Headline */}
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Collaborative whiteboard for
              <br />
              <span className="text-blue-600">
                development teams
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Real-time visual collaboration platform designed for developers. Think <strong>VS Code Live Share</strong> meets 
              <strong> Figma</strong> — with the performance and UX you'd expect from modern dev tools.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={createRoom}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 text-base"
              >
                Create Room
              </button>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="px-4 py-3 text-black border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-center font-mono text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                />
                <button
                  onClick={joinRoom}
                  disabled={!roomId.trim()}
                  className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="text-center text-gray-500 mb-6">
              <p className="text-sm font-mono">Built with TypeScript • Next.js • Socket.io • HTML5 Canvas</p>
            </div>

            {/* Social Proof */}
            <div className="text-center text-gray-500">
              <p className="text-sm">Zero config • Self-hostable • Open source ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for developer workflows
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade features with the simplicity and performance developers expect
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 border border-gray-200">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for technical teams
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From system design to code reviews, streamline your development workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{useCase.title}</h4>
                    <p className="text-gray-600 leading-relaxed mb-3">{useCase.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {useCase.tech.split(' • ').map((tech, techIndex) => (
                        <span key={techIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to enhance your team's workflow?
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join development teams using CoSketch for system design, code reviews, and technical collaboration
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={createRoom}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
            >
              Start Collaborating
            </button>
            <div className="text-gray-400 text-sm">
              No installation required • Works in any modern browser
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 bg-gray-800 border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white font-mono">CoSketch</span>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p className="text-sm">© 2025 CoSketch. Built for developers, by developers.</p>
              <p className="text-xs mt-1">Open source • Self-hostable • Developer-first</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
