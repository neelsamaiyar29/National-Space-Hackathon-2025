/**
 * Log model for tracking actions in the system
 */
class Log {
  constructor({ timestamp, userId, actionType, itemId, details }) {
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp)
    this.userId = userId
    this.actionType = actionType // "placement", "retrieval", "rearrangement", "disposal"
    this.itemId = itemId
    this.details = details || {} // Additional details like fromContainer, toContainer, reason, etc.
  }

  /**
   * Create a placement log
   * @param {string} userId - The user who performed the action
   * @param {string} itemId - The item that was placed
   * @param {string} containerId - The container where the item was placed
   * @returns {Log} - A new placement log
   */
  static createPlacementLog(userId, itemId, containerId) {
    return new Log({
      timestamp: new Date(),
      userId,
      actionType: "placement",
      itemId,
      details: {
        toContainer: containerId,
      },
    })
  }

  /**
   * Create a retrieval log
   * @param {string} userId - The user who performed the action
   * @param {string} itemId - The item that was retrieved
   * @param {string} containerId - The container from which the item was retrieved
   * @returns {Log} - A new retrieval log
   */
  static createRetrievalLog(userId, itemId, containerId) {
    return new Log({
      timestamp: new Date(),
      userId,
      actionType: "retrieval",
      itemId,
      details: {
        fromContainer: containerId,
      },
    })
  }

  /**
   * Create a rearrangement log
   * @param {string} userId - The user who performed the action
   * @param {string} itemId - The item that was rearranged
   * @param {string} fromContainer - The container from which the item was moved
   * @param {string} toContainer - The container to which the item was moved
   * @returns {Log} - A new rearrangement log
   */
  static createRearrangementLog(userId, itemId, fromContainer, toContainer) {
    return new Log({
      timestamp: new Date(),
      userId,
      actionType: "rearrangement",
      itemId,
      details: {
        fromContainer,
        toContainer,
      },
    })
  }

  /**
   * Create a disposal log
   * @param {string} userId - The user who performed the action
   * @param {string} itemId - The item that was disposed
   * @param {string} fromContainer - The container from which the item was disposed
   * @param {string} reason - The reason for disposal
   * @returns {Log} - A new disposal log
   */
  static createDisposalLog(userId, itemId, fromContainer, reason) {
    return new Log({
      timestamp: new Date(),
      userId,
      actionType: "disposal",
      itemId,
      details: {
        fromContainer,
        reason,
      },
    })
  }
}

export default Log

