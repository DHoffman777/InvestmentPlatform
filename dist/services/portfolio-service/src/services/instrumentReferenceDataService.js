"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentReferenceDataService = void 0;
class InstrumentReferenceDataService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Instrument Master Data Management
    async createInstrument(request) {
        const validation = this.validateInstrumentRequest(request);
        if (!validation.isValid) {
            throw new Error(`Instrument validation failed: ${validation.errors.join(', ')}`);
        }
        // Check for existing instrument
        const existing = await this.findInstrumentByIdentifiers(request.identifiers, request.tenantId);
        if (existing) {
            throw new Error(`Instrument already exists with identifier: ${existing.securityId}`);
        }
        const instrument = {
            securityId: request.securityId,
            cusip: request.identifiers.cusip,
            isin: request.identifiers.isin,
            sedol: request.identifiers.sedol,
            ticker: request.identifiers.ticker,
            bloombergId: request.identifiers.bloombergId,
            refinitivRic: request.identifiers.refinitivRic,
            name: request.name,
            shortName: request.shortName,
            description: request.description,
            instrumentType: request.instrumentType,
            securityType: request.securityType,
            issuerName: request.issuerName,
            issuerCountry: request.issuerCountry,
            primaryExchange: request.primaryExchange,
            tradingCurrency: request.tradingCurrency,
            isActive: true,
            isDelisted: false,
            dataSource: request.dataSource,
            dataVendor: request.dataVendor,
            lastUpdated: new Date(),
            dataQuality: this.assessDataQuality(request),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: request.createdBy,
            updatedBy: request.createdBy
        };
        const created = await this.prisma.instrumentMaster.create({
            data: {
                ...instrument,
                tenantId: request.tenantId
            }
        });
        await this.kafkaService.publishEvent('instrument-created', {
            securityId: created.securityId,
            tenantId: request.tenantId,
            instrument: created,
            timestamp: new Date().toISOString()
        });
        return created;
    }
    async updateInstrument(request) {
        const existing = await this.prisma.instrumentMaster.findFirst({
            where: {
                securityId: request.securityId,
                tenantId: request.tenantId
            }
        });
        if (!existing) {
            throw new Error('Instrument not found');
        }
        const validation = this.validateInstrumentUpdate(existing, request.updates);
        if (!validation.isValid) {
            throw new Error(`Instrument update validation failed: ${validation.errors.join(', ')}`);
        }
        const updated = await this.prisma.instrumentMaster.update({
            where: { id: existing.id },
            data: {
                ...request.updates,
                lastUpdated: new Date(),
                updatedAt: new Date(),
                updatedBy: request.updatedBy,
                dataQuality: this.assessDataQuality({ ...existing, ...request.updates })
            }
        });
        await this.kafkaService.publishEvent('instrument-updated', {
            securityId: request.securityId,
            tenantId: request.tenantId,
            changes: request.updates,
            updatedBy: request.updatedBy,
            timestamp: new Date().toISOString()
        });
        return updated;
    }
    async searchInstruments(request) {
        const where = {
            tenantId: request.tenantId
        };
        // Text search
        if (request.query) {
            where.OR = [
                { name: { contains: request.query, mode: 'insensitive' } },
                { shortName: { contains: request.query, mode: 'insensitive' } },
                { ticker: { contains: request.query, mode: 'insensitive' } },
                { cusip: { contains: request.query, mode: 'insensitive' } },
                { isin: { contains: request.query, mode: 'insensitive' } },
                { issuerName: { contains: request.query, mode: 'insensitive' } }
            ];
        }
        // Identifier search
        if (request.identifiers) {
            const identifierConditions = [];
            if (request.identifiers.cusip)
                identifierConditions.push({ cusip: request.identifiers.cusip });
            if (request.identifiers.isin)
                identifierConditions.push({ isin: request.identifiers.isin });
            if (request.identifiers.sedol)
                identifierConditions.push({ sedol: request.identifiers.sedol });
            if (request.identifiers.ticker)
                identifierConditions.push({ ticker: request.identifiers.ticker });
            if (identifierConditions.length > 0) {
                where.OR = identifierConditions;
            }
        }
        // Filter conditions
        if (request.instrumentType && request.instrumentType.length > 0) {
            where.instrumentType = { in: request.instrumentType };
        }
        if (request.securityType && request.securityType.length > 0) {
            where.securityType = { in: request.securityType };
        }
        if (request.exchange && request.exchange.length > 0) {
            where.primaryExchange = { in: request.exchange };
        }
        if (request.currency && request.currency.length > 0) {
            where.tradingCurrency = { in: request.currency };
        }
        if (request.isActive !== undefined) {
            where.isActive = request.isActive;
        }
        const [instruments, total] = await Promise.all([
            this.prisma.instrumentMaster.findMany({
                where,
                orderBy: [
                    { name: 'asc' }
                ],
                take: request.limit || 50,
                skip: request.offset || 0
            }),
            this.prisma.instrumentMaster.count({ where })
        ]);
        return {
            instruments,
            total,
            hasMore: (request.offset || 0) + instruments.length < total,
            searchQuery: request.query,
            filters: {
                instrumentType: request.instrumentType,
                securityType: request.securityType,
                exchange: request.exchange,
                currency: request.currency,
                isActive: request.isActive
            }
        };
    }
    async lookupInstrument(request) {
        const where = {
            tenantId: request.tenantId,
            isActive: true
        };
        switch (request.identifierType) {
            case 'CUSIP':
                where.cusip = request.identifier;
                break;
            case 'ISIN':
                where.isin = request.identifier;
                break;
            case 'SEDOL':
                where.sedol = request.identifier;
                break;
            case 'TICKER':
                where.ticker = request.identifier;
                break;
            case 'BLOOMBERG':
                where.bloombergId = request.identifier;
                break;
            case 'RIC':
                where.refinitivRic = request.identifier;
                break;
            default:
                throw new Error(`Unsupported identifier type: ${request.identifierType}`);
        }
        return await this.prisma.instrumentMaster.findFirst({ where });
    }
    // Corporate Actions Management
    async processCorporateAction(request) {
        const validation = this.validateCorporateActionRequest(request);
        if (!validation.isValid) {
            throw new Error(`Corporate action validation failed: ${validation.errors.join(', ')}`);
        }
        // Verify instrument exists
        const instrument = await this.prisma.instrumentMaster.findFirst({
            where: {
                securityId: request.securityId,
                tenantId: request.tenantId
            }
        });
        if (!instrument) {
            throw new Error('Instrument not found');
        }
        const corporateAction = {
            securityId: request.securityId,
            tenantId: request.tenantId,
            actionType: request.actionType,
            actionCode: this.generateActionCode(request.actionType),
            description: this.generateActionDescription(request.actionType, request.actionDetails),
            announcementDate: request.announcementDate,
            exDate: request.exDate,
            recordDate: request.recordDate,
            payableDate: request.payableDate,
            actionDetails: request.actionDetails,
            status: 'ANNOUNCED',
            processingStatus: 'PENDING',
            dataSource: request.dataSource,
            createdAt: new Date(),
            updatedAt: new Date(),
            processedBy: request.processedBy
        };
        const created = await this.prisma.corporateAction.create({
            data: corporateAction
        });
        // Schedule processing based on ex-date
        await this.scheduleCorporateActionProcessing(created);
        await this.kafkaService.publishEvent('corporate-action-created', {
            corporateActionId: created.id,
            securityId: request.securityId,
            actionType: request.actionType,
            tenantId: request.tenantId,
            timestamp: new Date().toISOString()
        });
        return created;
    }
    async getCorporateActions(securityId, tenantId) {
        return await this.prisma.corporateAction.findMany({
            where: {
                instrumentId,
                tenantId
            },
            orderBy: { exDate: 'desc' }
        });
    }
    // Market Data Management
    async updateMarketData(securityId, marketData, tenantId) {
        const snapshot = {
            asOfDate: new Date(),
            asOfTime: new Date(),
            ...marketData,
            lastUpdated: new Date()
        };
        await this.prisma.marketDataSnapshot.upsert({
            where: {
                instrumentId_tenantId: {
                    instrumentId,
                    tenantId
                }
            },
            update: snapshot,
            create: {
                instrumentId,
                tenantId,
                ...snapshot
            }
        });
        await this.kafkaService.publishEvent('market-data-updated', {
            instrumentId,
            tenantId,
            marketData: snapshot,
            timestamp: new Date().toISOString()
        });
    }
    async getMarketData(securityId, tenantId) {
        return await this.prisma.marketDataSnapshot.findFirst({
            where: {
                instrumentId,
                tenantId
            }
        });
    }
    // Bulk Operations
    async bulkUpdateInstruments(request) {
        const results = {
            successful: [],
            failed: []
        };
        for (const update of request.instruments) {
            try {
                await this.updateInstrument({
                    securityId: update.securityId,
                    updates: update.updates,
                    tenantId: request.tenantId,
                    updatedBy: request.updatedBy
                });
                results.successful.push(update.securityId);
            }
            catch (error) {
                results.failed.push({
                    securityId: update.securityId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        await this.kafkaService.publishEvent('bulk-instrument-update-completed', {
            tenantId: request.tenantId,
            totalInstruments: request.instruments.length,
            successful: results.successful.length,
            failed: results.failed.length,
            updatedBy: request.updatedBy,
            timestamp: new Date().toISOString()
        });
        return results;
    }
    // Data Quality and Validation
    async validateInstrumentData(securityId, tenantId) {
        const instrument = await this.prisma.instrumentMaster.findFirst({
            where: { instrumentId, tenantId }
        });
        if (!instrument) {
            return {
                instrumentId,
                isValid: false,
                errors: ['Instrument not found'],
                dataQuality: 'POOR'
            };
        }
        const errors = [];
        const warnings = [];
        const suggestions = [];
        // Required field validation
        if (!instrument.name)
            errors.push('Instrument name is required');
        if (!instrument.instrumentType)
            errors.push('Instrument type is required');
        if (!instrument.securityType)
            errors.push('Security type is required');
        if (!instrument.issuerName)
            errors.push('Issuer name is required');
        if (!instrument.tradingCurrency)
            errors.push('Trading currency is required');
        // Identifier validation
        if (!instrument.cusip && !instrument.isin && !instrument.ticker) {
            errors.push('At least one primary identifier (CUSIP, ISIN, or ticker) is required');
        }
        if (instrument.cusip) {
            const cusipValidation = this.validateCUSIP(instrument.cusip);
            if (!cusipValidation.isValid) {
                errors.push(...cusipValidation.errors);
            }
        }
        if (instrument.isin) {
            const isinValidation = this.validateISIN(instrument.isin);
            if (!isinValidation.isValid) {
                errors.push(...isinValidation.errors);
            }
        }
        // Data freshness validation
        const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(instrument.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate > 30) {
            warnings.push('Instrument data is more than 30 days old');
        }
        if (daysSinceUpdate > 90) {
            suggestions.push('Consider updating instrument reference data');
        }
        // Business logic validation
        if (instrument.maturityDate && new Date(instrument.maturityDate) <= new Date()) {
            if (instrument.isActive) {
                warnings.push('Matured instrument is still marked as active');
            }
        }
        return {
            instrumentId,
            isValid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined,
            suggestions: suggestions.length > 0 ? suggestions : undefined,
            dataQuality: this.assessDataQuality(instrument)
        };
    }
    async generateDataQualityReport(securityId, tenantId) {
        const instrument = await this.prisma.instrumentMaster.findFirst({
            where: { instrumentId, tenantId }
        });
        if (!instrument) {
            throw new Error('Instrument not found');
        }
        const fieldQuality = {};
        const missingFields = [];
        const inconsistencies = [];
        const recommendations = [];
        // Assess field-level quality
        const requiredFields = ['name', 'instrumentType', 'securityType', 'issuerName', 'tradingCurrency'];
        requiredFields.forEach(field => {
            if (instrument[field]) {
                fieldQuality[field] = 'GOOD';
            }
            else {
                fieldQuality[field] = 'POOR';
                missingFields.push(field);
            }
        });
        // Check for inconsistencies
        if (instrument.instrumentType === 'BOND' && !instrument.maturityDate) {
            inconsistencies.push('Bond instrument missing maturity date');
        }
        if (instrument.securityType === 'MUTUAL_FUND' && instrument.primaryExchange) {
            inconsistencies.push('Mutual funds typically do not trade on exchanges');
        }
        // Generate recommendations
        if (missingFields.length > 0) {
            recommendations.push(`Complete missing required fields: ${missingFields.join(', ')}`);
        }
        if (inconsistencies.length > 0) {
            recommendations.push('Review and resolve data inconsistencies');
        }
        const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(instrument.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate > 30) {
            recommendations.push('Update instrument reference data from primary sources');
        }
        return {
            instrumentId,
            overallQuality: this.assessDataQuality(instrument),
            fieldQuality,
            missingFields,
            inconsistencies,
            lastValidated: new Date(),
            recommendations
        };
    }
    // Private helper methods
    async findInstrumentByIdentifiers(identifiers, tenantId) {
        const conditions = [];
        if (identifiers.cusip)
            conditions.push({ cusip: identifiers.cusip });
        if (identifiers.isin)
            conditions.push({ isin: identifiers.isin });
        if (identifiers.sedol)
            conditions.push({ sedol: identifiers.sedol });
        if (identifiers.ticker)
            conditions.push({ ticker: identifiers.ticker });
        if (conditions.length === 0)
            return null;
        return await this.prisma.instrumentMaster.findFirst({
            where: {
                tenantId,
                OR: conditions
            }
        });
    }
    validateInstrumentRequest(request) {
        const errors = [];
        if (!request.securityId)
            errors.push('Instrument ID is required');
        if (!request.name)
            errors.push('Instrument name is required');
        if (!request.instrumentType)
            errors.push('Instrument type is required');
        if (!request.securityType)
            errors.push('Security type is required');
        if (!request.issuerName)
            errors.push('Issuer name is required');
        if (!request.tradingCurrency)
            errors.push('Trading currency is required');
        if (!request.dataSource)
            errors.push('Data source is required');
        if (!request.tenantId)
            errors.push('Tenant ID is required');
        if (!request.createdBy)
            errors.push('Created by is required');
        // Validate identifiers
        if (request.identifiers.cusip) {
            const cusipValidation = this.validateCUSIP(request.identifiers.cusip);
            if (!cusipValidation.isValid) {
                errors.push(...cusipValidation.errors);
            }
        }
        if (request.identifiers.isin) {
            const isinValidation = this.validateISIN(request.identifiers.isin);
            if (!isinValidation.isValid) {
                errors.push(...isinValidation.errors);
            }
        }
        return {
            securityId: request.securityId,
            isValid: errors.length === 0,
            errors,
            dataQuality: 'UNVERIFIED'
        };
    }
    validateInstrumentUpdate(existing, updates) {
        const errors = [];
        const merged = { ...existing, ...updates };
        // Validate the merged result
        return this.validateInstrumentRequest(merged);
    }
    validateCorporateActionRequest(request) {
        const errors = [];
        if (!request.securityId)
            errors.push('Instrument ID is required');
        if (!request.actionType)
            errors.push('Action type is required');
        if (!request.announcementDate)
            errors.push('Announcement date is required');
        if (!request.exDate)
            errors.push('Ex-date is required');
        if (!request.recordDate)
            errors.push('Record date is required');
        if (!request.tenantId)
            errors.push('Tenant ID is required');
        if (!request.processedBy)
            errors.push('Processed by is required');
        // Date logic validation
        if (request.exDate && request.recordDate && new Date(request.exDate) > new Date(request.recordDate)) {
            errors.push('Ex-date cannot be after record date');
        }
        if (request.announcementDate && request.exDate && new Date(request.announcementDate) > new Date(request.exDate)) {
            errors.push('Announcement date cannot be after ex-date');
        }
        return {
            securityId: request.securityId,
            isValid: errors.length === 0,
            errors,
            dataQuality: 'UNVERIFIED'
        };
    }
    validateCUSIP(cusip) {
        const errors = [];
        if (cusip.length !== 9) {
            errors.push('CUSIP must be exactly 9 characters');
        }
        if (!/^[0-9A-Z]{9}$/.test(cusip)) {
            errors.push('CUSIP must contain only alphanumeric characters');
        }
        // Check digit validation
        let checkDigitValid = true;
        if (cusip.length === 9) {
            const checkDigit = this.calculateCUSIPCheckDigit(cusip.substring(0, 8));
            checkDigitValid = checkDigit === parseInt(cusip[8]);
            if (!checkDigitValid) {
                errors.push('CUSIP check digit is invalid');
            }
        }
        return {
            identifier: cusip,
            identifierType: 'CUSIP',
            isValid: errors.length === 0,
            checkDigitValid,
            formatValid: /^[0-9A-Z]{9}$/.test(cusip) && cusip.length === 9,
            errors
        };
    }
    validateISIN(isin) {
        const errors = [];
        if (isin.length !== 12) {
            errors.push('ISIN must be exactly 12 characters');
        }
        if (!/^[A-Z]{2}[0-9A-Z]{9}[0-9]$/.test(isin)) {
            errors.push('ISIN format must be 2 letters + 9 alphanumeric + 1 digit');
        }
        // Check digit validation (Luhn algorithm)
        let checkDigitValid = true;
        if (isin.length === 12) {
            checkDigitValid = this.validateISINCheckDigit(isin);
            if (!checkDigitValid) {
                errors.push('ISIN check digit is invalid');
            }
        }
        return {
            identifier: isin,
            identifierType: 'ISIN',
            isValid: errors.length === 0,
            checkDigitValid,
            formatValid: /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/.test(isin) && isin.length === 12,
            errors
        };
    }
    calculateCUSIPCheckDigit(cusipBase) {
        const weights = [1, 2, 1, 2, 1, 2, 1, 2];
        let sum = 0;
        for (let i = 0; i < 8; i++) {
            let char = cusipBase[i];
            let value;
            if (char >= '0' && char <= '9') {
                value = parseInt(char);
            }
            else {
                value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
            }
            let product = value * weights[i];
            sum += Math.floor(product / 10) + (product % 10);
        }
        return (10 - (sum % 10)) % 10;
    }
    validateISINCheckDigit(isin) {
        // Convert letters to numbers and create digit string
        let digitString = '';
        for (let i = 0; i < 11; i++) {
            let char = isin[i];
            if (char >= 'A' && char <= 'Z') {
                digitString += (char.charCodeAt(0) - 'A'.charCodeAt(0) + 10).toString();
            }
            else {
                digitString += char;
            }
        }
        // Apply Luhn algorithm
        let sum = 0;
        let alternate = false;
        for (let i = digitString.length - 1; i >= 0; i--) {
            let digit = parseInt(digitString[i]);
            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            alternate = !alternate;
        }
        const calculatedCheckDigit = (10 - (sum % 10)) % 10;
        return calculatedCheckDigit === parseInt(isin[11]);
    }
    assessDataQuality(instrument) {
        let score = 100;
        // Required fields check
        const requiredFields = ['name', 'instrumentType', 'securityType', 'issuerName', 'tradingCurrency'];
        const missingRequired = requiredFields.filter(field => !instrument[field]);
        score -= missingRequired.length * 20;
        // Identifier check
        const identifiers = ['cusip', 'isin', 'ticker'];
        const hasIdentifier = identifiers.some(id => instrument[id]);
        if (!hasIdentifier)
            score -= 30;
        // Data freshness
        if (instrument.lastUpdated) {
            const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(instrument.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceUpdate > 30)
                score -= 10;
            if (daysSinceUpdate > 90)
                score -= 20;
        }
        if (score >= 90)
            return 'EXCELLENT';
        if (score >= 75)
            return 'GOOD';
        if (score >= 50)
            return 'FAIR';
        if (score >= 25)
            return 'POOR';
        return 'UNVERIFIED';
    }
    generateActionCode(actionType) {
        const codes = {
            'DIVIDEND': 'DIV',
            'STOCK_SPLIT': 'SPL',
            'STOCK_DIVIDEND': 'SDIV',
            'RIGHTS_OFFERING': 'RGHT',
            'SPINOFF': 'SPIN',
            'MERGER': 'MERG',
            'ACQUISITION': 'ACQ',
            'TENDER_OFFER': 'TEND',
            'LIQUIDATION': 'LIQ',
            'BANKRUPTCY': 'BANK',
            'DELISTING': 'DELIST',
            'NAME_CHANGE': 'NAME',
            'TICKER_CHANGE': 'TICK',
            'INTEREST_PAYMENT': 'INT',
            'PRINCIPAL_PAYMENT': 'PRIN',
            'CALL': 'CALL',
            'PUT': 'PUT',
            'MATURITY': 'MAT'
        };
        return codes[actionType] || 'OTHER';
    }
    generateActionDescription(actionType, details) {
        switch (actionType) {
            case 'DIVIDEND':
                return `Dividend payment of ${details.dividendAmount || 'TBD'} ${details.dividendCurrency || 'USD'}`;
            case 'STOCK_SPLIT':
                return `Stock split ${details.newShares || 'N'}:${details.oldShares || 'M'}`;
            case 'MERGER':
                return `Merger with ${details.acquiringInstrumentId || 'TBD'}`;
            default:
                return `${actionType.replace('_', ' ').toLowerCase()} corporate action`;
        }
    }
    async scheduleCorporateActionProcessing(action) {
        // This would integrate with a job scheduler like Bull or Agenda
        // For now, we'll just publish an event
        await this.kafkaService.publishEvent('corporate-action-scheduled', {
            corporateActionId: action.id,
            securityId: action.securityId,
            exDate: action.exDate,
            actionType: action.actionType,
            processingRequired: new Date(action.exDate) <= new Date(),
            timestamp: new Date().toISOString()
        });
    }
}
exports.InstrumentReferenceDataService = InstrumentReferenceDataService;
