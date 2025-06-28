# eForms GPP UI

The GPP User Interface (UI) provides an intuitive workflow that helps users identify and apply Green Public Procurement (GPP) criteria to their eForms notices. This tool streamlines the process of making public procurement more sustainable by automatically analyzing notices and suggesting relevant environmental criteria.

The application is built around the functionalities exposed by the [GPP Service](https://github.com/uritrejo/eforms-gpp-service), which imports its key functionalities from the [GPP Library](https://github.com/uritrejo/eforms-gpp-library).
All of these tools are built to work together but not only. Any of the pieces may be used to extend the features of any given e-Procurement platform.

??++ TODO: add screenshot

## 🌱 Features

-   **XML Contract Notice Upload**: Upload and preview eForms XML notices
-   **Analysis**: Automatically identify relevant GPP documents and criteria
-   **Criteria Selection**: Choose from suggested GPP criteria with detailed information
-   **Patch Management**: Select and apply XML patches to integrate GPP criteria
-   **Notice Validation**: Validate the modified notice for compliance with the TED API
-   **Visual Preview**: Preview rendered notices before and after applying changes
-   **Export Functionality**: Download patched notices and validation reports

## 🚀 Getting Started

### Prerequisites

-   Node.js (version 16 or higher)
-   npm or yarn
-   A running eForms GPP Service (default: `http://localhost:4420`). For more details see [GPP Service](https://github.com/uritrejo/eforms-gpp-service).

### Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd eforms-gpp-UI
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:5173`

### Backend Configuration

The application expects a GPP Service backend API running on `http://localhost:4420`. In particular, it requires the following endpoints:

-   `POST /api/v1/analyze-notice` - Analyze uploaded notice
-   `POST /api/v1/suggest-patches` - Suggest GPP patches
-   `POST /api/v1/apply-patches` - Apply selected patches
-   `POST /api/v1/validate-notice` - Validate modified notice
-   `POST /api/v1/visualize-notice` - Render notice

## 🛠️ Technology Stack

-   **Frontend Framework**: React 19.1.0
-   **Build Tool**: Vite 6.3.5
-   **UI Library**: Material-UI (MUI) 7.1.1
-   **Styling**: CSS with Material-UI theming
-   **Linting**: ESLint with React-specific rules

## 📋 Usage Workflow

### Step 1: Upload Notice

1. Click "Select XML File" to upload your eForms XML notice
2. Preview the uploaded XML content
3. Optionally preview the rendered notice
4. Click "Analyze Notice" to proceed

### Step 2: Select Criteria

1. Review relevant GPP documents found by the analysis
2. Browse suggested GPP criteria with detailed information
3. Select criteria you want to apply to your notice
4. Click "Suggest Patches" to generate XML modifications

### Step 3: Select Patches

1. Review the suggested XML patches
2. View detailed information about each patch
3. Select which patches to apply
4. Click "Apply Patches" to modify your notice

### Step 4: Review & Download

1. Preview the patched XML notice
2. Render and preview the final notice
3. Validate the notice for compliance
4. Download the patched notice and validation reports

??++ TODO: Add screenshot

## 🎨 UI Design

The application features a sustainability-focused design with:

-   **Green color palette**: Reflecting environmental themes
-   **Step-by-step workflow**: Clear progression through the GPP application process

??++ TODO: ADD PICS

## 🧪 Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run preview` - Preview production build
-   `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory to customize settings:

```env
VITE_API_BASE_URL=http://localhost:4420
```

### API Configuration

The API base URL is currently hardcoded in the application. To modify it, update the fetch URLs in `src/App.jsx`.

## 📝 License

This project is part of a thesis work on Green Public Procurement and eForms integration.

## 🐛 Troubleshooting

### Common Issues

1. **Backend not running**: Ensure the eForms GPP backend API is running on the expected port
2. **CORS errors**: Configure your backend to allow requests from the frontend domain

### Debug Tips

-   Check the browser console for JavaScript errors
-   Verify network requests in the browser's Developer Tools
-   Ensure all dependencies are properly installed

## Running in development

npm run dev

## 🎓 Academic Context

This library was developed as part of research at **Politecnico di Milano** focusing on the digitalization and automation of Green Public Procurement processes. It aims to bridge the gap between environmental policy and practical procurement implementation.
