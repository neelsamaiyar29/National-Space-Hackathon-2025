import fs from "fs"
import { parse } from "csv-parse/sync"
import { stringify } from "csv-stringify/sync"
import db from "./database.js"
import Item from "../models/item.js"
import Container from "../models/container.js"

/**
 * Service for handling import and export operations
 */
class ImportExportService {
  /**
   * Import items from a CSV file
   * @param {Object} file - The uploaded file
   * @returns {Object} - The result of the import
   */
  importItems(file) {
    try {
      // Read the file
      const fileContent = fs.readFileSync(file.path, "utf8")

      // Parse the CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      })

      const errors = []
      let itemsImported = 0

      // Process each record
      records.forEach((record, index) => {
        try {
          // Validate required fields
          if (!record.ItemID || !record.Name || !record.Width || !record.Depth || !record.Height) {
            errors.push({
              row: index + 2, // +2 because index is 0-based and we skip the header row
              message: "Missing required fields",
            })
            return
          }

          // Create the item
          const item = new Item({
            itemId: record.ItemID,
            name: record.Name,
            width: Number.parseFloat(record.Width),
            depth: Number.parseFloat(record.Depth),
            height: Number.parseFloat(record.Height),
            mass: record.Mass ? Number.parseFloat(record.Mass) : 0,
            priority: record.Priority ? Number.parseInt(record.Priority) : 0,
            expiryDate: record.ExpiryDate || null,
            usageLimit: record.UsageLimit ? Number.parseInt(record.UsageLimit) : null,
            preferredZone: record.PreferredZone || null,
          })

          // Add the item to the database
          db.addItem(item)
          itemsImported++
        } catch (error) {
          errors.push({
            row: index + 2,
            message: error.message,
          })
        }
      })

      return {
        success: true,
        itemsImported,
        errors,
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    } finally {
      // Clean up the temporary file
      if (file && file.path) {
        fs.unlinkSync(file.path)
      }
    }
  }

  /**
   * Import containers from a CSV file
   * @param {Object} file - The uploaded file
   * @returns {Object} - The result of the import
   */
  importContainers(file) {
    try {
      // Read the file
      const fileContent = fs.readFileSync(file.path, "utf8")

      // Parse the CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      })

      const errors = []
      let containersImported = 0

      // Process each record
      records.forEach((record, index) => {
        try {
          // Validate required fields
          if (!record.ContainerID || !record.Zone || !record.Width || !record.Depth || !record.Height) {
            errors.push({
              row: index + 2, // +2 because index is 0-based and we skip the header row
              message: "Missing required fields",
            })
            return
          }

          // Create the container
          const container = new Container({
            containerId: record.ContainerID,
            zone: record.Zone,
            width: Number.parseFloat(record.Width),
            depth: Number.parseFloat(record.Depth),
            height: Number.parseFloat(record.Height),
          })

          // Add the container to the database
          db.addContainer(container)
          containersImported++
        } catch (error) {
          errors.push({
            row: index + 2,
            message: error.message,
          })
        }
      })

      return {
        success: true,
        containersImported,
        errors,
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    } finally {
      // Clean up the temporary file
      if (file && file.path) {
        fs.unlinkSync(file.path)
      }
    }
  }

  /**
   * Export the current arrangement to a CSV file
   * @returns {Object} - The CSV data
   */
  exportArrangement() {
    // Get all items with their containers
    const allItems = db.getAllItems()

    // Format the data for CSV
    const csvData = allItems
      .filter((item) => item.containerId && item.position) // Only include items that are placed
      .map((item) => {
        return {
          "Item ID": item.itemId,
          "Container ID": item.containerId,
          Coordinates: `(${item.position.startCoordinates.width},${item.position.startCoordinates.depth},${item.position.startCoordinates.height}),(${item.position.endCoordinates.width},${item.position.endCoordinates.depth},${item.position.endCoordinates.height})`,
        }
      })

    // Generate the CSV
    const csv = stringify(csvData, {
      header: true,
    })

    return csv
  }
}

export default new ImportExportService()

