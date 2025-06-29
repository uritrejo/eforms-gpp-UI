import { useState } from "react";
import "./App.css";
import SustainabilityIcon from "./components/SustainabilityIcon";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";

const steps = ["Upload Notice", "Select Criteria", "Select Patches", "Review & Download"];

function App() {
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState("Waiting for file...");
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileSnippet, setFileSnippet] = useState("");
    const [fileContent, setFileContent] = useState(""); // Store full file content
    const [analyzeResponse, setAnalyzeResponse] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCriteria, setSelectedCriteria] = useState([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsItem, setDetailsItem] = useState(null);
    const [patchDialogOpen, setPatchDialogOpen] = useState(false);
    const [patchDialogMsg, setPatchDialogMsg] = useState("");

    // --- Add state for apply patches dialog at the top of App ---
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [applyDialogMsg, setApplyDialogMsg] = useState("");

    // --- Add these states at the top of your App component ---
    const [suggestedPatches, setSuggestedPatches] = useState([]);
    const [selectedPatches, setSelectedPatches] = useState([]);
    const [patchDetailsOpen, setPatchDetailsOpen] = useState(false);
    const [patchDetailsItem, setPatchDetailsItem] = useState(null);
    const [patchedXml, setPatchedXml] = useState(""); // Add this state
    const [diffModalOpen, setDiffModalOpen] = useState(false);
    const [renderDialogOpen, setRenderDialogOpen] = useState(false);
    const [renderHtml, setRenderHtml] = useState("");
    const [renderLoading, setRenderLoading] = useState(false);
    const [renderError, setRenderError] = useState("");
    const [renderResult, setRenderResult] = useState(null); // New state for visualization response

    // Add these new states for validation
    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [validationLoading, setValidationLoading] = useState(false);

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
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    noticeXml: fileContent,
                }),
            });
            const text = await response.text();
            setAnalyzeResponse(text);
            setDialogOpen(true);
        } catch (err) {
            setAnalyzeResponse("API error: " + err.message);
            setDialogOpen(true);
        }
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    // Helper function to change step and scroll to top
    const changeStep = (newStep) => {
        setStep(newStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleNextStep = () => {
        setDialogOpen(false);
        changeStep(1); // Move to "Select Criteria"
    };

    // Handler for viewing details
    const handleViewDetails = (item) => {
        setDetailsItem(item);
        setDetailsOpen(true);
    };

    const handleDetailsClose = () => {
        setDetailsOpen(false);
        setDetailsItem(null);
    };

    // Parse analyzeResponse as JSON if on step 1
    let parsedResponse = null;
    if (step === 1 && analyzeResponse) {
        try {
            parsedResponse = JSON.parse(analyzeResponse);
        } catch {
            parsedResponse = null;
        }
    }

    // Handler for selecting/deselecting criteria
    const handleToggleCriterion = (id) => {
        setSelectedCriteria((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    };

    // Handler for Suggest Patches button
    const handleSuggestPatches = async () => {
        if (!fileContent || !parsedResponse) return;
        const selectedCriteriaObjs =
            parsedResponse.suggestedGppCriteria?.filter((crit) => selectedCriteria.includes(crit.id)) || [];
        try {
            const response = await fetch("http://localhost:4420/api/v1/suggest-patches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    noticeXml: fileContent,
                    criteria: selectedCriteriaObjs,
                }),
            });
            const text = await response.text();
            setPatchDialogMsg(text || "Patch suggestion completed.");
            // Parse and store patches for next step
            try {
                const parsed = JSON.parse(text);
                setSuggestedPatches(parsed.suggestedPatches || []);
                setSelectedPatches(parsed.suggestedPatches?.map((_, i) => i) || []); // default: all selected
            } catch {}
        } catch (err) {
            setPatchDialogMsg("API error: " + err.message);
        }
        setPatchDialogOpen(true);
    };

    const handlePatchDialogClose = () => {
        setPatchDialogOpen(false);
        setPatchDialogMsg("");
    };

    // --- Patch selection handlers ---
    const handleTogglePatch = (idx) => {
        setSelectedPatches((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
    };
    const handleClearPatchSelection = () => setSelectedPatches([]);
    const handlePatchViewDetails = (patch) => {
        setPatchDetailsItem(patch);
        setPatchDetailsOpen(true);
    };
    const handlePatchDetailsClose = () => setPatchDetailsOpen(false);

    // --- Handler for Apply Patches ---
    const handleApplyPatches = async () => {
        if (!fileContent || !suggestedPatches.length || !selectedPatches.length) return;
        const patchesToApply = selectedPatches.map((idx) => suggestedPatches[idx]);
        try {
            const response = await fetch("http://localhost:4420/api/v1/apply-patches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    noticeXml: fileContent,
                    patches: patchesToApply,
                }),
            });
            const text = await response.text();
            setApplyDialogMsg(text || "Patches applied.");
            try {
                const parsed = JSON.parse(text);
                if (parsed.patchedNoticeXml) setPatchedXml(parsed.patchedNoticeXml);
            } catch {}
        } catch (err) {
            setApplyDialogMsg("API error: " + err.message);
        }
        setApplyDialogOpen(true);
    };

    const handleApplyDialogClose = () => setApplyDialogOpen(false);

    // Helper to base64 encode Unicode strings
    function base64EncodeUnicode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    // Handler for "Preview Rendered Notice"
    const handleRenderPreview = async () => {
        setRenderLoading(true);
        setRenderError("");
        setRenderHtml("");
        setRenderResult(null);
        try {
            const response = await fetch("http://localhost:4420/api/v1/visualize-notice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    noticeXml: fileContent,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const responseData = await response.json();
            setRenderResult(responseData);

            // If visualization was successful, set the HTML
            if (responseData.visualizationStatus === 200) {
                setRenderHtml(responseData.noticeHtml);
            }
        } catch (err) {
            setRenderError("Failed to render notice: " + err.message);
        }
        setRenderLoading(false);
        setRenderDialogOpen(true);
    };

    // Updated Handler for Validate Notice button (step 4)
    const handleValidateNotice = async () => {
        if (!patchedXml) return;

        setValidationLoading(true);
        setValidationResult(null);

        try {
            const response = await fetch("http://localhost:4420/api/v1/validate-notice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    noticeXml: patchedXml,
                }),
            });

            if (!response.ok) {
                // This is an actual request failure
                const errorText = await response.text();
                setValidationResult({
                    success: false,
                    status: response.status,
                    data: { message: `Request failed: ${errorText}` },
                    rawResponse: errorText,
                });
            } else {
                // Request succeeded, parse the validation result
                const responseData = await response.json();

                setValidationResult({
                    success: responseData.validationStatus === 200,
                    status: responseData.validationStatus,
                    data: responseData,
                    rawResponse: null,
                });
            }
        } catch (err) {
            setValidationResult({
                success: false,
                status: null,
                data: { message: "Network error: " + err.message },
                rawResponse: null,
            });
        }

        setValidationLoading(false);
        setValidationDialogOpen(true);
    };

    const handleValidationDialogClose = () => {
        setValidationDialogOpen(false);
        setValidationResult(null);
    };

    const handleRenderDialogClose = () => {
        setRenderDialogOpen(false);
        setRenderResult(null);
        setRenderHtml("");
        setRenderError("");
    };

    const handleDownloadValidationReport = () => {
        if (!validationResult?.data?.validationReport && !validationResult?.rawResponse) return;

        // Use validation report if available, otherwise use raw response
        const reportContent = validationResult.data.validationReport || validationResult.rawResponse;
        const blob = new Blob([reportContent], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "validation-report.xml";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    };

    return (
        <div className="homepage-container">
            <h1
                style={{
                    background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: "3rem",
                    fontWeight: 700,
                    textShadow: "0 2px 4px rgba(76, 175, 80, 0.2)",
                    letterSpacing: "0.5px",
                    marginBottom: "1rem",
                }}
            >
                eForms GPP Tool
            </h1>
            <div className="logo-area">
                <SustainabilityIcon />
            </div>
            <p className="description">Identify GPP criteria and apply them to your eForm notice.</p>
            {/* Material UI Stepper */}
            <Box sx={{ width: "100%", mb: 3 }}>
                <Tabs value={step} onChange={(_, newValue) => changeStep(newValue)} centered variant="fullWidth">
                    {steps.map((label, idx) => (
                        <Tab key={label} label={`STEP ${idx + 1}: ${label}`} />
                    ))}
                </Tabs>
            </Box>
            {/* Step Content */}
            {step === 0 ? (
                <>
                    <h2 style={{ color: "#2e7d32", fontWeight: 600 }}>Upload Your eForm Notice</h2>
                    <div className="upload-area">
                        <input
                            id="file-input"
                            type="file"
                            accept=".xml"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="contained"
                            onClick={handleAreaClick}
                            sx={{
                                mt: 2,
                                mb: 1,
                                background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                                color: "white",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                                },
                            }}
                        >
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
                                    fontWeight: 600,
                                    color: "#2e7d32", // dark green for better visibility
                                    fontSize: "0.95rem",
                                    letterSpacing: 1,
                                }}
                            >
                                <Box sx={{ height: 40 }} />
                                Raw XML Preview:
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
                                    fontSize: "0.5rem",
                                    color: "#444",
                                    overflowX: "auto",
                                    border: "1px solid #e0e0e0",
                                    textAlign: "left",
                                    maxHeight: 160,
                                    overflowY: "auto",
                                }}
                            >
                                <pre
                                    style={{ margin: 0, whiteSpace: "pre-wrap", textAlign: "left" }}
                                    dangerouslySetInnerHTML={{
                                        __html: fileContent
                                            .replace(/&/g, "&amp;")
                                            .replace(/</g, "&lt;")
                                            .replace(/>/g, "&gt;")
                                            // Highlight comments
                                            .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#999;">$1</span>')
                                            // Highlight tags and attributes
                                            .replace(
                                                /(&lt;\/?)([a-zA-Z0-9\-\:]+)((?:\s+[a-zA-Z0-9\-\:]+="[^"]*")*)(\s*\/?&gt;)/g,
                                                function (_, open, tag, attrs, close) {
                                                    // Highlight attributes and values
                                                    const attrsHighlighted = attrs.replace(
                                                        /([a-zA-Z0-9\-\:]+)=("[^"]*")/g,
                                                        '<span style="color:#008000;">$1</span>=<span style="color:#b75501;">$2</span>'
                                                    );
                                                    return (
                                                        '<span style="color:#2e7d32;">' +
                                                        open +
                                                        tag +
                                                        "</span>" +
                                                        attrsHighlighted +
                                                        '<span style="color:#2e7d32;">' +
                                                        close +
                                                        "</span>"
                                                    );
                                                }
                                            ),
                                    }}
                                />
                            </Box>
                            {/* Preview Rendered Notice button - complementary action */}
                            <Box sx={{ height: 40 }} />
                            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                                <Button
                                    variant="contained"
                                    disabled={!fileContent || renderLoading}
                                    onClick={handleRenderPreview}
                                    sx={{
                                        background: "linear-gradient(135deg, #66bb6a 0%, #81c784 100%)",
                                        color: "white",
                                        px: 3,
                                        py: 1,
                                        fontSize: "0.95rem",
                                        fontWeight: 600,
                                        border: "1px solid #4caf50",
                                        "&:hover": {
                                            background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                                            transform: "translateY(-1px)",
                                            boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                                        },
                                        "&:disabled": {
                                            background: "#e0e0e0",
                                            color: "#9e9e9e",
                                        },
                                    }}
                                >
                                    {renderLoading ? (
                                        <>
                                            <CircularProgress size={18} sx={{ mr: 1 }} />
                                            Rendering...
                                        </>
                                    ) : (
                                        "Preview Rendered Notice"
                                    )}
                                </Button>
                            </Box>
                            <Box sx={{ height: 80 }} />
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Button
                                    variant="contained"
                                    onClick={handleAnalyzeNotice}
                                    sx={{
                                        background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                                        color: "white",
                                        px: 4,
                                        py: 1.2,
                                        fontSize: "1.1rem",
                                        fontWeight: 600,
                                        "&:hover": {
                                            background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 6px 16px rgba(76, 175, 80, 0.3)",
                                        },
                                    }}
                                >
                                    Analyze Notice
                                </Button>
                            </Box>
                        </>
                    )}
                    {/* Rendered Notice Dialog */}
                    <Dialog
                        open={renderDialogOpen}
                        onClose={handleRenderDialogClose}
                        maxWidth="lg"
                        fullWidth
                        PaperProps={{ sx: { background: "linear-gradient(135deg, #f8fff8 0%, #f0f8f0 100%)" } }}
                    >
                        <DialogTitle>Rendered Notice Preview</DialogTitle>
                        <DialogContent
                            dividers
                            sx={{
                                minHeight: 300,
                                maxHeight: 700,
                                overflow: "auto",
                                background: "#fff",
                                p: 0,
                            }}
                        >
                            {renderLoading ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: 300,
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            ) : renderError ? (
                                <Alert severity="error" sx={{ m: 2 }}>
                                    {renderError}
                                </Alert>
                            ) : renderResult && renderResult.visualizationStatus !== 200 ? (
                                <Box sx={{ m: 2 }}>
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        Visualization failed with status: {renderResult.visualizationStatus}
                                    </Alert>
                                    {renderResult.summary && (
                                        <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
                                            <strong>Details:</strong>
                                            <br />
                                            {renderResult.summary}
                                        </Typography>
                                    )}
                                </Box>
                            ) : renderHtml ? (
                                <div
                                    style={{ width: "100%", height: "100%" }}
                                    dangerouslySetInnerHTML={{ __html: renderHtml }}
                                />
                            ) : (
                                <Typography sx={{ m: 2, color: "#888" }}>No preview available.</Typography>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handleRenderDialogClose}
                                sx={{
                                    color: "#d32f2f",
                                    "&:hover": {
                                        backgroundColor: "#ffebee",
                                        color: "#c62828",
                                    },
                                }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            ) : step === 1 ? (
                <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
                    <h3>Relevant GPP Documents</h3>
                    {/* Show Documents */}
                    {parsedResponse?.relevantGppDocuments?.length > 0 && (
                        <Paper sx={{ mb: 3, p: 2, background: " #999999 " /* slightly more gray */ }}>
                            <List>
                                {parsedResponse.relevantGppDocuments.map((doc) => (
                                    <div key={doc.name}>
                                        <ListItem
                                            sx={{
                                                mb: 2,
                                                borderRadius: 2,
                                                boxShadow: "0 2px 8px 0 rgba(60,72,88,0.07)",
                                                background: "#f0f8f0", // light green background
                                                border: "1px solid #e0e7ef",
                                                transition: "box-shadow 0.2s",
                                                "&:hover": {
                                                    boxShadow: "0 4px 16px 0 rgba(60,72,88,0.15)",
                                                    borderColor: "#b2bac2",
                                                },
                                                alignItems: "flex-start",
                                                px: 2,
                                                py: 2,
                                                flexDirection: "column",
                                            }}
                                            disableGutters
                                        >
                                            <ListItemText
                                                primary={
                                                    <span
                                                        style={{ fontWeight: 600, fontSize: "1rem", color: "#2e7d32" }}
                                                    >
                                                        {doc.name}
                                                    </span>
                                                }
                                                secondary={
                                                    <span style={{ color: "#444", fontSize: "0.88rem" }}>
                                                        {doc.summary}
                                                    </span>
                                                }
                                            />
                                            <Box sx={{ mt: 1, textAlign: "right" }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    sx={{
                                                        borderRadius: 2,
                                                        textTransform: "none",
                                                        fontSize: "0.85rem",
                                                        background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                                                        color: "white",
                                                        "&:hover": {
                                                            background:
                                                                "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                                            transform: "translateY(-1px)",
                                                            boxShadow: "0 3px 8px rgba(76, 175, 80, 0.3)",
                                                        },
                                                    }}
                                                    onClick={() => handleViewDetails(doc)}
                                                >
                                                    View Details
                                                </Button>
                                            </Box>
                                        </ListItem>
                                        <Divider sx={{ my: 1, borderColor: "#e0e7ef" }} />
                                    </div>
                                ))}
                            </List>
                        </Paper>
                    )}
                    {/* Show Criteria */}
                    <h3>Suggested GPP Criteria</h3>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <p style={{ margin: 0, flex: 1 }}>
                            Please select the criteria that you wish to insert into the notice.
                        </p>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                ml: 2,
                                textTransform: "none",
                                background: "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)",
                                color: "white",
                                fontWeight: 600,
                                "&:hover": {
                                    background: "linear-gradient(135deg, #f57c00 0%, #ff9800 100%)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 3px 8px rgba(255, 152, 0, 0.3)",
                                },
                                "&:disabled": {
                                    background: "#e0e0e0",
                                    color: "#9e9e9e",
                                },
                            }}
                            onClick={() => setSelectedCriteria([])}
                            disabled={selectedCriteria.length === 0}
                        >
                            Clear Selection
                        </Button>
                    </Box>
                    <Paper sx={{ p: 2, background: "#999999" /* slightly more gray */ }}>
                        <List>
                            {parsedResponse?.suggestedGppCriteria?.map((crit) => (
                                <div key={crit.id}>
                                    <ListItem
                                        sx={{
                                            mb: 2,
                                            borderRadius: 2,
                                            boxShadow: "0 2px 8px 0 rgba(60,72,88,0.07)",
                                            background: "#f0f8f0", // light green background
                                            border: "1px solid #e0e7ef",
                                            transition: "box-shadow 0.2s",
                                            "&:hover": {
                                                boxShadow: "0 4px 16px 0 rgba(60,72,88,0.15)",
                                                borderColor: "#b2bac2",
                                            },
                                            px: 2,
                                            py: 2,
                                            flexDirection: "column",
                                            alignItems: "stretch",
                                        }}
                                        disablePadding
                                    >
                                        <ListItemText
                                            primary={
                                                <span style={{ fontWeight: 600, fontSize: "1rem", color: "#2e7d32" }}>
                                                    {crit.id}: {crit.name}
                                                </span>
                                            }
                                            secondary={
                                                <span style={{ color: "#444", fontSize: "0.88rem" }}>
                                                    Lot: <b>{crit.lotId}</b>
                                                    <br />
                                                    Ambition Level: <b>{crit.ambitionLevel}</b>
                                                </span>
                                            }
                                        />
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: "none",
                                                    fontSize: "0.85rem",
                                                    background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                                                    color: "white",
                                                    "&:hover": {
                                                        background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                                        transform: "translateY(-1px)",
                                                        boxShadow: "0 3px 8px rgba(76, 175, 80, 0.3)",
                                                    },
                                                }}
                                                onClick={() => handleViewDetails(crit)}
                                            >
                                                View Details
                                            </Button>
                                            <Checkbox
                                                edge="end"
                                                onChange={() => handleToggleCriterion(crit.id)}
                                                checked={selectedCriteria.includes(crit.id)}
                                                sx={{ color: "#2e7d32", ml: 1 }}
                                            />
                                        </Box>
                                    </ListItem>
                                    <Divider sx={{ my: 1, borderColor: "#e0e7ef" }} />
                                </div>
                            ))}
                        </List>
                    </Paper>
                    {/* Suggest Patches Button */}
                    <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Button
                            variant="contained"
                            color="success"
                            sx={{ fontWeight: 600, fontSize: "1rem", px: 3, py: 1 }}
                            onClick={handleSuggestPatches}
                            disabled={selectedCriteria.length === 0}
                        >
                            Suggest Patches
                        </Button>
                    </Box>
                    {/* Details Dialog */}
                    <Dialog
                        open={detailsOpen}
                        onClose={handleDetailsClose}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{ sx: { background: "linear-gradient(135deg, #f8fff8 0%, #f0f8f0 100%)" } }}
                    >
                        <DialogTitle>Details</DialogTitle>
                        <DialogContent dividers>
                            {detailsItem && (
                                <Box sx={{ fontSize: "1rem", color: "#222" }}>
                                    {detailsItem.name && (
                                        <Typography variant="h6" sx={{ mb: 1, color: "#2e7d32" }}>
                                            {detailsItem.name}
                                        </Typography>
                                    )}
                                    {detailsItem.id && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>ID:</b> {detailsItem.id}
                                        </Typography>
                                    )}
                                    {detailsItem.lotId && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>Lot:</b> {detailsItem.lotId}
                                        </Typography>
                                    )}
                                    {detailsItem.ambitionLevel && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>Ambition Level:</b> {detailsItem.ambitionLevel}
                                        </Typography>
                                    )}
                                    {detailsItem.summary && (
                                        <Typography sx={{ mb: 2 }}>
                                            <b>Summary:</b> {detailsItem.summary}
                                        </Typography>
                                    )}
                                    {/* Show all other fields in a table */}
                                    <Box component="table" sx={{ width: "100%", mt: 1 }}>
                                        <tbody>
                                            {Object.entries(detailsItem)
                                                .filter(
                                                    ([key]) =>
                                                        !["name", "id", "lotId", "ambitionLevel", "summary"].includes(
                                                            key
                                                        )
                                                )
                                                .map(([key, value]) => (
                                                    <tr key={key}>
                                                        <td
                                                            style={{
                                                                fontWeight: 600,
                                                                paddingRight: 8,
                                                                verticalAlign: "top",
                                                            }}
                                                        >
                                                            {key}:
                                                        </td>
                                                        <td>
                                                            {["source", "documentReference"].includes(key) &&
                                                            typeof value === "string" &&
                                                            value.startsWith("http") ? (
                                                                <a
                                                                    href={value}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ color: "#2e7d32", wordBreak: "break-all" }}
                                                                >
                                                                    {value}
                                                                </a>
                                                            ) : Array.isArray(value) ? (
                                                                value.join(", ")
                                                            ) : typeof value === "string" ? (
                                                                value
                                                            ) : (
                                                                JSON.stringify(value, null, 2)
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handleDetailsClose}
                                sx={{
                                    color: "#d32f2f",
                                    "&:hover": {
                                        backgroundColor: "#ffebee",
                                        color: "#c62828",
                                    },
                                }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            ) : step === 2 ? (
                <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
                    <h3>Suggested Patches</h3>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <p style={{ margin: 0, flex: 1 }}>
                            Please select the patches that you wish to apply to your notice.
                        </p>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                ml: 2,
                                textTransform: "none",
                                background: "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)",
                                color: "white",
                                fontWeight: 600,
                                "&:hover": {
                                    background: "linear-gradient(135deg, #f57c00 0%, #ff9800 100%)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 3px 8px rgba(255, 152, 0, 0.3)",
                                },
                                "&:disabled": {
                                    background: "#e0e0e0",
                                    color: "#9e9e9e",
                                },
                            }}
                            onClick={handleClearPatchSelection}
                            disabled={selectedPatches.length === 0}
                        >
                            Clear Selection
                        </Button>
                    </Box>
                    <Paper sx={{ p: 2, background: "#999999" /* match criteria/documents bg */ }}>
                        <List>
                            {suggestedPatches.map((patch, idx) => (
                                <div key={idx}>
                                    <ListItem
                                        sx={{
                                            mb: 2,
                                            borderRadius: 2,
                                            boxShadow: "0 2px 8px 0 rgba(60,72,88,0.07)",
                                            background: "#f0f8f0", // match criteria/documents item bg
                                            border: "1px solid #e0e7ef",
                                            transition: "box-shadow 0.2s",
                                            "&:hover": {
                                                boxShadow: "0 4px 16px 0 rgba(60,72,88,0.15)",
                                                borderColor: "#b2bac2",
                                            },
                                            px: 2,
                                            py: 2,
                                            flexDirection: "column",
                                            alignItems: "stretch",
                                        }}
                                        disablePadding
                                    >
                                        <ListItemText
                                            primary={
                                                <span
                                                    style={{ fontWeight: 600, fontSize: "0.98rem", color: "#2e7d32" }}
                                                >
                                                    {patch.name}
                                                </span>
                                            }
                                            secondary={
                                                <span style={{ color: "#444", fontSize: "0.88rem" }}>
                                                    {patch.description}
                                                    <br />
                                                    <b>Lot:</b> {patch.lotId} &nbsp; <b>Operation:</b> {patch.op}
                                                </span>
                                            }
                                        />
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: "none",
                                                    fontSize: "0.85rem",
                                                    background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                                                    color: "white",
                                                    "&:hover": {
                                                        background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                                        transform: "translateY(-1px)",
                                                        boxShadow: "0 3px 8px rgba(76, 175, 80, 0.3)",
                                                    },
                                                }}
                                                onClick={() => handlePatchViewDetails(patch)}
                                            >
                                                View Details
                                            </Button>
                                            <Checkbox
                                                edge="end"
                                                onChange={() => handleTogglePatch(idx)}
                                                checked={selectedPatches.includes(idx)}
                                                sx={{ color: "#2e7d32", ml: 1 }}
                                            />
                                        </Box>
                                    </ListItem>
                                    <Divider sx={{ my: 1, borderColor: "#e0e7ef" }} />
                                </div>
                            ))}
                        </List>
                    </Paper>
                    {/* --- Add Apply Patches Button here --- */}
                    <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Button
                            variant="contained"
                            color="success"
                            sx={{ fontWeight: 600, fontSize: "1rem", px: 3, py: 1 }}
                            onClick={handleApplyPatches}
                            disabled={selectedPatches.length === 0}
                        >
                            Apply Patches
                        </Button>
                    </Box>
                    {/* Patch Details Dialog */}
                    <Dialog
                        open={patchDetailsOpen}
                        onClose={handlePatchDetailsClose}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{ sx: { background: "linear-gradient(135deg, #f8fff8 0%, #f0f8f0 100%)" } }}
                    >
                        <DialogTitle>Patch Details</DialogTitle>
                        <DialogContent dividers>
                            {patchDetailsItem && (
                                <Box sx={{ fontSize: "1rem", color: "#222" }}>
                                    {patchDetailsItem.name && (
                                        <Typography variant="h6" sx={{ mb: 1, color: "#2e7d32" }}>
                                            {patchDetailsItem.name}
                                        </Typography>
                                    )}
                                    {patchDetailsItem.description && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>Description:</b> {patchDetailsItem.description}
                                        </Typography>
                                    )}
                                    {patchDetailsItem.lotId && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>Lot:</b> {patchDetailsItem.lotId}
                                        </Typography>
                                    )}
                                    {patchDetailsItem.op && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>Operation:</b> {patchDetailsItem.op}
                                        </Typography>
                                    )}
                                    {patchDetailsItem.path && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>Path:</b> {patchDetailsItem.path}
                                        </Typography>
                                    )}
                                    {patchDetailsItem.btIds && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>BT IDs:</b> {patchDetailsItem.btIds.join(", ")}
                                        </Typography>
                                    )}
                                    {patchDetailsItem.dependsOn && (
                                        <Typography sx={{ mb: 1 }}>
                                            <b>Depends On:</b> {patchDetailsItem.dependsOn}
                                        </Typography>
                                    )}
                                    {patchDetailsItem.value && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography sx={{ fontWeight: 600 }}>Value:</Typography>
                                            <Box
                                                sx={{
                                                    background: "#f8f8f8",
                                                    borderRadius: 1,
                                                    p: 2,
                                                    fontFamily: "monospace",
                                                    fontSize: "0.50rem", // smaller font
                                                    color: "#444",
                                                    overflowX: "auto",
                                                    border: "1px solid #e0e0e0",
                                                    mt: 1,
                                                    maxHeight: 240,
                                                }}
                                            >
                                                <pre
                                                    style={{
                                                        margin: 0,
                                                        whiteSpace: "pre-wrap",
                                                        textAlign: "left",
                                                        color: "#3b3b3b",
                                                    }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: patchDetailsItem.value
                                                            .replace(/&/g, "&amp;")
                                                            .replace(/</g, "&lt;")
                                                            .replace(/>/g, "&gt;")
                                                            // Highlight comments
                                                            .replace(
                                                                /(&lt;!--[\s\S]*?--&gt;)/g,
                                                                '<span style="color:#999;">$1</span>'
                                                            )
                                                            // Highlight tags and attributes
                                                            .replace(
                                                                /(&lt;\/?)([a-zA-Z0-9\-\:]+)((?:\s+[a-zA-Z0-9\-\:]+="[^"]*")*)(\s*\/?&gt;)/g,
                                                                function (_, open, tag, attrs, close) {
                                                                    // Highlight attributes and values
                                                                    const attrsHighlighted = attrs.replace(
                                                                        /([a-zA-Z0-9\-\:]+)=("[^"]*")/g,
                                                                        '<span style="color:#008000;">$1</span>=<span style="color:#b75501;">$2</span>'
                                                                    );
                                                                    return (
                                                                        '<span style="color:#2e7d32;">' +
                                                                        open +
                                                                        tag +
                                                                        "</span>" +
                                                                        attrsHighlighted +
                                                                        '<span style="color:#2e7d32;">' +
                                                                        close +
                                                                        "</span>"
                                                                    );
                                                                }
                                                            ),
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handlePatchDetailsClose}
                                sx={{
                                    color: "#d32f2f",
                                    "&:hover": {
                                        backgroundColor: "#ffebee",
                                        color: "#c62828",
                                    },
                                }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            ) : (
                // TODO: remove this somehow
                <div className="dummy-page">
                    {/* <h2>{`STEP ${step + 1}: ${steps[step]}`}</h2>
                    <p>This is a placeholder for the {steps[step]} step.</p> */}
                </div>
            )}
            {/* Analyze Notice Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                PaperProps={{ sx: { background: "linear-gradient(135deg, #e8f5e8 0%, #dcedc8 100%)" } }}
            >
                <DialogTitle>Notice Analysis Result</DialogTitle>
                <DialogContent>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                        {(() => {
                            // Try to parse and show a short summary
                            try {
                                const parsed = JSON.parse(analyzeResponse);
                                const docCount = parsed?.relevantGppDocuments?.length || 0;
                                const critCount = parsed?.suggestedGppCriteria?.length || 0;
                                return `Found ${docCount} relevant GPP document${
                                    docCount === 1 ? "" : "s"
                                } and ${critCount} suggested criteri${critCount === 1 ? "on" : "a"}.`;
                            } catch {
                                // fallback to a generic message or error
                                return "Notice analysis completed.";
                            }
                        })()}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleDialogClose}
                        sx={{
                            color: "#d32f2f",
                            "&:hover": {
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                            },
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNextStep}
                        sx={{
                            background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                            color: "white",
                            "&:hover": {
                                background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                            },
                        }}
                    >
                        Next: Select Criteria
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Suggest Patches Dialog */}
            <Dialog
                open={patchDialogOpen}
                onClose={handlePatchDialogClose}
                PaperProps={{ sx: { background: "linear-gradient(135deg, #e8f5e8 0%, #dcedc8 100%)" } }}
            >
                <DialogTitle>Suggest Patches</DialogTitle>
                <DialogContent>
                    <Typography sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                        {(() => {
                            try {
                                const parsed = JSON.parse(patchDialogMsg);
                                const patchCount = parsed?.suggestedPatches?.length || 0;
                                return `The eForms GPP library suggested ${patchCount} patch${
                                    patchCount === 1 ? "" : "es"
                                } for your notice.`;
                            } catch {
                                return patchDialogMsg || "Patch suggestion completed.";
                            }
                        })()}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handlePatchDialogClose}
                        sx={{
                            color: "#d32f2f",
                            "&:hover": {
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                            },
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setPatchDialogOpen(false);
                            changeStep(2); // Go to "Select Patches" step
                        }}
                        sx={{
                            background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                            color: "white",
                            "&:hover": {
                                background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                            },
                        }}
                    >
                        Next: Select Patches
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Apply Patches Dialog */}
            <Dialog
                open={applyDialogOpen}
                onClose={handleApplyDialogClose}
                PaperProps={{ sx: { background: "linear-gradient(135deg, #e8f5e8 0%, #dcedc8 100%)" } }}
            >
                <DialogTitle>Apply Patches</DialogTitle>
                <DialogContent>
                    <Typography sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                        {(() => {
                            try {
                                const parsed = JSON.parse(applyDialogMsg);
                                return parsed?.message || "Patches applied successfully.";
                            } catch {
                                return applyDialogMsg || "Patches applied.";
                            }
                        })()}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleApplyDialogClose}
                        sx={{
                            color: "#d32f2f",
                            "&:hover": {
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                            },
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setApplyDialogOpen(false);
                            changeStep(3); // Go to "Review & Download" step
                        }}
                        sx={{
                            background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                            color: "white",
                            "&:hover": {
                                background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                            },
                        }}
                    >
                        Next: Review & Download
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Review & Download Step */}
            {step === 3 && (
                <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
                    {/* Raw XML Preview for Patched Notice */}
                    <Box
                        sx={{
                            mt: 2,
                            maxWidth: 500,
                            mx: "auto",
                            textAlign: "center",
                            fontWeight: 600,
                            color: "#2e7d32",
                            fontSize: "0.95rem",
                            letterSpacing: 1,
                        }}
                    >
                        Raw XML Preview (Patched Notice):
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
                            fontSize: "0.5rem",
                            color: "#444",
                            overflowX: "auto",
                            border: "1px solid #e0e0e0",
                            textAlign: "left",
                            maxHeight: 160,
                            overflowY: "auto",
                        }}
                    >
                        <pre
                            style={{ margin: 0, whiteSpace: "pre-wrap", textAlign: "left" }}
                            dangerouslySetInnerHTML={{
                                __html: patchedXml
                                    .replace(/&/g, "&amp;")
                                    .replace(/</g, "&lt;")
                                    .replace(/>/g, "&gt;")
                                    // Highlight comments
                                    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#999;">$1</span>')
                                    // Highlight tags and attributes
                                    .replace(
                                        /(&lt;\/?)([a-zA-Z0-9\-\:]+)((?:\s+[a-zA-Z0-9\-\:]+="[^"]*")*)(\s*\/?&gt;)/g,
                                        function (_, open, tag, attrs, close) {
                                            // Highlight attributes and values
                                            const attrsHighlighted = attrs.replace(
                                                /([a-zA-Z0-9\-\:]+)=("[^"]*")/g,
                                                '<span style="color:#008000;">$1</span>=<span style="color:#b75501;">$2</span>'
                                            );
                                            return (
                                                '<span style="color:#2e7d32;">' +
                                                open +
                                                tag +
                                                "</span>" +
                                                attrsHighlighted +
                                                '<span style="color:#2e7d32;">' +
                                                close +
                                                "</span>"
                                            );
                                        }
                                    ),
                            }}
                        />
                    </Box>
                    {/* Preview Rendered Notice button for Patched Notice */}
                    <Box sx={{ height: 40 }} />
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                        <Button
                            variant="contained"
                            disabled={!patchedXml || renderLoading}
                            onClick={async () => {
                                setRenderLoading(true);
                                setRenderError("");
                                setRenderHtml("");
                                setRenderResult(null);
                                try {
                                    const response = await fetch("http://localhost:4420/api/v1/visualize-notice", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            noticeXml: patchedXml,
                                        }),
                                    });
                                    if (!response.ok) {
                                        throw new Error(`HTTP ${response.status}`);
                                    }
                                    const responseData = await response.json();
                                    setRenderResult(responseData);

                                    // If visualization was successful, set the HTML
                                    if (responseData.visualizationStatus === 200) {
                                        setRenderHtml(responseData.noticeHtml);
                                    }
                                } catch (err) {
                                    setRenderError("Failed to render notice: " + err.message);
                                }
                                setRenderLoading(false);
                                setRenderDialogOpen(true);
                            }}
                            sx={{
                                background: "linear-gradient(135deg, #66bb6a 0%, #81c784 100%)",
                                color: "white",
                                px: 3,
                                py: 1,
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                border: "1px solid #4caf50",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                                },
                                "&:disabled": {
                                    background: "#e0e0e0",
                                    color: "#9e9e9e",
                                },
                            }}
                        >
                            {renderLoading ? (
                                <>
                                    <CircularProgress size={18} sx={{ mr: 1 }} />
                                    Rendering...
                                </>
                            ) : (
                                "Preview Rendered Notice"
                            )}
                        </Button>
                    </Box>
                    <Box sx={{ height: 40 }} />
                    {/* Validate Notice button */}
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                        <Button
                            variant="contained"
                            disabled={!patchedXml || validationLoading}
                            onClick={handleValidateNotice}
                            sx={{
                                background: "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)",
                                color: "white",
                                px: 3,
                                py: 1,
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                "&:hover": {
                                    background: "linear-gradient(135deg, #f57c00 0%, #ff9800 100%)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 4px 12px rgba(255, 152, 0, 0.3)",
                                },
                                "&:disabled": {
                                    background: "#e0e0e0",
                                    color: "#9e9e9e",
                                },
                            }}
                        >
                            {validationLoading ? (
                                <>
                                    <CircularProgress size={18} sx={{ mr: 1 }} />
                                    Validating...
                                </>
                            ) : (
                                "Validate Notice"
                            )}
                        </Button>
                    </Box>
                    <Box sx={{ height: 80 }} />
                    {/* Download Patched Notice Section */}
                    <Button
                        variant="contained"
                        disabled={!patchedXml}
                        sx={{
                            background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                            color: "white",
                            px: 4,
                            py: 1.2,
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            "&:hover": {
                                background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                transform: "translateY(-2px)",
                                boxShadow: "0 6px 16px rgba(76, 175, 80, 0.3)",
                            },
                            "&:disabled": {
                                background: "#e0e0e0",
                                color: "#9e9e9e",
                            },
                        }}
                        onClick={() => {
                            // Create a blob and trigger download
                            const blob = new Blob([patchedXml], { type: "application/xml" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "patchedNotice.xml";
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(() => {
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }, 0);
                        }}
                    >
                        Download Patched Notice
                    </Button>
                    {/* Rendered Notice Dialog (shared for both original and patched) */}
                    <Dialog
                        open={renderDialogOpen}
                        onClose={handleRenderDialogClose}
                        maxWidth="lg"
                        fullWidth
                        PaperProps={{ sx: { background: "#fff" } }}
                    >
                        <DialogTitle>Rendered Notice Preview</DialogTitle>
                        <DialogContent
                            dividers
                            sx={{
                                minHeight: 300,
                                maxHeight: 700,
                                overflow: "auto",
                                background: "#fff",
                                p: 0,
                            }}
                        >
                            {renderLoading ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: 300,
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            ) : renderError ? (
                                <Alert severity="error" sx={{ m: 2 }}>
                                    {renderError}
                                </Alert>
                            ) : renderResult && renderResult.visualizationStatus !== 200 ? (
                                <Box sx={{ m: 2 }}>
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        Visualization failed with status: {renderResult.visualizationStatus}
                                    </Alert>
                                    {renderResult.summary && (
                                        <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
                                            <strong>Details:</strong>
                                            <br />
                                            {renderResult.summary}
                                        </Typography>
                                    )}
                                </Box>
                            ) : renderHtml ? (
                                <div
                                    style={{ width: "100%", height: "100%" }}
                                    dangerouslySetInnerHTML={{ __html: renderHtml }}
                                />
                            ) : (
                                <Typography sx={{ m: 2, color: "#888" }}>No preview available.</Typography>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handleRenderDialogClose}
                                sx={{
                                    color: "#d32f2f",
                                    "&:hover": {
                                        backgroundColor: "#ffebee",
                                        color: "#c62828",
                                    },
                                }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            )}

            {/* Add Validation Result Dialog */}
            <Dialog
                open={validationDialogOpen}
                onClose={handleValidationDialogClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { background: "linear-gradient(135deg, #f8fff8 0%, #f0f8f0 100%)" } }}
            >
                <DialogTitle>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        Validation Result
                        {validationResult && (
                            <Alert severity={validationResult.success ? "success" : "error"} sx={{ ml: 2, py: 0 }}>
                                {validationResult.success ? "Valid" : "Invalid"}
                            </Alert>
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {validationResult && (
                        <Box>
                            {/* Validation Status */}
                            <Typography sx={{ mb: 2 }}>
                                <strong>Validation Status:</strong> {validationResult.status || "Network Error"}
                            </Typography>

                            {/* Summary - Show full summary content */}
                            {validationResult.data?.summary && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontWeight: 600, mb: 1 }}>Summary:</Typography>
                                    <Box
                                        sx={{
                                            background: "#f8f8f8",
                                            borderRadius: 1,
                                            p: 2,
                                            border: "1px solid #e0e0e0",
                                            maxHeight: 300,
                                            overflowY: "auto",
                                        }}
                                    >
                                        <Typography
                                            component="pre"
                                            sx={{
                                                whiteSpace: "pre-wrap",
                                                fontFamily: "inherit",
                                                margin: 0,
                                                fontSize: "0.9rem",
                                            }}
                                        >
                                            {validationResult.data.summary}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* Message as fallback if no summary */}
                            {!validationResult.data?.summary && validationResult.data?.message && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontWeight: 600, mb: 1 }}>Message:</Typography>
                                    <Box
                                        sx={{
                                            background: "#f8f8f8",
                                            borderRadius: 1,
                                            p: 2,
                                            border: "1px solid #e0e0e0",
                                        }}
                                    >
                                        <Typography>{validationResult.data.message}</Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* Additional Details */}
                            {validationResult.data?.details && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontWeight: 600, mb: 1 }}>Details:</Typography>
                                    <Box
                                        sx={{
                                            background: "#f8f8f8",
                                            borderRadius: 1,
                                            p: 2,
                                            fontFamily: "monospace",
                                            fontSize: "0.85rem",
                                            color: "#444",
                                            border: "1px solid #e0e0e0",
                                            maxHeight: 200,
                                            overflowY: "auto",
                                        }}
                                    >
                                        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                                            {typeof validationResult.data.details === "string"
                                                ? validationResult.data.details
                                                : JSON.stringify(validationResult.data.details, null, 2)}
                                        </pre>
                                    </Box>
                                </Box>
                            )}

                            {/* Validation Report Preview (if available) */}
                            {validationResult.data?.validationReport && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontWeight: 600, mb: 1 }}>Validation Report Preview:</Typography>
                                    <Box
                                        sx={{
                                            background: "#f8f8f8",
                                            borderRadius: 1,
                                            p: 2,
                                            fontFamily: "monospace",
                                            fontSize: "0.8rem",
                                            color: "#444",
                                            border: "1px solid #e0e0e0",
                                            maxHeight: 200,
                                            overflowY: "auto",
                                        }}
                                    >
                                        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                                            {validationResult.data.validationReport.substring(0, 1000)}
                                            {validationResult.data.validationReport.length > 1000 && "..."}
                                        </pre>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleValidationDialogClose}
                        sx={{
                            color: "#d32f2f",
                            "&:hover": {
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                            },
                        }}
                    >
                        Close
                    </Button>
                    {validationResult?.success && validationResult.data?.validationReport && (
                        <Button
                            variant="contained"
                            onClick={handleDownloadValidationReport}
                            sx={{
                                background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                                color: "white",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                                },
                            }}
                        >
                            Download Validation Report
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default App;
