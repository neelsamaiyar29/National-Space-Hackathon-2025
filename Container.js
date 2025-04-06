/**
 * Container model representing storage containers on the space station
 */
class Container {
  constructor({ containerId, zone, width, depth, height, items = [] }) {
    this.containerId = containerId
    this.zone = zone
    this.width = width
    this.depth = depth
    this.height = height
    this.items = items // Array of items with their positions
  }

  /**
   * Get the total volume of the container
   * @returns {number} - The volume in cubic cm
   */
  getTotalVolume() {
    return this.width * this.depth * this.height
  }

  /**
   * Get the occupied volume in the container
   * @returns {number} - The occupied volume in cubic cm
   */
  getOccupiedVolume() {
    return this.items.reduce((total, item) => {
      return total + item.width * item.depth * item.height
    }, 0)
  }

  /**
   * Get the available volume in the container
   * @returns {number} - The available volume in cubic cm
   */
  getAvailableVolume() {
    return this.getTotalVolume() - this.getOccupiedVolume()
  }

  /**
   * Check if an item can fit in the container at a specific position
   * @param {Object} item - The item to check
   * @param {Object} position - The position to check
   * @returns {boolean} - Whether the item can fit
   */
  canFitItem(item, position) {
    // Check if the item fits within the container dimensions
    if (
      position.startCoordinates.width < 0 ||
      position.startCoordinates.depth < 0 ||
      position.startCoordinates.height < 0 ||
      position.endCoordinates.width > this.width ||
      position.endCoordinates.depth > this.depth ||
      position.endCoordinates.height > this.height
    ) {
      return false
    }

    // Check if the item overlaps with any existing items
    for (const existingItem of this.items) {
      if (this.itemsOverlap(existingItem.position, position)) {
        return false
      }
    }

    return true
  }

  /**
   * Check if two positions overlap
   * @param {Object} pos1 - The first position
   * @param {Object} pos2 - The second position
   * @returns {boolean} - Whether the positions overlap
   */
  itemsOverlap(pos1, pos2) {
    return !(
      pos1.endCoordinates.width <= pos2.startCoordinates.width ||
      pos1.startCoordinates.width >= pos2.endCoordinates.width ||
      pos1.endCoordinates.depth <= pos2.startCoordinates.depth ||
      pos1.startCoordinates.depth >= pos2.endCoordinates.depth ||
      pos1.endCoordinates.height <= pos2.startCoordinates.height ||
      pos1.startCoordinates.height >= pos2.endCoordinates.height
    )
  }

  /**
   * Add an item to the container
   * @param {Object} item - The item to add
   * @param {Object} position - The position to place the item
   * @returns {boolean} - Whether the item was added successfully
   */
  addItem(item, position) {
    if (this.canFitItem(item, position)) {
      this.items.push({
        ...item,
        position,
      })
      return true
    }
    return false
  }

  /**
   * Remove an item from the container
   * @param {string} itemId - The ID of the item to remove
   * @returns {Object|null} - The removed item or null if not found
   */
  removeItem(itemId) {
    const index = this.items.findIndex((item) => item.itemId === itemId)
    if (index !== -1) {
      const removedItem = this.items[index]
      this.items.splice(index, 1)
      return removedItem
    }
    return null
  }

  /**
   * Find an item in the container
   * @param {string} itemId - The ID of the item to find
   * @returns {Object|null} - The item or null if not found
   */
  findItem(itemId) {
    return this.items.find((item) => item.itemId === itemId) || null
  }

  /**
   * Get all items that need to be moved to retrieve a specific item
   * @param {string} itemId - The ID of the item to retrieve
   * @returns {Array} - Array of items that need to be moved
   */
  getItemsToMove(itemId) {
    const targetItem = this.findItem(itemId)
    if (!targetItem) return []

    // Items that block the path to the target item
    return this.items.filter((item) => {
      // Skip the target item itself
      if (item.itemId === itemId) return false

      // Check if this item blocks the path to the target item
      // An item blocks if it's in front of the target item (lower depth)
      // and overlaps in width and height
      return (
        item.position.startCoordinates.depth < targetItem.position.startCoordinates.depth &&
        !(
          item.position.endCoordinates.width <= targetItem.position.startCoordinates.width ||
          item.position.startCoordinates.width >= targetItem.position.endCoordinates.width ||
          item.position.endCoordinates.height <= targetItem.position.startCoordinates.height ||
          item.position.startCoordinates.height >= targetItem.position.endCoordinates.height
        )
      )
    })
  }

  /**
   * Calculate the number of steps needed to retrieve an item
   * @param {string} itemId - The ID of the item to retrieve
   * @returns {number} - The number of steps needed
   */
  getRetrievalSteps(itemId) {
    return this.getItemsToMove(itemId).length
  }

  /**
   * Clone the container
   * @returns {Container} - A new instance with the same properties
   */
  clone() {
    return new Container({
      containerId: this.containerId,
      zone: this.zone,
      width: this.width,
      depth: this.depth,
      height: this.height,
      items: JSON.parse(JSON.stringify(this.items)),
    })
  }
}

export default Container

