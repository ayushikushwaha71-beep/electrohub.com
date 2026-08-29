# ElectroHub UI Master Specification

## Goal

Build only the **UI** of a premium electronics e-commerce platform
inspired by Robu.in, Mouser, DigiKey and Amazon Electronics.

No backend. No APIs. Use realistic mock data.

## Tech Stack

-   Next.js 15
-   React 19
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   Framer Motion
-   React Hook Form
-   Zod
-   Axios (prepared for future integration)
-   TanStack Query
-   Swiper.js
-   Sonner
-   TanStack Table
-   Lucide React

## Theme

-   Light + Dark mode
-   Premium modern design
-   Responsive (mobile/tablet/desktop)
-   Reusable components only

## Required Pages

-   Landing/Home
-   Categories
-   Product Listing
-   Product Details
-   Search Results
-   Wishlist
-   Cart
-   Checkout
-   Order Success
-   Login
-   Signup
-   Forgot Password
-   Profile
-   Orders
-   Addresses
-   Notifications
-   Admin Dashboard
-   Product Management
-   Category Management
-   Brand Management
-   Inventory
-   Analytics

## Shopping Experience

-   Add to Cart
-   Buy Now
-   Wishlist
-   Compare
-   Quantity selector
-   Product zoom
-   Related products
-   Frequently bought together
-   Reviews
-   Ratings
-   Breadcrumbs
-   Pagination
-   Skeleton loaders
-   Empty states

## Product Dataset

Create realistic mock data with: - Arduino (15 products) - Raspberry Pi
(10 products) - ESP32 / ESP8266 (15 products) - Sensors (30 products) -
Motors (20 products) - Displays (15 products) - Power Modules (15
products) - Tools & Accessories (20 products) - Robotics Kits (15
products)

Each product must include: - Product Name - Brand - Category - SKU -
Selling Price - Original Price - Discount - Stock - Rating - Review
Count - Short Description - Full Description - Technical
Specifications - Features - Applications - Package Includes - 4--6
High-quality placeholder images - Related Products

## UI Quality

-   Premium Apple-like spacing
-   Amazon-style shopping flow
-   Mouser-style technical specifications
-   Clean typography
-   Smooth animations
-   Accessible components
-   Consistent design system
-   Production-ready component architecture

## Folder Structure

frontend/ app/ components/ features/ hooks/ lib/ services/ types/ utils/
assets/

## Rules

-   Do not redesign existing components.
-   Reuse Navbar, Footer, Buttons, Cards and Product components.
-   Maintain one design system throughout.
-   No lorem ipsum.
-   Use realistic electronics content.
-   Build UI only.
