import express from "express"
import placementService from "../services/placement-service.js"
import db from "../services/database.js"
import Item from "../models/item.js"
import Container from "../models/container.js"

const router = express.Router()

/**
 * Placement Recommendations API
 * POST /api/placement
 */
router.post("/", async (req, res) => {
  try {
    const { items, containers } = req.body

    // Validate input
    if (!items || !Array.isArray(items) || !containers || !Array.isArray(containers)) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: items and containers must be arrays",
      })
    }

    // Convert items to Item objects
    const itemObjects = items.map((item) => new Item(item))

    // Convert containers to Container objects
    const containerObjects = containers.map((container) => {
      // If the container already exists in the database, use that one
      const existingContainer = db.getContainer(container.containerId)
      if (existingContainer) {
        return existingContainer
      }

      // Otherwise, create a new container
      return new Container(container)
    })

    // Find optimal placement
    const result = placementService.findOptimalPlacement(itemObjects, containerObjects)

    // Update the database with the placements
    if (result.success) {
      // Add containers to the database
      containerObjects.forEach((container) => {
        db.addContainer(container)
      })

      // Add items to the database and update their positions
      result.placements.forEach((placement) => {
        const item = itemObjects.find((item) => item.itemId === placement.itemId)
        if (item) {
          item.containerId = placement.containerId
          item.position = placement.position
          db.addItem(item)
        }
      })
    }

    res.json(result)
  } catch (error) {
    console.error("Error in placement API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

export default router

