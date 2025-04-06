import express from "express"
import db from "../services/database.js"

const router = express.Router()

/**
 * Logs API
 * GET /api/logs
 */
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, itemId, userId, actionType } = req.query

    // Get logs with filters
    const logs = db.getLogs({
      startDate,
      endDate,
      itemId,
      userId,
      actionType,
    })

    res.json({ logs })
  } catch (error) {
    console.error("Error in logs API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

export default router

