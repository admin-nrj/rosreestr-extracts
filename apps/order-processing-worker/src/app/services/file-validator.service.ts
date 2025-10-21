import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import AdmZip from 'adm-zip';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
}

/**
 * Service for validating downloaded files
 */
@Injectable()
export class FileValidatorService {
  private readonly logger = new Logger(FileValidatorService.name);

  /**
   * Validate downloaded zip file:
   * - Check file exists
   * - Check file size > 0
   * - Check it's a valid zip archive
   * - Check it can be extracted
   */
  async validateZipFile(filePath: string): Promise<FileValidationResult> {
    try {
      // Check file exists
      try {
        await fs.access(filePath);
      } catch {
        return {
          isValid: false,
          error: `File does not exist: ${filePath}`,
        };
      }

      // Check file size > 0
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;

      if (fileSize === 0) {
        return {
          isValid: false,
          error: 'File size is 0 bytes',
          fileSize,
        };
      }

      this.logger.log(`File size: ${fileSize} bytes`);

      // Check it's a valid zip archive and can be extracted
      try {
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();

        if (zipEntries.length === 0) {
          return {
            isValid: false,
            error: 'Zip archive is empty (no entries)',
            fileSize,
          };
        }

        this.logger.log(`Zip archive contains ${zipEntries.length} entries`);

        // Try to read first entry to verify extraction works
        const firstEntry = zipEntries[0];
        if (firstEntry && !firstEntry.isDirectory) {
          // Attempt to read the entry data
          zip.readAsText(firstEntry);
        }

        return {
          isValid: true,
          fileSize,
        };
      } catch (zipError: unknown) {
        const errorMessage =
          zipError instanceof Error ? zipError.message : 'Unknown zip error';
        return {
          isValid: false,
          error: `Invalid zip archive or extraction failed: ${errorMessage}`,
          fileSize,
        };
      }
    } catch (error: unknown) {
      this.logger.error(`Unexpected error during file validation:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        isValid: false,
        error: `Validation error: ${errorMessage}`,
      };
    }
  }
}
