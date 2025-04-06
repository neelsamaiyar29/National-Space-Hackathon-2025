import express from "express"
import cors from "cors"
import multer from "multer"
import placementRoutes from "./routes/placement.js"
import searchRoutes from "./routes/search.js"
import wasteRoutes from "./routes/waste.js"
import simulateRoutes from "./routes/simulate.js"
import importExportRoutes from "./routes/importExport.js"
import logsRoutes from "./routes/logs.js"

// Initialize Express app
const app = express()
const port = 8000

// Middleware
app.use(cors())
app.use(express.json())

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" })

// Routes
app.use("/api/placement", placementRoutes)
app.use("/api/search", searchRoutes)
app.use("/api/waste", wasteRoutes)
app.use("/api/simulate", simulateRoutes)
app.use("/api/import", importExportRoutes)
app.use("/api/export", importExportRoutes)
app.use("/api/logs", logsRoutes)

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`)
})

export default app

