import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { appConfig } from '@rosreestr-extracts/config';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly scryptAsync = promisify(scrypt);

  constructor(
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.app.bcryptSaltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with bcrypt hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param plaintext - Data to encrypt
   * @param password - Encryption password
   * @returns Encrypted data in format: iv:authTag:encryptedData (base64)
   */
  async encrypt(plaintext: string, password: string): Promise<string> {
    // Generate random IV
    const iv = randomBytes(this.ivLength);

    // Derive key from password
    const key = (await this.scryptAsync(password, 'salt', this.keyLength)) as Buffer;

    // Create cipher
    const cipher = createCipheriv(this.algorithm, key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return combined format: iv:authTag:encryptedData
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param encryptedData - Encrypted data in format: iv:authTag:encryptedData (base64)
   * @param password - Decryption password
   * @returns Decrypted plaintext
   */
  async decrypt(encryptedData: string, password: string): Promise<string> {
    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivBase64, authTagBase64, encrypted] = parts;

    // Convert from base64
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    // Derive key from password
    const key = (await this.scryptAsync(password, 'salt', this.keyLength)) as Buffer;

    // Create decipher
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
