import express from "express"
import multer from "multer"
import importExportService from "../services/import-export-service.js"

const router = express.Router()
const upload = multer({ dest: "uploads/" })

/**
 * Import Items API
 * POST /api/import/items
 */
router.post("/items", upload.single("file"), async (req, res) => {
  try {
    // Validate input
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    // Import items
    const result = importExportService.importItems(req.file)

    res.json(result)
  } catch (error) {
    console.error("Error in import items API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/**
 * Import Containers API
 * POST /api/import/containers
 */
router.post("/containers", upload.single("file"), async (req, res) => {
  try {
    // Validate input
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    // Import containers
    const result = importExportService.importContainers(req.file)

    res.json(result)
  } catch (error) {
    console.error("Error in import containers API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/**
 * Export Arrangement API
 * GET /api/export/arrangement
 */
router.get("/arrangement", async (req, res) => {
  try {
    // Export arrangement
    const csv = importExportService.exportArrangement()

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=arrangement.csv")

    // Send the CSV
    res.send(csv)
  } catch (error) {
    console.error("Error in export arrangement API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

export default router

