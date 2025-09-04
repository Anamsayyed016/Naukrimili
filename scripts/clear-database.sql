-- Server Database Cleanup SQL Script
-- This script clears all users and related data from the production database

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all tables in the correct order to respect foreign key constraints
DELETE FROM JobApplication;
DELETE FROM Job;
DELETE FROM Company;
DELETE FROM Resume;
DELETE FROM Notification;
DELETE FROM User;
DELETE FROM Account;
DELETE FROM Session;
DELETE FROM VerificationToken;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment counters
ALTER TABLE User AUTO_INCREMENT = 1;
ALTER TABLE Job AUTO_INCREMENT = 1;
ALTER TABLE Company AUTO_INCREMENT = 1;
ALTER TABLE Resume AUTO_INCREMENT = 1;
ALTER TABLE JobApplication AUTO_INCREMENT = 1;
ALTER TABLE Notification AUTO_INCREMENT = 1;
