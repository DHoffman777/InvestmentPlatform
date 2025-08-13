import * as crypto from 'crypto';
import { promisify } from 'util';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
  iterations: number;
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
  salt: string;
}

/**
 * AES-256-GCM Encryption Service for Database Fields
 * Implements encryption at rest for sensitive data fields
 */
export class DatabaseEncryptionService {
  private readonly config: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16,  // 128 bits
    tagLength: 16, // 128 bits
    saltLength: 32, // 256 bits
    iterations: 100000 // PBKDF2 iterations
  };

  private masterKey: Buffer;
  
  constructor(masterKeyHex: string) {
    if (!masterKeyHex || masterKeyHex.length !== 64) {
      throw new Error('Master key must be 64 hex characters (256 bits)');
    }
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  public async encryptField(plaintext: string, associatedData?: string): Promise<EncryptedData> {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.config.saltLength);
      const iv = crypto.randomBytes(this.config.ivLength);
      
      // Derive encryption key from master key using PBKDF2
      const key = await this.deriveKey(this.masterKey, salt);
      
      // Create cipher
      const cipher = crypto.createCipher(this.config.algorithm, key);
      cipher.setAAD(Buffer.from(associatedData || '', 'utf8'));
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex')
      };
      
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  public async decryptField(encrypted: EncryptedData, associatedData?: string): Promise<string> {
    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(encrypted.iv, 'hex');
      const tag = Buffer.from(encrypted.tag, 'hex');
      const salt = Buffer.from(encrypted.salt, 'hex');
      
      // Derive the same encryption key
      const key = await this.deriveKey(this.masterKey, salt);
      
      // Create decipher
      const decipher = crypto.createDecipher(this.config.algorithm, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from(associatedData || '', 'utf8'));
      
      // Decrypt data
      let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Derive encryption key using PBKDF2
   */
  private async deriveKey(masterKey: Buffer, salt: Buffer): Promise<Buffer> {
    const pbkdf2 = promisify(crypto.pbkdf2);
    return await pbkdf2(masterKey, salt, this.config.iterations, this.config.keyLength, 'sha256');
  }

  /**
   * Generate a new master key (for initial setup)
   */
  public static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt multiple fields in a batch
   */
  public async encryptFields(
    fields: Record<string, string>, 
    associatedData?: string
  ): Promise<Record<string, EncryptedData>> {
    const encrypted: Record<string, EncryptedData> = {};
    
    for (const [fieldName, value] of Object.entries(fields)) {
      if (value && typeof value === 'string') {
        encrypted[fieldName] = await this.encryptField(value, associatedData);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt multiple fields in a batch
   */
  public async decryptFields(
    encryptedFields: Record<string, EncryptedData>, 
    associatedData?: string
  ): Promise<Record<string, string>> {
    const decrypted: Record<string, string> = {};
    
    for (const [fieldName, encryptedData] of Object.entries(encryptedFields)) {
      if (encryptedData) {
        decrypted[fieldName] = await this.decryptField(encryptedData, associatedData);
      }
    }
    
    return decrypted;
  }
}

/**
 * Database field encryption decorator for Prisma models
 */
export function EncryptedField(encryptionService: DatabaseEncryptionService) {
  return function (target: any, propertyKey: string) {
    const value = target[propertyKey];
    
    // Define getter/setter for encrypted field
    Object.defineProperty(target, propertyKey, {
      get: function() {
        return this[`_${propertyKey}`];
      },
      set: function(newValue: string) {
        if (newValue) {
          // Encrypt when setting
          encryptionService.encryptField(newValue).then(encrypted => {
            this[`_${propertyKey}_encrypted`] = encrypted;
          });
        }
        this[`_${propertyKey}`] = newValue;
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * Sensitive field types that require encryption
 */
export enum SensitiveFieldType {
  SSN = 'ssn',
  BANK_ACCOUNT = 'bank_account',
  CREDIT_CARD = 'credit_card',
  TAX_ID = 'tax_id',
  PASSPORT = 'passport',
  PHONE = 'phone',
  EMAIL = 'email',
  ADDRESS = 'address',
  NOTES = 'notes'
}

/**
 * Configuration for field-level encryption mapping
 */
export const ENCRYPTION_FIELD_MAPPING = {
  // Client sensitive data
  'clients.ssn': SensitiveFieldType.SSN,
  'clients.tax_id': SensitiveFieldType.TAX_ID,
  'clients.phone': SensitiveFieldType.PHONE,
  'clients.email': SensitiveFieldType.EMAIL,
  'clients.address': SensitiveFieldType.ADDRESS,
  'clients.notes': SensitiveFieldType.NOTES,
  
  // Account sensitive data
  'accounts.account_number': SensitiveFieldType.BANK_ACCOUNT,
  'accounts.routing_number': SensitiveFieldType.BANK_ACCOUNT,
  
  // Transaction sensitive data
  'transactions.notes': SensitiveFieldType.NOTES,
  'transactions.external_account': SensitiveFieldType.BANK_ACCOUNT,
  
  // Document sensitive data
  'documents.content': SensitiveFieldType.NOTES,
  'documents.metadata': SensitiveFieldType.NOTES
};

/**
 * PostgreSQL Transparent Data Encryption (TDE) configuration
 */
export class PostgreSQLEncryptionManager {
  /**
   * Configure PostgreSQL for encryption at rest
   */
  public static generateTDEConfig(): string {
    return `
# PostgreSQL Transparent Data Encryption Configuration
# Add to postgresql.conf

# Enable data encryption
shared_preload_libraries = 'pg_tde'

# Encryption settings
tde_database_encryption = on
tde_master_key_rotation_days = 90
tde_algorithm = 'AES256'

# Key management
tde_master_key_source = 'external'  # Use external key management
tde_key_rotation_enabled = on

# Logging for encryption events
log_tde_key_rotation = on
log_tde_encryption_events = on

# Backup encryption
archive_command = 'encrypt_backup %p %f'
    `.trim();
  }

  /**
   * Generate key rotation script
   */
  public static generateKeyRotationScript(): string {
    return `
#!/bin/bash
# PostgreSQL TDE Key Rotation Script

set -e

PGUSER="${POSTGRES_USER:-postgres}"
PGDB="${POSTGRES_DB:-investment_platform}"
KEY_BACKUP_PATH="${TDE_KEY_BACKUP_PATH:-/var/lib/postgresql/keys}"

echo "Starting TDE key rotation for database: $PGDB"

# Create key backup directory
mkdir -p $KEY_BACKUP_PATH

# Backup current key
psql -U $PGUSER -d $PGDB -c "SELECT tde_backup_master_key('$KEY_BACKUP_PATH/master_key_$(date +%Y%m%d_%H%M%S).backup');"

# Generate new master key
NEW_KEY=$(openssl rand -hex 32)

# Rotate master key
psql -U $PGUSER -d $PGDB -c "SELECT tde_rotate_master_key('$NEW_KEY');"

echo "TDE key rotation completed successfully"

# Log rotation event
logger "PostgreSQL TDE key rotated for database $PGDB"
    `.trim();
  }
}

/**
 * Application-level encryption middleware for Express.js
 */
export class ExpressEncryptionMiddleware {
  private encryptionService: DatabaseEncryptionService;
  
  constructor(encryptionService: DatabaseEncryptionService) {
    this.encryptionService = encryptionService;
  }

  /**
   * Middleware to encrypt request data
   */
  public encryptRequest() {
    return async (req: any, res: any, next: any) => {
      try {
        if (req.body && this.containsSensitiveData(req.body)) {
          req.body = await this.encryptSensitiveFields(req.body);
        }
        next();
      } catch (error) {
        res.status(500).json({
          error: 'Encryption error',
          message: 'Failed to encrypt sensitive data'
        });
      }
    };
  }

  /**
   * Middleware to decrypt response data
   */
  public decryptResponse() {
    return async (req: any, res: any, next: any) => {
      const originalSend = res.send;
      
      res.send = async function(data: any) {
        try {
          if (data && typeof data === 'object') {
            data = await this.decryptSensitiveFields(data);
          }
          originalSend.call(this, data);
        } catch (error) {
          originalSend.call(this, {
            error: 'Decryption error',
            message: 'Failed to decrypt sensitive data'
          });
        }
      }.bind(this);
      
      next();
    };
  }

  private containsSensitiveData(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    const sensitiveFields = ['ssn', 'tax_id', 'account_number', 'routing_number'];
    return sensitiveFields.some(field => obj.hasOwnProperty(field));
  }

  private async encryptSensitiveFields(obj: any): Promise<any> {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = { ...obj };
    const sensitiveFields = ['ssn', 'tax_id', 'account_number', 'routing_number', 'notes'];
    
    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string') {
        result[`${field}_encrypted`] = await this.encryptionService.encryptField(result[field]);
        delete result[field]; // Remove plaintext
      }
    }
    
    return result;
  }

  private async decryptSensitiveFields(obj: any): Promise<any> {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = { ...obj };
    const encryptedFields = Object.keys(result).filter(key => key.endsWith('_encrypted'));
    
    for (const encryptedField of encryptedFields) {
      const originalField = encryptedField.replace('_encrypted', '');
      if (result[encryptedField]) {
        result[originalField] = await this.encryptionService.decryptField(result[encryptedField]);
        delete result[encryptedField]; // Remove encrypted version from response
      }
    }
    
    return result;
  }
}

// Export configuration and utilities
export default {
  DatabaseEncryptionService,
  PostgreSQLEncryptionManager,
  ExpressEncryptionMiddleware,
  SensitiveFieldType,
  ENCRYPTION_FIELD_MAPPING
};