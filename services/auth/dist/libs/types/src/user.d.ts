import { AuditableEntity, EntityStatus } from './common';
import { Role } from './auth';
export interface User extends AuditableEntity {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status: EntityStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLoginAt?: Date;
    passwordChangedAt: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    mfaEnabled: boolean;
    mfaSecret?: string;
    preferences: UserPreferences;
    profile: UserProfileData;
}
export interface UserPreferences {
    language: string;
    timezone: string;
    dateFormat: string;
    numberFormat: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: NotificationPreferences;
}
export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    portfolio: boolean;
    trading: boolean;
    compliance: boolean;
    system: boolean;
}
export interface UserProfileData {
    title?: string;
    department?: string;
    location?: string;
    bio?: string;
    avatar?: string;
    socialLinks?: Record<string, string>;
}
export interface UserRole extends AuditableEntity {
    userId: string;
    role: Role;
    name: string;
    isActive: boolean;
    expiresAt?: Date;
    assignedBy: string;
}
export interface UserPermission extends AuditableEntity {
    userId: string;
    permission: string;
    name: string;
    resource?: string;
    isActive: boolean;
    expiresAt?: Date;
    assignedBy: string;
}
export interface CreateUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roles: Role[];
    sendInvite?: boolean;
    temporaryPassword?: string;
}
export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: EntityStatus;
    preferences?: Partial<UserPreferences>;
    profile?: Partial<UserProfileData>;
}
export interface UserInvitation extends AuditableEntity {
    email: string;
    firstName: string;
    lastName: string;
    roles: Role[];
    invitedBy: string;
    token: string;
    expiresAt: Date;
    acceptedAt?: Date;
    status: InvitationStatus;
}
export declare enum InvitationStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
