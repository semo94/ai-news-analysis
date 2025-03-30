import React from "react";
import { Button, Grid, Typography, Box } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from "@mui/system";


const DetailsContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100vh",
}));

const ContentContainer = styled("div")({
    display: "flex",
    flexDirection: "row",
    flex: 1,
});

const TextSection = styled("div")({
    flex: 1,
    padding: "1rem",
    overflowY: "auto",
    "& pre": {
        whiteSpace: "pre-wrap",
    },
});

const Footer = styled("div")({
    padding: "1rem",
});

const DetailsComponent = ({ article, analysis, onBack }) => {
    return (
        <DetailsContainer>
            <ContentContainer>
                <TextSection>
                    <Typography variant="h5" gutterBottom>
                        Original Article
                    </Typography>
                    <pre>{article}</pre>
                </TextSection>
                <TextSection>
                    <Typography variant="h5" gutterBottom>
                        AI Analysis
                    </Typography>
                    <pre>{analysis}</pre>
                </TextSection>
            </ContentContainer>
            <Footer>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                >
                    Home
                </Button>
            </Footer>
        </DetailsContainer>
    );
};

export default DetailsComponent;
