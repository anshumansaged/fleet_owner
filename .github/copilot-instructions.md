# Fleet Management System - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a full-stack fleet management system built with Next.js, TypeScript, and MongoDB Atlas. The system manages driver earnings, expenses, cash flow, and salary calculations for a fleet of drivers.

## Key Features
- Driver management with percentage-based salary calculations
- Trip tracking across multiple platforms (Uber, InDrive, Yatri, Rapido, offline)
- Expense and cash flow management
- Real-time data synchronization with MongoDB Atlas
- WhatsApp-ready reporting
- Cashier management with owner authentication

## Driver Configuration
- Vivek: 30% commission
- Preetam: 35% commission
- Chhotelal: 35% commission
- Vikash Yadav: 35% commission

## Technical Stack
- Next.js 15 with App Router
- TypeScript for type safety
- MongoDB Atlas for data persistence
- Tailwind CSS for styling
- Vercel for deployment

## Code Guidelines
- Use TypeScript for all files
- Follow Next.js App Router patterns
- Implement proper error handling
- Use MongoDB aggregation pipelines for complex calculations
- Ensure real-time data updates
- Maintain clear separation between frontend and API logic
