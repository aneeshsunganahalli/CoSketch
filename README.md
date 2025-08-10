# CoSketch

**CoSketch** is a real-time collaborative whiteboard and code editor platform — think Google Docs meets VS Code.  
It’s built for **brainstorming, teaching, interviewing, and remote teamwork** — letting you draw, sketch, and code together in one seamless experience.

---

## 🌟 Why CoSketch?

In a world of remote work and online learning, collaboration tools are essential.  
Most tools either focus on **visual brainstorming** (whiteboards) or **code collaboration** — but rarely both in one platform.  
CoSketch combines them, so your team can:

- **Visualize ideas** with a shared whiteboard  
- **Write & review code** together in real time  
- **Chat & coordinate** without switching apps  

---

## ✨ Key Features

- 🖌 **Real-time Whiteboard**  
  Draw shapes, lines, or freehand sketches, and watch them instantly appear on everyone’s screen.

- 💻 **Collaborative Code Editing**  
  Live code editing with syntax highlighting for multiple languages.  
  (Powered by Monaco Editor or CodeMirror with CRDT-based sync)

- ⚡ **Instant Sync**  
  CRDTs (via Yjs) and WebSockets ensure every keystroke, drawing, and message is synchronized.

- 👥 **Multi-User Rooms**  
  Share a unique link and collaborate instantly — no setup needed.

- 🔒 **Identity & Roles**  
  Optional authentication for persistent identities and role-based permissions.

---

## 🖼 How It Works

1. **Create or Join a Room**  
   Every session has a unique room ID, which participants can join via a link.

2. **Draw & Code in Real Time**  
   Whiteboard actions and code edits are transmitted instantly via WebSockets and Yjs.

3. **Seamless State Sharing**  
   Whether someone joins at the start or mid-session, they see the **exact** current state.

4. **Persistent Data** *(optional)*  
   Save session history, whiteboard drawings, and code snippets to MongoDB for future reference.

---

## 🛠 Tech Behind the Scenes

- **Frontend:** Next.js + React + TailwindCSS  
- **Whiteboard Sync:** Socket.IO events for fast visual updates  
- **Code Collaboration:** Yjs CRDT + Monaco Editor / CodeMirror  
- **Backend:** Node.js + Express (API & WebSocket server)  
- **Database:** MongoDB for persistent room data and authentication  

---

## 📌 Example Use Cases

- **Remote Team Brainstorming** — Draw system diagrams while coding API endpoints.  
- **Technical Interviews** — Share a live coding environment with problem statements.  
- **Online Classes** — Teachers explain concepts visually and with code examples.  
- **Hackathons** — Quickly prototype and share ideas with teammates in real-time.  

---

## 🔮 Roadmap

- [ ] Voice & Video chat integration  
- [ ] Export whiteboard as image/PDF  
- [ ] Collaborative text documents  
- [ ] Role-based permissions (Viewer / Editor)  
- [ ] Replay mode for past sessions  

---
