import db from "./database.js"
import Log from "../models/log.js"

/**
 * Service for handling waste management
 */
class WasteService {
  /**
   * Identify waste items
   * @returns {Object} - The waste items
   */
  identifyWasteItems() {
    const currentDate = db.getCurrentDate()
    const allItems = db.getAllItems()

    // Filter items that are waste (expired or out of uses)
    const wasteItems = allItems.filter((item) => item.isWaste(currentDate))

    // Format the response
    const formattedWasteItems = wasteItems.map((item) => {
      const container = db.getContainer(item.containerId)

      return {
        itemId: item.itemId,
        name: item.name,
        reason: item.getWasteReason(currentDate),
        containerId: item.containerId,
        position: item.position,
      }
    })

    return {
      success: true,
      wasteItems: formattedWasteItems,
    }
  }

  /**
   * Generate a return plan for waste items
   * @param {string} undockingContainerId - The ID of the undocking container
   * @param {string} undockingDate - The date of undocking
   * @param {number} maxWeight - The maximum weight allowed
   * @returns {Object} - The return plan
   */
  generateReturnPlan(undockingContainerId, undockingDate, maxWeight) {
    const undockingContainer = db.getContainer(undockingContainerId)

    // If container not found, return error
    if (!undockingContainer) {
      return {
        success: false,
      }
    }

    // Get waste items
    const wasteItems = this.identifyWasteItems().wasteItems

    // Sort waste items by priority (lowest first)
    const sortedWasteItems = wasteItems.sort((a, b) => {
      const itemA = db.getItem(a.itemId)
      const itemB = db.getItem(b.itemId)
      return itemA.priority - itemB.priority
    })

    // Generate return plan
    const returnPlan = []
    const retrievalSteps = []
    const returnItems = []
    let totalWeight = 0
    let totalVolume = 0
    let step = 1

    for (const wasteItem of sortedWasteItems) {
      const item = db.getItem(wasteItem.itemId)

      // Check if adding this item would exceed the max weight
      if (totalWeight + item.mass > maxWeight) {
        continue
      }

      // Get the container the item is in
      const container = db.getContainer(item.containerId)
      if (!container) continue

      // Calculate retrieval steps for this item
      const itemRetrievalSteps = this.calculateRetrievalSteps(item.itemId, container)

      // Add to return plan
      returnPlan.push({
        step: step++,
        itemId: item.itemId,
        itemName: item.name,
        fromContainer: container.containerId,
        toContainer: undockingContainerId,
      })

      // Add retrieval steps
      retrievalSteps.push(...itemRetrievalSteps)

      // Add to return items
      returnItems.push({
        itemId: item.itemId,
        name: item.name,
        reason: wasteItem.reason,
      })

      // Update totals
      totalWeight += item.mass
      totalVolume += item.getVolume()
    }

    return {
      success: true,
      returnPlan,
      retrievalSteps,
      returnManifest: {
        undockingContainerId,
        undockingDate,
        returnItems,
        totalVolume,
        totalWeight,
      },
    }
  }

  /**
   * Calculate retrieval steps for an item
   * @param {string} itemId - The ID of the item
   * @param {Object} container - The container the item is in
   * @returns {Array} - The retrieval steps
   */
  calculateRetrievalSteps(itemId, container) {
    const steps = []
    let stepNumber = 1

    // Get the items that need to be moved
    const itemsToMove = container.getItemsToMove(itemId)

    // If no items need to be moved, the item is directly accessible
    if (itemsToMove.length === 0) {
      steps.push({
        step: stepNumber++,
        action: "retrieve",
        itemId: itemId,
        itemName: db.getItem(itemId).name,
      })
      return steps
    }

    // Add steps to remove blocking items
    for (const item of itemsToMove) {
      steps.push({
        step: stepNumber++,
        action: "remove",
        itemId: item.itemId,
        itemName: item.name,
      })

      steps.push({
        step: stepNumber++,
        action: "setAside",
        itemId: item.itemId,
        itemName: item.name,
      })
    }

    // Add step to retrieve the target item
    steps.push({
      step: stepNumber++,
      action: "retrieve",
      itemId: itemId,
      itemName: db.getItem(itemId).name,
    })

    // Add steps to place back the blocking items
    for (let i = itemsToMove.length - 1; i >= 0; i--) {
      const item = itemsToMove[i]
      steps.push({
        step: stepNumber++,
        action: "placeBack",
        itemId: item.itemId,
        itemName: item.name,
      })
    }

    return steps
  }

  /**
   * Complete undocking
   * @param {string} undockingContainerId - The ID of the undocking container
   * @param {string} timestamp - The timestamp of undocking
   * @returns {Object} - The result of undocking
   */
  completeUndocking(undockingContainerId, timestamp) {
    const undockingContainer = db.getContainer(undockingContainerId)

    // If container not found, return error
    if (!undockingContainer) {
      return {
        success: false,
      }
    }

    // Get all items in the undocking container
    const itemsInContainer = undockingContainer.items

    // Remove all items from the container
    let itemsRemoved = 0
    for (const item of itemsInContainer) {
      // Remove the item from the database
      db.removeItem(item.itemId)

      // Log the disposal
      const log = Log.createDisposalLog("system", item.itemId, undockingContainerId, "Undocking")
      if (timestamp) {
        log.timestamp = new Date(timestamp)
      }
      db.addLog(log)

      itemsRemoved++
    }

    // Clear the container
    undockingContainer.items = []
    db.updateContainer(undockingContainer)

    return {
      success: true,
      itemsRemoved,
    }
  }
}

export default new WasteService()

