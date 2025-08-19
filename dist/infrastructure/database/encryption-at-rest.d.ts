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
export declare class DatabaseEncryptionService {
    private readonly config;
    private masterKey;
    constructor(masterKeyHex: string);
    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    encryptField(plaintext: string, associatedData?: string): Promise<EncryptedData>;
    /**
     * Decrypt sensitive data using AES-256-GCM
     */
    decryptField(encrypted: EncryptedData, associatedData?: string): Promise<string>;
    /**
     * Derive encryption key using PBKDF2
     */
    private deriveKey;
    /**
     * Generate a new master key (for initial setup)
     */
    static generateMasterKey(): string;
    /**
     * Encrypt multiple fields in a batch
     */
    encryptFields(fields: Record<string, string>, associatedData?: string): Promise<Record<string, EncryptedData>>;
    /**
     * Decrypt multiple fields in a batch
     */
    decryptFields(encryptedFields: Record<string, EncryptedData>, associatedData?: string): Promise<Record<string, string>>;
}
/**
 * Database field encryption decorator for Prisma models
 */
export declare function EncryptedField(encryptionService: DatabaseEncryptionService): (target: any, propertyKey: string) => void;
/**
 * Sensitive field types that require encryption
 */
export declare enum SensitiveFieldType {
    SSN = "ssn",
    BANK_ACCOUNT = "bank_account",
    CREDIT_CARD = "credit_card",
    TAX_ID = "tax_id",
    PASSPORT = "passport",
    PHONE = "phone",
    EMAIL = "email",
    ADDRESS = "address",
    NOTES = "notes"
}
/**
 * Configuration for field-level encryption mapping
 */
export declare const ENCRYPTION_FIELD_MAPPING: {
    'clients.ssn': SensitiveFieldType;
    'clients.tax_id': SensitiveFieldType;
    'clients.phone': SensitiveFieldType;
    'clients.email': SensitiveFieldType;
    'clients.address': SensitiveFieldType;
    'clients.notes': SensitiveFieldType;
    'accounts.account_number': SensitiveFieldType;
    'accounts.routing_number': SensitiveFieldType;
    'transactions.notes': SensitiveFieldType;
    'transactions.external_account': SensitiveFieldType;
    'documents.content': SensitiveFieldType;
    'documents.metadata': SensitiveFieldType;
};
/**
 * PostgreSQL Transparent Data Encryption (TDE) configuration
 */
export declare class PostgreSQLEncryptionManager {
    #private;
    /**
     * Configure PostgreSQL for encryption at rest
     */
    static generateTDEConfig(): string;
    /**
     * Generate key rotation script
     */
    static generateKeyRotationScript(): string;
    ": any;
    PGDB: string;
    KEY_BACKUP_PATH: string;
    echo: any;
    "Starting TDE key rotation for database: $PGDB": any;
    Create: any;
    key: any;
    backup: any;
    directory: any;
    mkdir: any;
}
