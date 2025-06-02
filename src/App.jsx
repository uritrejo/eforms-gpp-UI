import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

// ??++ AQUI
const steps = ["Upload Notice", "Patch", "Download"];

function App() {
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState("Waiting for file...");
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileSnippet, setFileSnippet] = useState("");
    const [fileContent, setFileContent] = useState(""); // Store full file content

    const SNIPPET_LENGTH = 2000;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setStatus(`Loaded file: ${file.name}`);

            // Read file and set snippet and content
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                setFileSnippet(text.slice(0, SNIPPET_LENGTH));
                setFileContent(text);
            };
            reader.readAsText(file);
        }
    };

    const handleAreaClick = () => {
        document.getElementById("file-input").click();
    };

    // Handler for Analyze Notice button
    const handleAnalyzeNotice = async () => {
        if (!fileContent) return;
        try {
            // TODO: move this URL to a config file
            const response = await fetch("http://localhost:4420/api/v1/analyze-notice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/xml",
                },
                body: fileContent,
            });
            const text = await response.text();
            console.log("API response:", text);
            alert("API response:\n" + text);
        } catch (err) {
            console.error("API error:", err);
            alert("API error: " + err.message);
        }
    };

    return (
        <div className="homepage-container">
            <h1>eForms GPP UI</h1>
            <div className="logo-area">
                <img src={reactLogo} alt="App Logo" className="app-logo" />
            </div>
            <p className="description">Identify GPP criteria and apply them to your eForm notice.</p>
            {/* Material UI Stepper */}
            <Box sx={{ width: "100%", mb: 3 }}>
                <Tabs value={step} onChange={(_, newValue) => setStep(newValue)} centered variant="fullWidth">
                    {steps.map((label, idx) => (
                        <Tab key={label} label={`STEP ${idx + 1}: ${label}`} />
                    ))}
                </Tabs>
            </Box>
            {/* Step Content */}
            {step === 0 ? (
                <>
                    <h2>Upload Your eForm Notice</h2>
                    <div className="upload-area">
                        <input
                            id="file-input"
                            type="file"
                            accept=".xml"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <Button variant="contained" color="primary" onClick={handleAreaClick} sx={{ mt: 2, mb: 1 }}>
                            Select XML File
                        </Button>
                    </div>
                    <Alert
                        severity={selectedFile ? "success" : "info"}
                        sx={{
                            mt: 2,
                            maxWidth: 350,
                            mx: "auto",
                            backgroundColor: selectedFile ? "success.lighter" : "info.lighter",
                            color: selectedFile ? "success.dark" : "info.dark",
                            boxShadow: "none",
                            border: "1px solid #e0e0e0",
                            fontSize: "1rem",
                        }}
                    >
                        {status}
                    </Alert>
                    {fileSnippet && (
                        <>
                            <Box
                                sx={{
                                    mt: 2,
                                    maxWidth: 500,
                                    mx: "auto",
                                    textAlign: "center",
                                    fontWeight: 400,
                                    color: "#888",
                                    fontSize: "0.95rem",
                                    letterSpacing: 1,
                                }}
                            >
                                Preview:
                            </Box>
                            <Box
                                sx={{
                                    mt: 0.5,
                                    maxWidth: 500,
                                    mx: "auto",
                                    background: "#f8f8f8",
                                    borderRadius: 1,
                                    p: 2,
                                    fontFamily: "monospace",
                                    fontSize: "0.4rem",
                                    color: "#444",
                                    overflowX: "auto",
                                    border: "1px solid #e0e0e0",
                                    textAlign: "left",
                                }}
                            >
                                <pre style={{ margin: 0, whiteSpace: "pre-wrap", textAlign: "left" }}>
                                    {fileSnippet}
                                    {fileSnippet.length === SNIPPET_LENGTH && (
                                        <>
                                            {"\n\n"}
                                            <span style={{ color: "#888", fontSize: "0.6rem" }}>...</span>
                                            {"\n"}
                                            <span style={{ color: "#888", fontSize: "0.6rem" }}>...</span>
                                            {"\n"}
                                            <span style={{ color: "#888", fontSize: "0.6rem" }}>...</span>
                                        </>
                                    )}
                                </pre>
                            </Box>
                            <Button variant="contained" color="success" sx={{ mt: 2 }} onClick={handleAnalyzeNotice}>
                                Analyze Notice
                            </Button>
                        </>
                    )}
                </>
            ) : (
                <div className="dummy-page">
                    <h2>{`STEP ${step + 1}: ${steps[step]}`}</h2>
                    <p>This is a placeholder for the {steps[step]} step.</p>
                </div>
            )}
        </div>
    );
}

export default App;
