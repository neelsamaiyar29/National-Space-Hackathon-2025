import express from "express"
import simulationService from "../services/simulation-service.js"

const router = express.Router()

/**
 * Time Simulation API
 * POST /api/simulate/day
 */
router.post("/day", async (req, res) => {
  try {
    const { numOfDays, toTimestamp, itemsToBeUsedPerDay } = req.body

    // Validate input
    if (!numOfDays && !toTimestamp) {
      return res.status(400).json({
        success: false,
        message: "Either numOfDays or toTimestamp must be provided",
      })
    }

    // Simulate days
    const result = simulationService.simulateDays(numOfDays, toTimestamp, itemsToBeUsedPerDay)

    res.json(result)
  } catch (error) {
    console.error("Error in simulate day API:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

export default router

