# 💳 SmartExpense Tracker - Setup Guide

### 🌐 Live Links
- **Production Web App**: [https://yoursmartexpense.netlify.app/](https://yoursmartexpense.netlify.app/)
- **Backend API Swagger**: [https://happy-charisma-production.up.railway.app/api/swagger-ui/index.html#/](https://happy-charisma-production.up.railway.app/api/swagger-ui/index.html#/)

This application is built with **React 19**, **Vite**, **Tailwind CSS**, and **Motion**. It is designed to work as a mobile-first web application.

## 🚀 Local Setup Instructions

Follow these steps to get the application running on your local machine using VS Code.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Version 18.0 or higher recommended)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/) (Optional, for cloning)

### 2. Installation
1. Open the project folder in VS Code.
2. Open the integrated terminal (`Ctrl + ` ` or `Terminal > New Terminal`).
3. Install the dependencies:
   ```bash
   npm install
   ```

### 3. Environment Configuration
1. Create a `.env` file in the root directory.
2. Add your Gemini API Key (required for AI insights):
   ```env
   VITE_GEMINI_API_KEY="your_api_key_here"
   ```
   *Note: If you are running the backend on a different port than 8080, update the API_BASE in `src/services/apiService.ts`.*

### 4. Running the Application
Start the development server:
```bash
npm run dev
```
By default, the application will be available at `http://localhost:3000`.

### 5. Backend Requirement ⚠️
This frontend application is configured to connect to the **Spring Boot Backend** running at `https://happy-charisma-production.up.railway.app`. 
- Ensure your backend server is running and the database is accessible.
- If you want to use a local backend, update the `API_BASE` constant in `src/services/apiService.ts`.

---

## 📱 Install as a Mobile App (Fastest Way)

You don't actually need an APK to install this on your phone! This app is a **Progressive Web App (PWA)**, which means you can install it directly from your browser. It will look and feel like a native app (no browser tabs, home screen icon, splash screen).

### 🤖 For Android
1. Open the [App URL](https://yoursmartexpense.netlify.app/) in **Google Chrome**.
2. Tap the **three-dot menu** (⋮) at the top right.
3. Select **"Install app"** or **"Add to Home screen"**.
4. The SmartExpense icon will now appear on your home screen.

### 🍏 For iPhone (iOS)
1. Open the [App URL](https://yoursmartexpense.netlify.app/) in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.

---

## 🏗️ Generating Native Apps (Android & iOS)

Building native binaries requires platform-specific SDKs. Follow these steps on a machine with the required tools installed.

### 1. Requirements
- **All Platforms:** [Node.js](https://nodejs.org/) installed.
- **For Android APK/AAB:** [Android Studio](https://developer.android.com/studio) installed with SDK Build-Tools.
- **For iOS App:** [Xcode](https://developer.apple.com/xcode/) installed (Requires **macOS**).

### 2. Prepare the Project
Run these commands in the root directory to compile the web code and sync it with the native projects:
```bash
npm install
npm run build
npx cap sync
```

### 3. Generate Android APK
1. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```
2. **Build the APK:** 
   In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. **Locate APK:** 
   Once finished, click the "Locate" popup. The file is usually at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Generate iOS App (macOS only)
1. **Add iOS Platform** (if not already added):
   ```bash
   npx cap add ios
   ```
2. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```
3. **Build the App:**
   - Select your target device (or Generic iOS Device).
   - Go to **Product > Archive**.
   - After archiving, use the **Distribute App** button to export an `.ipa` file.

### 🌐 Deploy to Netlify
1.  **Preparation**: I have already added a `netlify.toml` and `public/_redirects` file to the project root.
2.  **Deployment Steps**:
    *   Push your project code to **GitHub** or **GitLab**.
    *   Log in to your **Netlify** dashboard.
    *   Click **"Add new site"** and select **"Import an existing project"**.
    *   Connect your repository provider and select this project.
    *   Settings will be auto-detected:
        *   **Build Command**: `npm run build`
        *   **Publish directory**: `dist`
    *   Click **Deploy Site**.
3.  **Result**: Your app will be accessible via a high-speed global URL.

### 🎨 Customizing the App Icon
To replace the default Android/Capacitor icon with the **SmartExpense** logo:
1. **Android:** 
   - Right-click the `app` folder in Android Studio -> **New > Image Asset**.
   - Set **Foreground Layer** to "Text" (type "SE") or upload your logo image.
   - Set **Background Layer** color to `#FFFFFF`.
2. **iOS:**
   - In Xcode, open `App/App/Assets.xcassets`.
   - Drag and drop your logo images into the `AppIcon` slots.

---

## ✨ Key Features
- **Authentication**: JWT-based Login and Registration with Gender-specific avatars.
- **Dashboard**: Real-time spending overview with animated counters and category charts.
- **Transactions**: Full CRUD for expenses with advanced search and category filtering.
- **AI Insights**: Dynamic spending forecasts and personalized recommendations.
- **Native Polish**: Integrated Haptics and custom Toast notifications for a premium feel.
- **Reporting**: Monthly growth comparison charts and data export (Excel/PDF).
- **Responsive UI**: Glassmorphism navigation and high-performance Skeleton loading.

## 📁 Project Structure
- `src/pages/`: Contains all main application screens (Dashboard, Login, etc.)
- `src/services/`: API integration and communication logic.
- `src/context/`: Auth state management.
- `src/components/`: Reusable UI components and layout shells.
- `src/types/`: TypeScript interfaces for API data.
