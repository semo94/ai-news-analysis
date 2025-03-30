import React, { useState } from "react";
import {
  Button,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Tabs,
  Tab,
  Tooltip,
  Chip,
  useMediaQuery,
  useTheme
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ReactMarkdown from 'react-markdown';
import { styled } from "@mui/system";

const DetailsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
});

const ContentContainer = styled(Box)({
  flex: 1,
  padding: "12px",
  marginTop: "56px",
});

const ArticleSection = styled(Paper)({
  padding: "16px",
  height: "100%",
  overflow: "auto",
  boxShadow: "0px 1px 3px rgba(0,0,0,0.12)",
});

const AnalysisSection = styled(Paper)({
  padding: "16px",
  height: "100%",
  overflow: "auto",
  boxShadow: "0px 1px 3px rgba(0,0,0,0.12)",
});

const StickyHeader = styled(AppBar)({
  backgroundColor: "#fff",
  color: "rgba(0, 0, 0, 0.87)",
  boxShadow: "0px 1px 3px rgba(0,0,0,0.12)",
  height: "56px",
});

const AnalysisPaper = styled(Paper)({
  padding: "12px",
  marginBottom: "8px",
  backgroundColor: "#f5f5f5",
  border: "1px solid rgba(0, 0, 0, 0.12)",
});

const MarkdownContent = styled('div')({
  '& h1': {
    fontSize: '1.5rem',
    marginTop: '16px',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  '& h2': {
    fontSize: '1.25rem',
    marginTop: '12px',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  '& h3': {
    fontSize: '1.1rem',
    marginTop: '10px',
    marginBottom: '6px',
    fontWeight: 'bold',
  },
  '& p': {
    marginBottom: '8px',
    lineHeight: 1.5,
  },
  '& ul, & ol': {
    marginLeft: '20px',
    marginBottom: '8px',
    paddingLeft: '0',
  },
  '& li': {
    marginBottom: '2px',
  },
  '& li > ul, & li > ol': {
    marginBottom: '0',
  },
  '& blockquote': {
    borderLeft: '4px solid #ccc',
    paddingLeft: '12px',
    margin: '8px 0',
    color: '#555',
  },
  '& code': {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: '2px 4px',
    borderRadius: '2px',
  },
  '& pre': {
    backgroundColor: '#f5f5f5',
    padding: '8px',
    borderRadius: '4px',
    overflow: 'auto',
    marginBottom: '8px',
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: '8px',
  },
  '& th, & td': {
    border: '1px solid #ddd',
    padding: '4px 8px',
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
});

const parseAnalysis = (analysisText) => {
  if (!analysisText) return {
    objectivityScore: null,
    biasTags: [],
    summary: "",
    assessment: "",
    fullContent: ""
  };

  try {
    // Format the full content better with numbered lists and indentation
    const formattedContent = analysisText
      .replace(/(\d+)\.\s+([A-Z])/g, '$1. $2') // Ensure proper spacing after numbered lists
      .replace(/•\s+/g, '* ') // Convert bullet points to markdown format
      .replace(/\n\s*\n/g, '\n\n'); // Normalize spacing between paragraphs

    const sections = {
      fullContent: formattedContent
    };

    // Extract objectivity score
    const objectivityMatch = analysisText.match(/Objectivity and neutrality score.*?(\d+(\.\d+)?)/i);
    sections.objectivityScore = objectivityMatch ? parseFloat(objectivityMatch[1]) : null;

    // Extract bias tags
    const biasSection = analysisText.match(/Ideological\/political bias detection:(.*?)(?=\d\.|Summary:|$)/is);
    if (biasSection) {
      // Look for tags or labels in the bias section
      const tagMatches = biasSection[1].match(/[•\-*]\s*(.*?)(?=\s*[•\-*]|$)/g) ||
        biasSection[1].match(/([A-Za-z\s-]+)(?=:|\.|,|$)/g);

      sections.biasTags = tagMatches
        ? tagMatches.map(tag => tag.replace(/[•\-*]\s*/, '').trim())
          .filter(tag => tag.length > 0 && tag.length < 25)
        : [];
    } else {
      sections.biasTags = [];
    }

    // Extract summary
    const summaryMatch = analysisText.match(/Summary:(.*?)(?=Overall|Assessment|$)/is);
    sections.summary = summaryMatch ? summaryMatch[1].trim() : "";

    // Extract overall assessment
    const assessmentMatch = analysisText.match(/(?:Overall|Assessment):(.*?)(?=Suggestions|$)/is);
    sections.assessment = assessmentMatch ? assessmentMatch[1].trim() : "";

    return sections;
  } catch (error) {
    console.error("Error parsing analysis:", error);
    return {
      objectivityScore: null,
      biasTags: [],
      summary: "",
      assessment: "",
      fullContent: analysisText || ""
    };
  }
};

const formatArticleContent = (content) => {
  // Basic parsing of the article content
  if (!content) return { publisher: "", date: "", author: "", title: "", content: "" };

  const publisherMatch = content.match(/publisher:\s*(.*?)(?=\n)/i);
  const dateMatch = content.match(/Date:\s*(.*?)(?=\n)/i);
  const authorMatch = content.match(/Author:\s*(.*?)(?=\n)/i);
  const titleMatch = content.match(/title:\s*(.*?)(?=\n)/i);
  const articleMatch = content.match(/Article:\s*([\s\S]*)/i);

  return {
    publisher: publisherMatch ? publisherMatch[1].trim() : "",
    date: dateMatch ? dateMatch[1].trim() : "",
    author: authorMatch ? authorMatch[1].trim() : "",
    title: titleMatch ? titleMatch[1].trim() : "",
    content: articleMatch ? articleMatch[1].trim() : content,
  };
};

const ScoreChip = styled(Chip)(({ score }) => {
  let color;
  if (score >= 8) color = "#4caf50"; // green
  else if (score >= 5) color = "#ff9800"; // orange
  else color = "#f44336"; // red

  return {
    backgroundColor: color,
    color: "#fff",
    fontWeight: "bold",
  };
});

const DetailsComponent = ({ article, analysis, onBack }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCopyContent = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a snackbar notification here
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    // In a real app, you would save this state to a backend or localStorage
  };

  const parsedArticle = formatArticleContent(article);
  const parsedAnalysis = parseAnalysis(analysis || "");

  return (
    <DetailsContainer>
      <StickyHeader position="fixed">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {parsedArticle.title || "Article Analysis"}
          </Typography>
          <Tooltip title="Copy Article">
            <IconButton color="inherit" onClick={() => handleCopyContent(article)}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={bookmarked ? "Remove Bookmark" : "Bookmark Article"}>
            <IconButton color="inherit" onClick={toggleBookmark}>
              {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton color="inherit">
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </StickyHeader>

      <ContentContainer>
        {isMobile ? (
          // Mobile layout with tabs
          <>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label="Article" />
              <Tab label="Analysis" />
            </Tabs>

            <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
              <ArticleSection>
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ fontSize: '1.4rem', mb: 1 }}>
                  {parsedArticle.title}
                </Typography>

                <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {parsedArticle.publisher && (
                    <Chip label={parsedArticle.publisher} size="small" color="primary" variant="outlined" />
                  )}
                  {parsedArticle.date && (
                    <Chip label={parsedArticle.date} size="small" variant="outlined" />
                  )}
                  {parsedArticle.author && (
                    <Chip label={`By ${parsedArticle.author}`} size="small" variant="outlined" />
                  )}
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                  {parsedArticle.content}
                </Typography>
              </ArticleSection>
            </Box>

            <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
              <AnalysisSection>
                <Typography variant="h5" gutterBottom sx={{ fontSize: '1.3rem', mb: 1 }}>
                  Analysis
                </Typography>

                {parsedAnalysis.objectivityScore !== null && (
                  <AnalysisPaper>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">Objectivity Score</Typography>
                      <ScoreChip
                        label={parsedAnalysis.objectivityScore + "/10"}
                        score={parsedAnalysis.objectivityScore}
                      />
                    </Box>
                  </AnalysisPaper>
                )}

                {parsedAnalysis.biasTags && parsedAnalysis.biasTags.length > 0 && (
                  <AnalysisPaper>
                    <Typography variant="h6" gutterBottom>Bias Detection</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {parsedAnalysis.biasTags.map((tag, index) => (
                        <Chip key={index} label={tag} />
                      ))}
                    </Box>
                  </AnalysisPaper>
                )}

                {parsedAnalysis.summary && (
                  <AnalysisPaper>
                    <Typography variant="h6" gutterBottom>Summary</Typography>
                    <MarkdownContent>
                      <ReactMarkdown>{parsedAnalysis.summary}</ReactMarkdown>
                    </MarkdownContent>
                  </AnalysisPaper>
                )}

                {parsedAnalysis.assessment && (
                  <AnalysisPaper>
                    <Typography variant="h6" gutterBottom>Overall Assessment</Typography>
                    <MarkdownContent>
                      <ReactMarkdown>{parsedAnalysis.assessment}</ReactMarkdown>
                    </MarkdownContent>
                  </AnalysisPaper>
                )}

                <Card sx={{ mt: 1, bgcolor: 'info.main', color: 'info.contrastText' }}>
                  <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      This analysis was generated by AI and should be used as a starting point for critical thinking, not as definitive judgment.
                    </Typography>
                  </CardContent>
                </Card>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                  Full Analysis:
                </Typography>
                <Box sx={{ p: 1, bgcolor: '#f8f8f8', borderRadius: 1 }}>
                  <MarkdownContent>
                    <ReactMarkdown>{parsedAnalysis.fullContent}</ReactMarkdown>
                  </MarkdownContent>
                </Box>
              </AnalysisSection>
            </Box>
          </>
        ) : (
          // Desktop layout with grid
          <Grid container spacing={1} sx={{ height: 'calc(100vh - 120px)' }}>
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <ArticleSection>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  {parsedArticle.title}
                </Typography>

                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {parsedArticle.publisher && (
                    <Chip label={parsedArticle.publisher} size="small" color="primary" variant="outlined" />
                  )}
                  {parsedArticle.date && (
                    <Chip label={parsedArticle.date} size="small" variant="outlined" />
                  )}
                  {parsedArticle.author && (
                    <Chip label={`By ${parsedArticle.author}`} size="small" variant="outlined" />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                  {parsedArticle.content}
                </Typography>
              </ArticleSection>
            </Grid>

            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <AnalysisSection>
                <Typography variant="h5" gutterBottom>
                  Analysis
                </Typography>

                {parsedAnalysis.objectivityScore !== null && (
                  <AnalysisPaper>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">Objectivity Score</Typography>
                      <ScoreChip
                        label={parsedAnalysis.objectivityScore + "/10"}
                        score={parsedAnalysis.objectivityScore}
                      />
                    </Box>
                  </AnalysisPaper>
                )}

                {parsedAnalysis.biasTags && parsedAnalysis.biasTags.length > 0 && (
                  <AnalysisPaper>
                    <Typography variant="h6" gutterBottom>Bias Detection</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {parsedAnalysis.biasTags.map((tag, index) => (
                        <Chip key={index} label={tag} />
                      ))}
                    </Box>
                  </AnalysisPaper>
                )}

                {parsedAnalysis.summary && (
                  <AnalysisPaper>
                    <Typography variant="h6" gutterBottom>Summary</Typography>
                    <Typography variant="body1">{parsedAnalysis.summary}</Typography>
                  </AnalysisPaper>
                )}

                {parsedAnalysis.assessment && (
                  <AnalysisPaper>
                    <Typography variant="h6" gutterBottom>Overall Assessment</Typography>
                    <Typography variant="body1">{parsedAnalysis.assessment}</Typography>
                  </AnalysisPaper>
                )}

                <Card sx={{ mt: 2, bgcolor: 'info.main', color: 'info.contrastText' }}>
                  <CardContent>
                    <Typography variant="body2">
                      This analysis was generated by AI and should be used as a starting point for critical thinking, not as definitive judgment.
                    </Typography>
                  </CardContent>
                </Card>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                  Full Analysis:
                </Typography>
                <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <MarkdownContent>
                    <ReactMarkdown>{analysis || ""}</ReactMarkdown>
                  </MarkdownContent>
                </Box>
              </AnalysisSection>
            </Grid>
          </Grid>
        )}
      </ContentContainer>
    </DetailsContainer>
  );
};

export default DetailsComponent;