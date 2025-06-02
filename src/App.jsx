import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
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

// ??++ AQUI
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

    const handleNextStep = () => {
        setDialogOpen(false);
        setStep(1); // Move to "Select Criteria"
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
        // Find selected criteria objects
        const selectedCriteriaObjs =
            parsedResponse.suggestedGppCriteria?.filter((crit) => selectedCriteria.includes(crit.id)) || [];
        try {
            const response = await fetch("http://localhost:4420/api/v1/suggest-patches", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    noticeXml: fileContent,
                    criteria: selectedCriteriaObjs,
                }),
            });
            const text = await response.text();
            setPatchDialogMsg(text || "Patch suggestion completed.");
        } catch (err) {
            setPatchDialogMsg("API error: " + err.message);
        }
        setPatchDialogOpen(true);
    };

    const handlePatchDialogClose = () => {
        setPatchDialogOpen(false);
        setPatchDialogMsg("");
    };

    return (
        <div className="homepage-container">
            <h1>eForms GPP</h1>
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
                                                background: "#d3d3d3", // just a little gray
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
                                                        style={{ fontWeight: 600, fontSize: "1rem", color: "#1976d2" }}
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
                                                    variant="outlined"
                                                    sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.85rem" }}
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
                            variant="outlined"
                            color="secondary"
                            size="small"
                            sx={{ ml: 2, textTransform: "none" }}
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
                                            background: "#d3d3d3", // just a little gray
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
                                                <span style={{ fontWeight: 600, fontSize: "1rem", color: "#1976d2" }}>
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
                                                variant="outlined"
                                                sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.85rem" }}
                                                onClick={() => handleViewDetails(crit)}
                                            >
                                                View Details
                                            </Button>
                                            <Checkbox
                                                edge="end"
                                                onChange={() => handleToggleCriterion(crit.id)}
                                                checked={selectedCriteria.includes(crit.id)}
                                                sx={{ color: "#1976d2", ml: 1 }}
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
                        PaperProps={{ sx: { background: "#d3d3d3" } }}
                    >
                        <DialogTitle>Details</DialogTitle>
                        <DialogContent dividers>
                            {detailsItem && (
                                <Box sx={{ fontSize: "1rem", color: "#222" }}>
                                    {detailsItem.name && (
                                        <Typography variant="h6" sx={{ mb: 1, color: "#1976d2" }}>
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
                                                            {Array.isArray(value)
                                                                ? value.join(", ")
                                                                : typeof value === "string"
                                                                ? value
                                                                : JSON.stringify(value, null, 2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleDetailsClose}>Close</Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            ) : (
                <div className="dummy-page">
                    <h2>{`STEP ${step + 1}: ${steps[step]}`}</h2>
                    <p>This is a placeholder for the {steps[step]} step.</p>
                </div>
            )}
            {/* Analyze Notice Dialog */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} PaperProps={{ sx: { background: "#d3d3d3" } }}>
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
                    <Button onClick={handleDialogClose}>Close</Button>
                    <Button variant="contained" color="primary" onClick={handleNextStep}>
                        Next: Select Criteria
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Suggest Patches Dialog */}
            <Dialog
                open={patchDialogOpen}
                onClose={handlePatchDialogClose}
                PaperProps={{ sx: { background: "#d3d3d3" } }}
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
                    <Button onClick={handlePatchDialogClose}>Close</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setPatchDialogOpen(false);
                            setStep(2); // Go to "Select Patches" step
                        }}
                    >
                        Next: Select Patches
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default App;
