# SWYF - See What You Fit

<p align="center">
  <img src="assets/media/swyf%20logo.png" alt="SWYF Logo" width="300">
</p>

<p align="center">



https://github.com/user-attachments/assets/68d27621-7a3a-4ef0-a6d4-214ab26e8237






> [!TIP]
> This project is currently in its initial development phase. Core features are functional but may contain bugs. Please report any issues through our issue tracker.

SWYF is an innovative AI-powered virtual try-on platform that revolutionizes online fashion shopping, allowing users to visualize how clothes will look on them before making a purchase.

## 📋 Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Rewards System](#rewards-system)
- [Development Log](#development-log)
- [Current Status](#current-status)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## ✨ Features

- 👔 **Virtual Try-On**: Try clothing items virtually in real-time using AI technology
- 🎨 **Skin Tone Analysis**: Get personalized color recommendations based on your skin tone
- 🏆 **Rewards Program**: Earn tokens for interactions with the platform
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode Support**: Enhanced viewing experience with full dark mode support
- 🔄 **Interactive 3D Background**: Engaging user experience with interactive Spline 3D elements

## 🎬 Demo

Watch our demo video to see SWYF in action! The demo showcases the virtual try-on experience, color analysis, user interaction with 3D elements, and our rewards system.

## 🏗️ Project Structure

```
swyf/
├── frontend/                    # React frontend application
│   ├── src/                     # Source code
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── contexts/            # React contexts (Theme, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   ├── App.tsx              # Main application component
│   │   └── ...                  # Other React files
│   ├── public/                  # Public assets
│   ├── package.json             # Node.js dependencies
│   └── ...                      # Configuration files
│
├── services/                    # Backend services
│   ├── virtual-tryon/           # Virtual try-on service
│   │   ├── app/                 # Flask application modules
│   │   ├── static/              # Static assets
│   │   │   ├── assets/          # Image assets
│   │   │   └── react-app/       # Built React app
│   │   ├── templates/           # HTML templates
│   │   └── flasktry.py          # Main Flask application
│   │
│   └── skin-tone/               # Skin tone analysis service
│       ├── src/                 # Source code
│       ├── tests/               # Unit tests
│       └── docs/                # Documentation
│
├── assets/                      # Shared assets
│   └── ...                      # Other image assets
│
├── docs/                        # Project documentation
│   └── ...                      # Documentation files
│
└── README.md                    # Project documentation
```

# Implementation
<img width="383" height="491" alt="image" src="https://github.com/user-attachments/assets/9902f69b-6200-4d59-8765-56294ec82ace" />


## 📸 Screenshots of site

> **Note:** These are early prototype screenshots. The UI is evolving daily as we develop the platform.

### Projects
![Projects](assets/projects.png)
*AI-driven skin tone detection with virtual try-on for customized outfit suggestions*

### Rewards System
![Rewards Page](assets/rewards.png)
*Track your rewards journey and earn tokens for platform interactions*

### Business Model
![Business Model](assets/businessmodel.png)
*Augmented Reality try-on platform for mobile devices, offering B2C personalization and B2B integration for brands and retailers*

## 🛠️ Technologies Used

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Shadcn/ui for UI components
- Lucide React for icons
- TanStack Query for data fetching
- Spline for 3D interactive backgrounds
- Context API for state management

### Backend
- Flask (Python)
- OpenCV for image processing
- TensorFlow/PyTorch for AI models
- RESTful API design

## 🚀 Installation

> **Note:** Installation steps are evolving as the project develops. Check back for updates.

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- pip
- Git

### Setup

1. Clone the repository:
```bash
git clone 
cd swyf
```

2. Set up the virtual try-on service:
```bash
cd services/virtual-tryon
pip install -r requirements.txt
```

3. Set up the skin tone analysis service:
```bash
cd ../skin-tone
pip install -r requirements.txt
```

4. Set up the frontend:
```bash
cd ../../frontend
npm install
```

5. Build the frontend:
```bash
npm run build
```

6. Copy the built files to the Flask static directory:
```bash
cp -r dist/* ../services/virtual-tryon/static/react-app/
```

## 💻 Usage

1. Start the virtual try-on service:
```bash
cd services/virtual-tryon
python flasktry.py
```

2. For development of the frontend:
```bash
cd frontend
npm run dev
```

3. Access the application:
   - Main application: `http://localhost:5000`
   - Development server: `http://localhost:3000`

## 🏆 Rewards System

Our rewards program offers:

- **SWYF Tokens**: Earn tokens for every interaction with the platform
- **Progress Tracking**: Track your rewards journey
- **Exclusive Benefits**: Unlock discounts, early access, and special features
- **Multi-level Rewards**: Progress through different levels to earn more benefits

## 🚧 Current Status

### What's Working
- ✅ Flask backend serving React frontend
- ✅ Dark mode toggle and theming throughout the application
- ✅ Basic 3D backgrounds using Spline
- ✅ Product catalog browsing
- ✅ Responsive UI for mobile and desktop
- ✅ Theme-aware components with proper contrast

### In Progress
- 🔄 Optimizing 3D element performance
- 🔄 Enhancing error handling for assets
- 🔄 Building FAQ sections
- 🔄 Implementing business model page

### Coming Soon
- ⏳ User authentication
- ⏳ Complete virtual try-on implementation

## 🙏 Acknowledgements

SWYF is built using several open-source technologies and services. We would like to acknowledge and thank the following:

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Spline](https://spline.design/) - 3D design and interactive elements
- [Shadcn/ui](https://ui.shadcn.com/) - Re-usable UI components
- [Flask](https://flask.palletsprojects.com/) - Python web framework
- [OpenCV](https://opencv.org/) - Open Source Computer Vision Library
- [TensorFlow](https://www.tensorflow.org/) - Open-source machine learning framework
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons
- [Vite](https://vitejs.dev/) - Next generation frontend tooling.


## 📄 License

SWYF is proprietary software. All rights reserved.

© 2026 SWYF - See What You Fit 
