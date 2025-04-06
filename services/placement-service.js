import db from "./database.js"
import Container from "../models/container.js"

/**
 * Service for handling item placement and rearrangement
 */
class PlacementService {
  /**
   * Find the optimal placement for a set of items in available containers
   * @param {Array} items - The items to place
   * @param {Array} containers - The available containers
   * @returns {Object} - Placement recommendations and rearrangements
   */
  findOptimalPlacement(items, containers) {
    // Sort items by priority (highest first)
    const sortedItems = [...items].sort((a, b) => b.priority - a.priority)

    // Clone containers to work with
    const containerMap = new Map()
    containers.forEach((container) => {
      containerMap.set(
        container.containerId,
        new Container({
          ...container,
          items: [],
        }),
      )
    })

    const placements = []
    const rearrangements = []
    const unplacedItems = []

    // First pass: try to place items in their preferred zones
    for (const item of sortedItems) {
      let placed = false

      // Get containers in the preferred zone
      const preferredContainers = Array.from(containerMap.values()).filter(
        (container) => container.zone === item.preferredZone,
      )

      // Try to place in preferred zone
      for (const container of preferredContainers) {
        const position = this.findPositionInContainer(item, container)
        if (position) {
          placements.push({
            itemId: item.itemId,
            containerId: container.containerId,
            position,
          })

          // Update container with the new item
          container.addItem(item, position)
          placed = true
          break
        }
      }

      // If not placed in preferred zone, try any zone
      if (!placed) {
        const allContainers = Array.from(containerMap.values()).filter(
          (container) => container.zone !== item.preferredZone,
        )

        for (const container of allContainers) {
          const position = this.findPositionInContainer(item, container)
          if (position) {
            placements.push({
              itemId: item.itemId,
              containerId: container.containerId,
              position,
            })

            // Update container with the new item
            container.addItem(item, position)
            placed = true
            break
          }
        }
      }

      // If still not placed, add to unplaced items
      if (!placed) {
        unplacedItems.push(item)
      }
    }

    // Second pass: try to rearrange to fit unplaced items
    if (unplacedItems.length > 0) {
      const rearrangementResult = this.rearrangeForUnplacedItems(unplacedItems, containerMap)
      placements.push(...rearrangementResult.placements)
      rearrangements.push(...rearrangementResult.rearrangements)
    }

    return {
      success: unplacedItems.length === 0 || rearrangements.length > 0,
      placements,
      rearrangements,
    }
  }

  /**
   * Find a position for an item in a container
   * @param {Object} item - The item to place
   * @param {Container} container - The container to place in
   * @returns {Object|null} - The position or null if not possible
   */
  findPositionInContainer(item, container) {
    // Simple first-fit algorithm
    // In a real implementation, this would be more sophisticated

    // Check if the item fits in the container at all
    if (item.width > container.width || item.depth > container.depth || item.height > container.height) {
      return null
    }

    // Try to place at the bottom of the container
    // This is a simplified approach - a real implementation would be more complex

    // Start at the origin (0,0,0)
    let x = 0
    let y = 0
    let z = 0

    // Check if the position is valid
    while (z + item.height <= container.height) {
      while (y + item.depth <= container.depth) {
        while (x + item.width <= container.width) {
          const position = {
            startCoordinates: { width: x, depth: y, height: z },
            endCoordinates: { width: x + item.width, depth: y + item.depth, height: z + item.height },
          }

          if (container.canFitItem(item, position)) {
            return position
          }

          x += 1 // Try the next position along the width
        }
        x = 0 // Reset x
        y += 1 // Move to the next position along the depth
      }
      y = 0 // Reset y
      z += 1 // Move to the next position along the height
    }

    // If we get here, the item doesn't fit
    return null
  }

  /**
   * Rearrange containers to fit unplaced items
   * @param {Array} unplacedItems - Items that couldn't be placed
   * @param {Map} containerMap - Map of containers
   * @returns {Object} - Placements and rearrangements
   */
  rearrangeForUnplacedItems(unplacedItems, containerMap) {
    const placements = []
    const rearrangements = []
    let step = 1

    // For each unplaced item, try to rearrange containers
    for (const item of unplacedItems) {
      // Get all containers sorted by available volume (largest first)
      const sortedContainers = Array.from(containerMap.values()).sort(
        (a, b) => b.getAvailableVolume() - a.getAvailableVolume(),
      )

      // Try each container
      for (const container of sortedContainers) {
        // If the item fits in the container without rearrangement, place it
        const position = this.findPositionInContainer(item, container)
        if (position) {
          placements.push({
            itemId: item.itemId,
            containerId: container.containerId,
            position,
          })

          container.addItem(item, position)
          break
        }

        // If the item doesn't fit, try to rearrange
        // This is a simplified approach - a real implementation would be more complex

        // Get low-priority items in the container
        const lowPriorityItems = container.items
          .filter((containerItem) => {
            const dbItem = db.getItem(containerItem.itemId)
            return dbItem && dbItem.priority < item.priority
          })
          .sort((a, b) => {
            const itemA = db.getItem(a.itemId)
            const itemB = db.getItem(b.itemId)
            return itemA.priority - itemB.priority // Sort by priority (lowest first)
          })

        // Try removing low-priority items to make space
        for (const lowPriorityItem of lowPriorityItems) {
          // Remove the item temporarily
          container.removeItem(lowPriorityItem.itemId)

          // Check if the unplaced item fits now
          const newPosition = this.findPositionInContainer(item, container)

          if (newPosition) {
            // It fits! Add rearrangement steps

            // Step 1: Remove the low-priority item
            rearrangements.push({
              step: step++,
              action: "remove",
              itemId: lowPriorityItem.itemId,
              fromContainer: container.containerId,
              fromPosition: lowPriorityItem.position,
              toContainer: null,
              toPosition: null,
            })

            // Step 2: Place the unplaced item
            rearrangements.push({
              step: step++,
              action: "place",
              itemId: item.itemId,
              fromContainer: null,
              fromPosition: null,
              toContainer: container.containerId,
              toPosition: newPosition,
            })

            // Add the placement
            placements.push({
              itemId: item.itemId,
              containerId: container.containerId,
              position: newPosition,
            })

            // Update the container
            container.addItem(item, newPosition)

            // Try to find a new home for the removed item
            let newHome = false
            for (const otherContainer of sortedContainers) {
              if (otherContainer.containerId === container.containerId) continue

              const otherPosition = this.findPositionInContainer(lowPriorityItem, otherContainer)
              if (otherPosition) {
                // Step 3: Place the low-priority item in a new container
                rearrangements.push({
                  step: step++,
                  action: "place",
                  itemId: lowPriorityItem.itemId,
                  fromContainer: null,
                  fromPosition: null,
                  toContainer: otherContainer.containerId,
                  toPosition: otherPosition,
                })

                // Update the other container
                otherContainer.addItem(lowPriorityItem, otherPosition)

                newHome = true
                break
              }
            }

            // If no new home found, put it back
            if (!newHome) {
              // Step 3: Put the low-priority item back
              rearrangements.push({
                step: step++,
                action: "place",
                itemId: lowPriorityItem.itemId,
                fromContainer: null,
                fromPosition: null,
                toContainer: container.containerId,
                toPosition: lowPriorityItem.position,
              })

              // Update the container
              container.addItem(lowPriorityItem, lowPriorityItem.position)
            }

            break
          } else {
            // It doesn't fit, put the low-priority item back
            container.addItem(lowPriorityItem, lowPriorityItem.position)
          }
        }
      }
    }

    return { placements, rearrangements }
  }
}

export default new PlacementService()

