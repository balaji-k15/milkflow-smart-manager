import { z } from "zod";

// Auth validation schemas
export const authPhoneSchema = z.string()
  .trim()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be less than 15 digits")
  .regex(/^[0-9+()-\s]+$/, "Phone number can only contain digits, +, -, (), and spaces");

export const authPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be less than 72 characters");

export const authFullNameSchema = z.string()
  .trim()
  .min(1, "Full name is required")
  .max(100, "Full name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes");

// Supplier validation schemas
export const supplierCodeSchema = z.string()
  .trim()
  .min(1, "Supplier code is required")
  .max(20, "Supplier code must be less than 20 characters")
  .regex(/^[A-Z0-9-]+$/, "Supplier code can only contain uppercase letters, numbers, and hyphens");

export const supplierNameSchema = z.string()
  .trim()
  .min(1, "Supplier name is required")
  .max(100, "Supplier name must be less than 100 characters");

export const supplierPhoneSchema = z.string()
  .trim()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be less than 15 digits")
  .regex(/^[0-9+()-\s]+$/, "Phone number can only contain digits, +, -, (), and spaces");

export const supplierAddressSchema = z.string()
  .trim()
  .max(200, "Address must be less than 200 characters")
  .optional();

// Milk collection validation schemas
export const quantityLitersSchema = z.number()
  .positive("Quantity must be positive")
  .max(10000, "Quantity must be less than 10,000 liters")
  .multipleOf(0.01, "Quantity can have at most 2 decimal places");

export const fatPercentageSchema = z.number()
  .min(0, "Fat percentage cannot be negative")
  .max(100, "Fat percentage cannot exceed 100%")
  .multipleOf(0.01, "Fat percentage can have at most 2 decimal places")
  .optional();

export const ratePerLiterSchema = z.number()
  .positive("Rate must be positive")
  .max(1000, "Rate must be less than 1,000")
  .multipleOf(0.01, "Rate can have at most 2 decimal places");

export const notesSchema = z.string()
  .trim()
  .max(500, "Notes must be less than 500 characters")
  .optional();

// Combined schemas for forms
export const signUpSchema = z.object({
  phone: authPhoneSchema,
  password: authPasswordSchema,
  fullName: authFullNameSchema,
  role: z.enum(['admin', 'supplier'])
});

export const signInSchema = z.object({
  phone: authPhoneSchema,
  password: authPasswordSchema
});

export const addSupplierSchema = z.object({
  supplierCode: supplierCodeSchema,
  fullName: supplierNameSchema,
  phone: supplierPhoneSchema,
  address: supplierAddressSchema
});

export const addCollectionSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID"),
  quantityLiters: quantityLitersSchema,
  fatPercentage: fatPercentageSchema,
  ratePerLiter: ratePerLiterSchema,
  notes: notesSchema
});
