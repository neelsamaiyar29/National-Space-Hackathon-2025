import express from "express"
import retrievalService from "../services/retrieval-service.js"

const router = express.Router()

/**
 * Item Search API
 * GET /api/search
 */
router.get("/", async (req, res) => {
  try {
    const { itemId, itemName, userId } = req.query

    // Validate input
    if (!itemId && !itemName) {
      return res.status(400).json({
        success: false,
        message: "Either itemId or itemName must be provided",
      })
    }

    // Search for the item
    const result = retrievalService.searchItem(itemId, itemName, userId)

    res.json(result)
  } catch (error) {
    console.error("Error in search API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/**
 * Item Retrieval API
 * POST /api/retrieve
 */
router.post("/retrieve", async (req, res) => {
  try {
    const { itemId, userId, timestamp } = req.body

    // Validate input
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "itemId must be provided",
      })
    }

    // Retrieve the item
    const result = retrievalService.retrieveItem(itemId, userId, timestamp)

    res.json(result)
  } catch (error) {
    console.error("Error in retrieve API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

/**
 * Item Placement API
 * POST /api/place
 */
router.post("/place", async (req, res) => {
  try {
    const { itemId, userId, timestamp, containerId, position } = req.body

    // Validate input
    if (!itemId || !containerId || !position) {
      return res.status(400).json({
        success: false,
        message: "itemId, containerId, and position must be provided",
      })
    }

    // Place the item
    const result = retrievalService.placeItem(itemId, userId, timestamp, containerId, position)

    res.json(result)
  } catch (error) {
    console.error("Error in place API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

export default router

