import db from "./database.js"

/**
 * Service for handling time simulation
 */
class SimulationService {
  /**
   * Simulate days passing
   * @param {number} numOfDays - The number of days to simulate
   * @param {string} toTimestamp - The timestamp to simulate to
   * @param {Array} itemsToBeUsedPerDay - The items to be used each day
   * @returns {Object} - The result of the simulation
   */
  simulateDays(numOfDays, toTimestamp, itemsToBeUsedPerDay) {
    const currentDate = db.getCurrentDate()
    let targetDate

    // Determine target date
    if (numOfDays) {
      targetDate = new Date(currentDate)
      targetDate.setDate(targetDate.getDate() + numOfDays)
    } else if (toTimestamp) {
      targetDate = new Date(toTimestamp)
    } else {
      // Default to one day if neither is provided
      targetDate = new Date(currentDate)
      targetDate.setDate(targetDate.getDate() + 1)
    }

    // Ensure target date is in the future
    if (targetDate <= currentDate) {
      return {
        success: false,
        message: "Target date must be in the future",
      }
    }

    // Calculate number of days to simulate
    const daysDiff = Math.floor((targetDate - currentDate) / (1000 * 60 * 60 * 24))

    // Track changes
    const changes = {
      itemsUsed: [],
      itemsExpired: [],
      itemsDepletedToday: [],
    }

    // Simulate each day
    for (let i = 0; i < daysDiff; i++) {
      // Advance the date by one day
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 1)
      db.setCurrentDate(newDate)

      // Use items for this day
      if (itemsToBeUsedPerDay && itemsToBeUsedPerDay.length > 0) {
        for (const itemToUse of itemsToBeUsedPerDay) {
          let item

          // Find the item by ID or name
          if (itemToUse.itemId) {
            item = db.getItem(itemToUse.itemId)
          } else if (itemToUse.name) {
            item = db.getItemByName(itemToUse.name)
          }

          // If item found, use it
          if (item) {
            const remainingUses = item.use()

            // Add to used items
            changes.itemsUsed.push({
              itemId: item.itemId,
              name: item.name,
              remainingUses,
            })

            // If depleted today, add to depleted items
            if (remainingUses === 0) {
              changes.itemsDepletedToday.push({
                itemId: item.itemId,
                name: item.name,
              })
            }

            // Update the item in the database
            db.updateItem(item)
          }
        }
      }

      // Check for newly expired items
      const allItems = db.getAllItems()
      for (const item of allItems) {
        // If the item expires today, add to expired items
        if (item.expiryDate && item.expiryDate.toDateString() === newDate.toDateString()) {
          changes.itemsExpired.push({
            itemId: item.itemId,
            name: item.name,
          })
        }
      }
    }

    return {
      success: true,
      newDate: db.getCurrentDate().toISOString(),
      changes,
    }
  }
}

export default new SimulationService()

