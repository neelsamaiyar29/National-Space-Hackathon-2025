/**
 * Item model representing cargo items on the space station
 */
class Item {
  constructor({
    itemId,
    name,
    width,
    depth,
    height,
    mass,
    priority,
    expiryDate,
    usageLimit,
    preferredZone,
    containerId = null,
    position = null,
    remainingUses = null,
  }) {
    this.itemId = itemId
    this.name = name
    this.width = width
    this.depth = depth
    this.height = height
    this.mass = mass || 0
    this.priority = priority
    this.expiryDate = expiryDate ? new Date(expiryDate) : null
    this.usageLimit = usageLimit
    this.preferredZone = preferredZone
    this.containerId = containerId
    this.position = position
    this.remainingUses = remainingUses !== null ? remainingUses : usageLimit
  }

  /**
   * Check if the item is expired based on the current date
   * @param {Date} currentDate - The current date to check against
   * @returns {boolean} - Whether the item is expired
   */
  isExpired(currentDate) {
    if (!this.expiryDate) return false
    return this.expiryDate < currentDate
  }

  /**
   * Check if the item is out of uses
   * @returns {boolean} - Whether the item is out of uses
   */
  isOutOfUses() {
    return this.remainingUses <= 0
  }

  /**
   * Check if the item is waste (expired or out of uses)
   * @param {Date} currentDate - The current date to check against
   * @returns {boolean} - Whether the item is waste
   */
  isWaste(currentDate) {
    return this.isExpired(currentDate) || this.isOutOfUses()
  }

  /**
   * Get the reason why an item is waste
   * @param {Date} currentDate - The current date to check against
   * @returns {string|null} - The reason or null if not waste
   */
  getWasteReason(currentDate) {
    if (this.isExpired(currentDate)) return "Expired"
    if (this.isOutOfUses()) return "Out of Uses"
    return null
  }

  /**
   * Use the item once, decrementing its remaining uses
   * @returns {number} - The remaining uses after using the item
   */
  use() {
    if (this.remainingUses > 0) {
      this.remainingUses--
    }
    return this.remainingUses
  }

  /**
   * Get the volume of the item
   * @returns {number} - The volume in cubic cm
   */
  getVolume() {
    return this.width * this.depth * this.height
  }

  /**
   * Clone the item
   * @returns {Item} - A new instance with the same properties
   */
  clone() {
    return new Item({
      itemId: this.itemId,
      name: this.name,
      width: this.width,
      depth: this.depth,
      height: this.height,
      mass: this.mass,
      priority: this.priority,
      expiryDate: this.expiryDate ? new Date(this.expiryDate) : null,
      usageLimit: this.usageLimit,
      preferredZone: this.preferredZone,
      containerId: this.containerId,
      position: this.position ? JSON.parse(JSON.stringify(this.position)) : null,
      remainingUses: this.remainingUses,
    })
  }
}

export default Item

