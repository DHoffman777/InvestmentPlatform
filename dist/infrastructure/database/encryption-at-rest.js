"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressEncryptionMiddleware = exports.PostgreSQLEncryptionManager = exports.ENCRYPTION_FIELD_MAPPING = exports.SensitiveFieldType = exports.DatabaseEncryptionService = void 0;
exports.EncryptedField = EncryptedField;
const crypto = __importStar(require("crypto"));
const util_1 = require("util");
/**
 * AES-256-GCM Encryption Service for Database Fields
 * Implements encryption at rest for sensitive data fields
 */
class DatabaseEncryptionService {
    config = {
        algorithm: 'aes-256-gcm',
        keyLength: 32, // 256 bits
        ivLength: 16, // 128 bits
        tagLength: 16, // 128 bits
        saltLength: 32, // 256 bits
        iterations: 100000 // PBKDF2 iterations
    };
    masterKey;
    constructor(masterKeyHex) {
        if (!masterKeyHex || masterKeyHex.length !== 64) {
            throw new Error('Master key must be 64 hex characters (256 bits)');
        }
        this.masterKey = Buffer.from(masterKeyHex, 'hex');
    }
    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    async encryptField(plaintext, associatedData) {
        try {
            // Generate random salt and IV
            const salt = crypto.randomBytes(this.config.saltLength);
            const iv = crypto.randomBytes(this.config.ivLength);
            // Derive encryption key from master key using PBKDF2
            const key = await this.deriveKey(this.masterKey, salt);
            // Create cipher
            const cipher = crypto.createCipheriv(this.config.algorithm, key, iv);
            if (cipher.setAAD) {
                cipher.setAAD(Buffer.from(associatedData || '', 'utf8'));
            }
            // Encrypt data
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            // Get authentication tag
            const tag = cipher.getAuthTag ? cipher.getAuthTag() : Buffer.alloc(0);
            return {
                encryptedData: encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
                salt: salt.toString('hex')
            };
        }
        catch (error) {
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Decrypt sensitive data using AES-256-GCM
     */
    async decryptField(encrypted, associatedData) {
        try {
            // Convert hex strings back to buffers
            const iv = Buffer.from(encrypted.iv, 'hex');
            const tag = Buffer.from(encrypted.tag, 'hex');
            const salt = Buffer.from(encrypted.salt, 'hex');
            // Derive the same encryption key
            const key = await this.deriveKey(this.masterKey, salt);
            // Create decipher
            const decipher = crypto.createDecipheriv(this.config.algorithm, key, iv);
            if (decipher.setAuthTag) {
                decipher.setAuthTag(tag);
            }
            if (decipher.setAAD) {
                decipher.setAAD(Buffer.from(associatedData || '', 'utf8'));
            }
            // Decrypt data
            let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Derive encryption key using PBKDF2
     */
    async deriveKey(masterKey, salt) {
        const pbkdf2 = (0, util_1.promisify)(crypto.pbkdf2);
        return await pbkdf2(masterKey, salt, this.config.iterations, this.config.keyLength, 'sha256');
    }
    /**
     * Generate a new master key (for initial setup)
     */
    static generateMasterKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Encrypt multiple fields in a batch
     */
    async encryptFields(fields, associatedData) {
        const encrypted = {};
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
    async decryptFields(encryptedFields, associatedData) {
        const decrypted = {};
        for (const [fieldName, encryptedData] of Object.entries(encryptedFields)) {
            if (encryptedData) {
                decrypted[fieldName] = await this.decryptField(encryptedData, associatedData);
            }
        }
        return decrypted;
    }
}
exports.DatabaseEncryptionService = DatabaseEncryptionService;
/**
 * Database field encryption decorator for Prisma models
 */
function EncryptedField(encryptionService) {
    return function (target, propertyKey) {
        const value = target[propertyKey];
        // Define getter/setter for encrypted field
        Object.defineProperty(target, propertyKey, {
            get: function () {
                return this[`_${propertyKey}`];
            },
            set: function (newValue) {
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
var SensitiveFieldType;
(function (SensitiveFieldType) {
    SensitiveFieldType["SSN"] = "ssn";
    SensitiveFieldType["BANK_ACCOUNT"] = "bank_account";
    SensitiveFieldType["CREDIT_CARD"] = "credit_card";
    SensitiveFieldType["TAX_ID"] = "tax_id";
    SensitiveFieldType["PASSPORT"] = "passport";
    SensitiveFieldType["PHONE"] = "phone";
    SensitiveFieldType["EMAIL"] = "email";
    SensitiveFieldType["ADDRESS"] = "address";
    SensitiveFieldType["NOTES"] = "notes";
})(SensitiveFieldType || (exports.SensitiveFieldType = SensitiveFieldType = {}));
/**
 * Configuration for field-level encryption mapping
 */
exports.ENCRYPTION_FIELD_MAPPING = {
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
class PostgreSQLEncryptionManager {
    /**
     * Configure PostgreSQL for encryption at rest
     */
    static generateTDEConfig() {
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
    static generateKeyRotationScript() {
        return `
#!/bin/bash
# PostgreSQL TDE Key Rotation Script

set -e

PGUSER="\${POSTGRES_USER:-postgres}"
PGDB="\${POSTGRES_DB:-investment_platform}"
KEY_BACKUP_PATH="\${TDE_KEY_BACKUP_PATH:-/var/lib/postgresql/keys}"

echo "Starting TDE key rotation for database: \$PGDB"

# Create key backup directory
mkdir -p \$KEY_BACKUP_PATH

# Backup current key
psql -U \$PGUSER -d \$PGDB -c "SELECT tde_backup_master_key('\$KEY_BACKUP_PATH/master_key_\$(date +%Y%m%d_%H%M%S).backup');"

# Generate new master key
NEW_KEY=\$(openssl rand -hex 32)

# Rotate master key
psql -U \$PGUSER -d \$PGDB -c "SELECT tde_rotate_master_key('\$NEW_KEY');"

echo "TDE key rotation completed successfully"

# Log rotation event
logger "PostgreSQL TDE key rotated for database \$PGDB"
    `.trim();
    }
}
exports.PostgreSQLEncryptionManager = PostgreSQLEncryptionManager;
/**
 * Application-level encryption middleware for Express.js
 */
class ExpressEncryptionMiddleware {
    encryptionService;
    constructor(encryptionService) {
        this.encryptionService = encryptionService;
    }
    /**
     * Middleware to encrypt request data
     */
    encryptRequest() {
        return async (req, res, next) => {
            try {
                if (req.body && this.containsSensitiveData(req.body)) {
                    req.body = await this.encryptSensitiveFields(req.body);
                }
                next();
            }
            catch (error) {
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
    decryptResponse() {
        const self = this;
        return async (req, res, next) => {
            const originalSend = res.send;
            res.send = async function (data) {
                try {
                    if (data && typeof data === 'object') {
                        data = await self.decryptSensitiveFields(data);
                    }
                    originalSend.call(res, data);
                }
                catch (error) {
                    originalSend.call(res, {
                        error: 'Decryption error',
                        message: 'Failed to decrypt sensitive data'
                    });
                }
            }.bind(this);
            next();
        };
    }
    containsSensitiveData(obj) {
        if (!obj || typeof obj !== 'object')
            return false;
        const sensitiveFields = ['ssn', 'tax_id', 'account_number', 'routing_number'];
        return sensitiveFields.some(field => obj.hasOwnProperty(field));
    }
    async encryptSensitiveFields(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
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
    async decryptSensitiveFields(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
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
exports.ExpressEncryptionMiddleware = ExpressEncryptionMiddleware;
// Export configuration and utilities
exports.default = {
    DatabaseEncryptionService,
    PostgreSQLEncryptionManager,
    ExpressEncryptionMiddleware,
    SensitiveFieldType,
    ENCRYPTION_FIELD_MAPPING: exports.ENCRYPTION_FIELD_MAPPING
};
