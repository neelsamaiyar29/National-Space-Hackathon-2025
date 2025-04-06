import db from "./database.js"
import Log from "../models/log.js"

/**
 * Service for handling item retrieval
 */
class RetrievalService {
  /**
   * Search for an item by ID or name
   * @param {string} itemId - The item ID to search for
   * @param {string} itemName - The item name to search for
   * @param {string} userId - The user performing the search
   * @returns {Object} - The search result
   */
  searchItem(itemId, itemName, userId) {
    let item

    // Search by ID or name
    if (itemId) {
      item = db.getItem(itemId)
    } else if (itemName) {
      item = db.getItemByName(itemName)
    }

    // If item not found, return not found
    if (!item) {
      return {
        success: true,
        found: false,
        item: null,
        retrievalSteps: [],
      }
    }

    // Get the container
    const container = db.getContainer(item.containerId)
    if (!container) {
      return {
        success: true,
        found: true,
        item: {
          itemId: item.itemId,
          name: item.name,
          containerId: null,
          zone: null,
          position: null,
        },
        retrievalSteps: [],
      }
    }

    // Calculate retrieval steps
    const retrievalSteps = this.calculateRetrievalSteps(item.itemId, container)

    return {
      success: true,
      found: true,
      item: {
        itemId: item.itemId,
        name: item.name,
        containerId: container.containerId,
        zone: container.zone,
        position: item.position,
      },
      retrievalSteps,
    }
  }

  /**
   * Calculate the steps needed to retrieve an item
   * @param {string} itemId - The ID of the item to retrieve
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
   * Retrieve an item
   * @param {string} itemId - The ID of the item to retrieve
   * @param {string} userId - The user retrieving the item
   * @param {string} timestamp - The timestamp of the retrieval
   * @returns {Object} - The result of the retrieval
   */
  retrieveItem(itemId, userId, timestamp) {
    const item = db.getItem(itemId)

    // If item not found, return error
    if (!item) {
      return {
        success: false,
      }
    }

    // Get the container
    const container = db.getContainer(item.containerId)
    if (!container) {
      return {
        success: false,
      }
    }

    // Use the item (decrement usage count)
    item.use()

    // Update the item in the database
    db.updateItem(item)

    // Log the retrieval
    const log = Log.createRetrievalLog(userId, itemId, container.containerId)
    if (timestamp) {
      log.timestamp = new Date(timestamp)
    }
    db.addLog(log)

    return {
      success: true,
    }
  }

  /**
   * Place an item in a container
   * @param {string} itemId - The ID of the item to place
   * @param {string} userId - The user placing the item
   * @param {string} timestamp - The timestamp of the placement
   * @param {string} containerId - The ID of the container to place in
   * @param {Object} position - The position to place the item
   * @returns {Object} - The result of the placement
   */
  placeItem(itemId, userId, timestamp, containerId, position) {
    const item = db.getItem(itemId)

    // If item not found, return error
    if (!item) {
      return {
        success: false,
      }
    }

    // Get the container
    const container = db.getContainer(containerId)
    if (!container) {
      return {
        success: false,
      }
    }

    // Check if the item can fit in the container at the specified position
    if (!container.canFitItem(item, position)) {
      return {
        success: false,
      }
    }

    // If the item is already in a container, remove it
    if (item.containerId) {
      const oldContainer = db.getContainer(item.containerId)
      if (oldContainer) {
        oldContainer.removeItem(itemId)
        db.updateContainer(oldContainer)
      }
    }

    // Update the item with the new container and position
    item.containerId = containerId
    item.position = position
    db.updateItem(item)

    // Add the item to the container
    container.addItem(item, position)
    db.updateContainer(container)

    // Log the placement
    const log = Log.createPlacementLog(userId, itemId, containerId)
    if (timestamp) {
      log.timestamp = new Date(timestamp)
    }
    db.addLog(log)

    return {
      success: true,
    }
  }
}

export default new RetrievalService()

