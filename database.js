/**
 * In-memory database service for the cargo management system
 * In a production environment, this would be replaced with a real database
 */
class Database {
  constructor() {
    this.items = new Map()
    this.containers = new Map()
    this.logs = []
    this.currentDate = new Date()
  }

  // Item methods
  addItem(item) {
    this.items.set(item.itemId, item)
    return item
  }

  getItem(itemId) {
    return this.items.get(itemId)
  }

  getItemByName(name) {
    return Array.from(this.items.values()).find((item) => item.name === name)
  }

  updateItem(item) {
    this.items.set(item.itemId, item)
    return item
  }

  removeItem(itemId) {
    const item = this.items.get(itemId)
    if (item) {
      this.items.delete(itemId)
    }
    return item
  }

  getAllItems() {
    return Array.from(this.items.values())
  }

  // Container methods
  addContainer(container) {
    this.containers.set(container.containerId, container)
    return container
  }

  getContainer(containerId) {
    return this.containers.get(containerId)
  }

  updateContainer(container) {
    this.containers.set(container.containerId, container)
    return container
  }

  removeContainer(containerId) {
    const container = this.containers.get(containerId)
    if (container) {
      this.containers.delete(containerId)
    }
    return container
  }

  getAllContainers() {
    return Array.from(this.containers.values())
  }

  getContainersByZone(zone) {
    return Array.from(this.containers.values()).filter((container) => container.zone === zone)
  }

  // Log methods
  addLog(log) {
    this.logs.push(log)
    return log
  }

  getLogs(filters = {}) {
    let filteredLogs = [...this.logs]

    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      filteredLogs = filteredLogs.filter((log) => log.timestamp >= startDate)
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      filteredLogs = filteredLogs.filter((log) => log.timestamp <= endDate)
    }

    if (filters.itemId) {
      filteredLogs = filteredLogs.filter((log) => log.itemId === filters.itemId)
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === filters.userId)
    }

    if (filters.actionType) {
      filteredLogs = filteredLogs.filter((log) => log.actionType === filters.actionType)
    }

    return filteredLogs
  }

  // Date methods
  getCurrentDate() {
    return new Date(this.currentDate)
  }

  setCurrentDate(date) {
    this.currentDate = new Date(date)
    return this.currentDate
  }

  advanceDate(days) {
    const newDate = new Date(this.currentDate)
    newDate.setDate(newDate.getDate() + days)
    this.currentDate = newDate
    return this.currentDate
  }

  // Waste identification
  getWasteItems() {
    const currentDate = this.getCurrentDate()
    return this.getAllItems().filter((item) => item.isWaste(currentDate))
  }

  // Clear all data (for testing)
  clear() {
    this.items.clear()
    this.containers.clear()
    this.logs = []
    this.currentDate = new Date()
  }
}

// Singleton instance
const db = new Database()
export default db

