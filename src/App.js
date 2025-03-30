import React, { useState } from "react";
import { Container, CssBaseline, CircularProgress, Typography, Box } from "@mui/material";
import SearchComponent from "./components/SearchComponent";
import ResultsComponent from "./components/ResultsComponent";
import DetailsComponent from "./components/DetailsComponent";
import axios from "axios";

const apiUrl = process.env.REACT_APP_URL || ''; // Default to empty string if undefined
console.log('API URL:', process.env.REACT_APP_URL);

const App = () => {
  const [page, setPage] = useState("home");
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleContent, setArticleContent] = useState(null);
  const [articleAnalysis, setArticleAnalysis] = useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleView = async (articleId) => {
    try {
      setLoading(true);
      setError(null);

      // get original article content
      const selectedArticle = articles.find((article) => article.id === articleId);
      setSelectedArticle(selectedArticle);

      const parsedArticleResponse = await parseArticle(selectedArticle.url);
      const parsedArticle = typeof parsedArticleResponse.data === 'string'
        ? parsedArticleResponse.data
        : JSON.stringify(parsedArticleResponse.data);

      const originalArticle = `
      publisher: ${selectedArticle.publisher}\n
      Date: ${selectedArticle.publishedAt}\n
      Author: ${selectedArticle.author}\n
      title: ${selectedArticle.title}\n
      Article: ${parsedArticle}
      `;

      setArticleContent(originalArticle);

      // Start the article analysis and get the task ID
      const taskId = await startAnalysis(originalArticle);

      // Poll the server for the analysis result
      const pollInterval = setInterval(async () => {
        try {
          const result = await checkAnalysis(taskId);

          if (result.status === "completed") {
            clearInterval(pollInterval);

            // Handle the new response structure which may have nested content
            let analysisContent;
            if (result.result?.choices?.[0]?.message?.content) {
              // Original OpenAI response structure
              analysisContent = result.result.choices[0].message.content;
            } else if (typeof result.result === 'string') {
              // Direct string result
              analysisContent = result.result;
            } else {
              // Fallback for unexpected formats
              analysisContent = JSON.stringify(result.result);
            }

            setArticleAnalysis(analysisContent);
            setLoading(false);
            setPage("details");
          } else if (result.status === "failed") {
            clearInterval(pollInterval);
            setError(`Analysis failed: ${result.error || 'Unknown error'}`);
            setLoading(false);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setError(`Error checking analysis: ${error.message}`);
          setLoading(false);
        }
      }, 5000); // Poll every 5 seconds
    } catch (error) {
      setError(`Error initiating article analysis: ${error.message}`);
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${apiUrl}/api/search`,
        { query }
      );

      // Handle the new response structure which includes a status field
      const responseData = response.data;
      const articlesData = responseData.articles || responseData.data?.articles || [];

      const articles = articlesData.map((article, index) => ({
        id: index,
        title: article.title,
        url: article.url,
        author: article.author || 'Unknown',
        publisher: article.source?.name || article.publisher || 'Unknown Source',
        publishedAt: article.publishedAt
      }));

      setArticles(articles);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setError(`Error searching articles: ${error.message}`);
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedArticle(null);
    setArticleContent(null);
    setArticleAnalysis(null);
    setError(null);
    setPage("home");
  };

  const startAnalysis = async (content) => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/start-analysis`,
        { content }
      );

      // Handle the new response structure which includes a status field
      return response.data.taskId;
    } catch (error) {
      console.error("Error starting the article analysis:", error);
      throw error;
    }
  };

  const checkAnalysis = async (taskId) => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/check-analysis/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking the article analysis:", error);
      throw error;
    }
  };

  const parseArticle = async (url) => {
    try {
      return axios.get(
        `${apiUrl}/api/parse?url=${url}`
      );
    } catch (error) {
      console.error("Error parsing the article:", error);
      throw error;
    }
  };

  return (
    <div className="App">
      {loading ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="100vh"
        >
          <Box>
            <CircularProgress />
          </Box>
          <Box>
            <Typography variant="h4" color="textSecondary">
              A GPT magic is being brewed... Please be patient!
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <Container>
            <CssBaseline />
            {error && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            {page === "home" && (
              <>
                <SearchComponent onSearch={handleSearch} />
                <ResultsComponent articles={articles} onView={handleView} />
              </>
            )}
            {page === "details" && (
              <DetailsComponent
                article={articleContent}
                analysis={articleAnalysis}
                onBack={handleBack}
              />
            )}
          </Container>
        </>
      )}
    </div>
  );
};

export default App;